import { CATALOG, isCurated, listRoadmaps } from "./data";

// Extra keyword aliases per curated roadmap id, since a resume/stream signal
// rarely says the roadmap's exact label (e.g. "React" or "Postgres" should
// still match the "frontend"/"sql" roadmaps).
const ALIASES: Record<string, string[]> = {
  "ai-engineer": ["ai", "llm", "openai", "gpt", "langchain", "machine learning", "genai", "artificial intelligence"],
  frontend: ["react", "next.js", "nextjs", "vue", "angular", "html", "css", "ui"],
  backend: ["node", "node.js", "express", "api", "server"],
  "full-stack": ["fullstack", "mern", "mean"],
  python: ["django", "flask", "pandas", "numpy"],
  sql: ["postgres", "postgresql", "mysql", "database"],
  javascript: ["js", "es6", "typescript"],
  typescript: ["ts"],
  react: ["reactjs", "jsx"],
  nodejs: ["node", "express", "node.js"],
  devops: ["docker", "kubernetes", "ci/cd", "cicd", "aws", "cloud"],
  "machine-learning": ["ml", "deep learning", "pytorch", "tensorflow", "scikit-learn"],
  "datastructures-and-algorithms": ["dsa", "algorithms", "data structures", "leetcode"],
  "system-design": ["architecture", "scalability", "distributed systems"],
  "git-github": ["git", "version control"],
  "data-analyst": ["data analysis", "excel", "tableau", "power bi", "powerbi"],
  "data-engineer": ["etl", "airflow", "data pipeline", "spark"],
  "ai-data-scientist": ["data science", "data scientist"],
  android: ["kotlin", "android studio"],
  ios: ["swift", "swiftui", "xcode"],
  "api-design": ["rest", "graphql", "openapi"],
  "bi-analyst": ["business intelligence", "power bi", "tableau"],
  blockchain: ["solidity", "web3", "ethereum", "smart contract"],
  "cyber-security": ["security", "penetration testing", "ethical hacking", "infosec"],
  devrel: ["developer relations", "community"],
  devsecops: ["security automation"],
  "engineering-manager": ["management", "leadership", "team lead"],
  "forward-deployed-engineer": ["fde", "solutions engineer", "customer engineer"],
  mlops: ["ml ops", "model deployment"],
  "network-engineer": ["networking", "ccna", "cisco"],
  "postgresql-dba": ["postgres", "dba", "database administrator"],
  "product-manager": ["product management", "pm", "roadmapping"],
  qa: ["testing", "test automation", "selenium", "cypress", "quality assurance"],
  "server-side-game-developer": ["game server", "multiplayer"],
  "software-architect": ["architecture", "system design"],
  "technical-writer": ["documentation", "content writing"],
  "ux-design": ["ui/ux", "figma", "user experience", "design"],
  "game-developer": ["unity", "unreal", "game dev"],
};

export interface RoadmapMatch {
  id: string;
  label: string;
  score: number;
  matchedOn: string[];
}

/**
 * Scores every curated roadmap against a list of free-text signals (onboarding
 * stream, resume skills, profile subjects, etc.) and returns matches ordered
 * by relevance. A signal matching the roadmap's own label/id scores highest;
 * an alias keyword match scores lower but still counts.
 */
export function matchRoadmaps(signals: string[]): RoadmapMatch[] {
  const normalizedSignals = signals
    .filter(Boolean)
    .map((s) => s.toLowerCase().trim())
    .filter((s) => s.length > 1);

  if (normalizedSignals.length === 0) return [];

  const results: RoadmapMatch[] = [];

  for (const roadmap of listRoadmaps()) {
    const catalogEntry = CATALOG.find((c) => c.id === roadmap.id);
    const label = (catalogEntry?.label ?? roadmap.label).toLowerCase();
    const idWords = roadmap.id.replace(/-/g, " ").toLowerCase();
    const aliases = ALIASES[roadmap.id] ?? [];

    let score = 0;
    const matchedOn: string[] = [];

    for (const signal of normalizedSignals) {
      if (signal === label || signal === idWords) {
        score += 3;
        matchedOn.push(signal);
      } else if (label.includes(signal) || signal.includes(label) || idWords.includes(signal)) {
        score += 2;
        matchedOn.push(signal);
      } else if (aliases.some((a) => signal.includes(a) || a.includes(signal))) {
        score += 1;
        matchedOn.push(signal);
      }
    }

    if (score > 0) {
      results.push({ id: roadmap.id, label: catalogEntry?.label ?? roadmap.label, score, matchedOn: Array.from(new Set(matchedOn)) });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function isRoadmapCurated(id: string): boolean {
  return isCurated(id);
}
