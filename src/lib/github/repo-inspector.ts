// src/lib/github/repo-inspector.ts — Real repo-content signals via the GitHub
// REST API (file tree), used to detect structural/architectural gaps instead
// of scoring purely off metadata (description length, stars, pushedAt).

export interface RepoStructureSignals {
  hasReadme: boolean;
  readmeSizeBytes: number;
  hasTests: boolean;
  hasCI: boolean;
  hasDockerfile: boolean;
  hasDependencyManifest: boolean; // requirements.txt, package.json, pyproject.toml, environment.yml, Pipfile, go.mod, pom.xml
  dependencyManifestPath: string | null; // path to the manifest above, for security scanning
  isNotebookHeavy: boolean;       // mostly/only .ipynb, little to no modular source
  hasModelArtifacts: boolean;     // model.py/train.py/models dir/checkpoints — ML-shaped repo
  hasOrganizedStructure: boolean; // real folders (src/lib/app/etc) rather than a flat file dump
  fileCount: number;
  truncated: boolean; // GitHub truncates very large trees — treat signals as a lower bound
  /** Path to the repo's most architecturally significant source file, for deep-dive content analysis */
  keySourceFilePath: string | null;
}

interface GitTreeEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit';
  size?: number;
}

function parseOwnerRepo(url: string | null | undefined): { owner: string; repo: string } | null {
  if (!url) return null;
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)\/?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

async function githubRestFetch<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const TEST_PATTERN = /(^|\/)(tests?|__tests__|spec)(\/|$)|\.(test|spec)\.[jt]sx?$|_test\.py$|test_.*\.py$/i;
const CI_PATTERN = /^\.github\/workflows\/.+\.ya?ml$|^\.gitlab-ci\.ya?ml$|^\.circleci\/config\.ya?ml$/i;
const DEPENDENCY_MANIFESTS = [
  'requirements.txt', 'pyproject.toml', 'Pipfile', 'environment.yml', 'environment.yaml',
  'package.json', 'go.mod', 'pom.xml', 'build.gradle', 'Gemfile', 'composer.json',
];
const MODEL_PATTERN = /(^|\/)(model|models|train|training|checkpoints?|weights)(\/|\.py$|\.ipynb$)/i;
const ORGANIZED_DIR_PATTERN = /^(src|lib|app|packages|internal|cmd|pkg)\//i;

/**
 * Inspects a repo's real file tree (one GitHub REST call) to compute
 * structural signals — tests, CI, dependency manifests, notebook-only ML
 * code, folder organization — that go well beyond "does it have a
 * description". Fails soft (returns null) on any API error so a single
 * repo's inspection can never break the overall analysis.
 */
export async function inspectRepoStructure(repoUrl: string | null): Promise<RepoStructureSignals | null> {
  const parsed = parseOwnerRepo(repoUrl);
  if (!parsed) return null;
  const { owner, repo } = parsed;

  const repoInfo = await githubRestFetch<{ default_branch: string }>(`/repos/${owner}/${repo}`);
  if (!repoInfo?.default_branch) return null;

  const tree = await githubRestFetch<{ tree: GitTreeEntry[]; truncated: boolean }>(
    `/repos/${owner}/${repo}/git/trees/${repoInfo.default_branch}?recursive=1`
  );
  if (!tree?.tree) return null;

  const blobs = tree.tree.filter(e => e.type === 'blob');
  const paths = blobs.map(e => e.path);

  const readmeEntry = blobs.find(e => /^readme(\.md|\.rst|\.txt)?$/i.test(e.path));
  const notebookCount = paths.filter(p => p.endsWith('.ipynb')).length;
  const sourceCodeCount = paths.filter(p => /\.(py|js|jsx|ts|tsx|go|java|rb|rs|cpp|c|cs)$/i.test(p) && !p.endsWith('.ipynb')).length;

  // Pick the single most architecturally telling file to read for deep analysis:
  // prefer a model/training entry point (the core ML logic), else the largest
  // non-notebook source file (usually the main module/entry point).
  const modelFiles = blobs.filter(e => MODEL_PATTERN.test(e.path) && /\.(py|ipynb)$/i.test(e.path));
  const sourceBlobs = blobs.filter(e => /\.(py|js|jsx|ts|tsx|go|java|rb|rs|cpp|c|cs)$/i.test(e.path));
  const keySourceFile = (modelFiles.length > 0 ? modelFiles : sourceBlobs)
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))[0];
  // Prefer root-level manifests (rarely more than one per repo anyway).
  const manifestEntry = [...blobs]
    .filter(e => DEPENDENCY_MANIFESTS.includes(e.path.split('/').pop() ?? ''))
    .sort((a, b) => a.path.split('/').length - b.path.split('/').length)[0];

  return {
    hasReadme: !!readmeEntry,
    readmeSizeBytes: readmeEntry?.size ?? 0,
    hasTests: paths.some(p => TEST_PATTERN.test(p)),
    hasCI: paths.some(p => CI_PATTERN.test(p)),
    hasDockerfile: paths.some(p => /(^|\/)Dockerfile$/i.test(p)),
    hasDependencyManifest: !!manifestEntry,
    dependencyManifestPath: manifestEntry?.path ?? null,
    isNotebookHeavy: notebookCount > 0 && notebookCount >= sourceCodeCount,
    hasModelArtifacts: paths.some(p => MODEL_PATTERN.test(p)),
    hasOrganizedStructure: paths.some(p => ORGANIZED_DIR_PATTERN.test(p)),
    fileCount: paths.length,
    truncated: tree.truncated,
    keySourceFilePath: keySourceFile?.path ?? null,
  };
}

/**
 * Fetches and decodes the text content of one file in a repo via the GitHub
 * Contents API, truncated to a safe prompt size. Used to ground GitHub
 * Intelligence's architecture critique in actual code instead of file names
 * alone. Fails soft (returns null) on any error.
 */
export async function fetchFileContent(repoUrl: string | null, path: string, maxChars = 6000): Promise<string | null> {
  const parsed = parseOwnerRepo(repoUrl);
  if (!parsed) return null;
  const { owner, repo } = parsed;

  const file = await githubRestFetch<{ content?: string; encoding?: string }>(
    `/repos/${owner}/${repo}/contents/${path}`
  );
  if (!file?.content || file.encoding !== 'base64') return null;

  try {
    const decoded = Buffer.from(file.content, 'base64').toString('utf-8');
    return decoded.slice(0, maxChars);
  } catch {
    return null;
  }
}
