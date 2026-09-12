// Single source of truth for what Pro unlocks, so every "Upgrade to Pro"
// surface in the app (in-app modal, /pricing page, landing page pricing
// section, and any per-feature paywall CTA) shows the same, up-to-date list
// instead of three independently hand-maintained copies that drift out of
// sync with what's actually gated in code.
export interface ProFeature {
  label: string;
  /** Optional one-line elaboration — shown in the detailed in-app modal, omitted in compact list views. */
  sub?: string;
}

export const PRO_FEATURES: ProFeature[] = [
  { label: "Unlimited AI assistant messages", sub: "No daily cap, GPT-4o, context aware" },
  { label: "Full priority task feed", sub: "All matches ranked, no 5-task cap" },
  { label: "All matching jobs unlocked", sub: "Free plan shows only your top 3 matches" },
  { label: "Full roadmap unlocked", sub: "Video + certification on every subtopic, not just the first 2" },
  { label: "Plan with AI on any task", sub: "Instant action plan per deadline" },
  { label: "Priority scoring (0–100)", sub: "See which task to do first and why" },
  { label: "10 timetable scans/day with OCR", sub: "PDF, DOC, image — all formats" },
  { label: "Auto GitHub sync every 6 hours", sub: "Fresher repo health & streak analytics" },
  { label: "Project Foundry — 9 AI project roadmaps", sub: "Generated from your resume skill gaps" },
  { label: "Resume Intelligence", sub: "64+ skill extraction & SWOT analysis" },
  { label: "LeetCode + HackerRank automation", sub: "Placement readiness score card" },
  { label: "Peer Collab — 1v1 DSA duels & challenges", sub: "" },
  { label: "Pro badge on public profile", sub: "Visible to recruiters" },
  { label: "Priority Discord & email support", sub: "" },
];

/** What the free plan already includes vs. what's locked — used by the
 * detailed in-app comparison view (pricing-modal.tsx). Compact marketing
 * surfaces (landing page, /pricing) only need PRO_FEATURES above. */
export const FREE_TIER_ITEMS: { label: string; locked: boolean }[] = [
  { label: "5 AI-ranked tasks visible", locked: false },
  { label: "3 AI messages/day", locked: false },
  { label: "Top 3 job matches", locked: false },
  { label: "First 2 subtopics per roadmap topic", locked: false },
  { label: "Unlimited timetable uploads", locked: false },
  { label: "Basic public profile", locked: false },
  { label: "Plan with AI", locked: true },
  { label: "Priority scoring", locked: true },
  { label: "Auto GitHub sync", locked: true },
];
