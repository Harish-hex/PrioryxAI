// src/lib/github/security-scanner.ts — Dependency vulnerability scanning via
// OSV.dev's free, keyless batch API. Inspired by RepoMind's security-scan
// feature; kept intentionally lightweight (one manifest file, one batch call)
// so it never becomes the slow/expensive part of an analysis run.

export interface VulnerablePackage {
  name: string;
  version: string;
  vulnerabilityIds: string[]; // e.g. ["GHSA-xxxx-xxxx-xxxx", "CVE-2023-..."]
}

const OSV_ECOSYSTEM_BY_MANIFEST: Record<string, 'npm' | 'PyPI'> = {
  'package.json': 'npm',
  'requirements.txt': 'PyPI',
};

function parseNpmDependencies(content: string): Array<{ name: string; version: string }> {
  try {
    const pkg = JSON.parse(content);
    const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
    return Object.entries(deps)
      .map(([name, range]) => ({ name, version: String(range).replace(/^[\^~>=<]+/, '') }))
      .filter((d) => /^\d/.test(d.version)); // skip "workspace:*", "latest", git urls, etc.
  } catch {
    return [];
  }
}

function parseRequirementsTxt(content: string): Array<{ name: string; version: string }> {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const match = line.match(/^([A-Za-z0-9_.-]+)\s*==\s*([A-Za-z0-9_.+-]+)/);
      return match ? { name: match[1], version: match[2] } : null;
    })
    .filter((d): d is { name: string; version: string } => d !== null);
}

/**
 * Scans a dependency manifest's raw content for known vulnerabilities via
 * OSV.dev. Fails soft (returns []) on any parse/network error — a broken scan
 * must never break the surrounding repo analysis.
 */
export async function scanDependenciesForVulnerabilities(
  manifestPath: string,
  manifestContent: string
): Promise<VulnerablePackage[]> {
  const filename = manifestPath.split('/').pop() ?? '';
  const ecosystem = OSV_ECOSYSTEM_BY_MANIFEST[filename];
  if (!ecosystem) return []; // only npm/PyPI supported for now — the two most common manifests we detect

  const packages = ecosystem === 'npm' ? parseNpmDependencies(manifestContent) : parseRequirementsTxt(manifestContent);
  if (packages.length === 0) return [];

  // OSV's batch endpoint caps at 1000 queries; our manifests are always far smaller.
  const queries = packages.map((p) => ({
    version: p.version,
    package: { name: p.name, ecosystem },
  }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries }),
      signal: controller.signal,
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { results?: Array<{ vulns?: Array<{ id: string }> }> };
    const results = data.results ?? [];

    const vulnerable: VulnerablePackage[] = [];
    for (let i = 0; i < packages.length; i++) {
      const vulns = results[i]?.vulns;
      if (vulns && vulns.length > 0) {
        vulnerable.push({ name: packages[i].name, version: packages[i].version, vulnerabilityIds: vulns.map((v) => v.id) });
      }
    }
    return vulnerable;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
