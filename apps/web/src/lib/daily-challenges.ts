import codingSheetData from "@/data/coding-sheet.json";

export interface CodingProblem {
  id: string;
  index: number;
  title: string;
  category: string;
  topic: string;
  problemLink: string | null;
  solutionVideo: string | null;
  youtubeId: string | null;
  solutionArticle: string | null;
  difficulty: "Easy" | "Medium" | "Hard";
}

export const ALL_CODING_PROBLEMS: CodingProblem[] = codingSheetData as CodingProblem[];

/**
 * Get 3 deterministic daily coding challenges for a given date.
 * Picks 1 Easy, 1 Medium, and 1 Hard problem rotating each calendar day.
 */
export function getDailyChallenges(dateInput?: Date | string): CodingProblem[] {
  const date = dateInput ? new Date(dateInput) : new Date();
  
  // Calculate day index from epoch days (in UTC/local)
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const yearOffset = (date.getFullYear() - 2024) * 365;
  const dayIndex = Math.max(0, dayOfYear + yearOffset);

  const easyList = ALL_CODING_PROBLEMS.filter((p) => p.difficulty === "Easy");
  const mediumList = ALL_CODING_PROBLEMS.filter((p) => p.difficulty === "Medium");
  const hardList = ALL_CODING_PROBLEMS.filter((p) => p.difficulty === "Hard");

  const easyPick = easyList.length > 0
    ? easyList[dayIndex % easyList.length]
    : ALL_CODING_PROBLEMS[(dayIndex * 3) % ALL_CODING_PROBLEMS.length];

  const mediumPick = mediumList.length > 0
    ? mediumList[(dayIndex + 7) % mediumList.length]
    : ALL_CODING_PROBLEMS[(dayIndex * 3 + 1) % ALL_CODING_PROBLEMS.length];

  const hardPick = hardList.length > 0
    ? hardList[(dayIndex + 13) % hardList.length]
    : ALL_CODING_PROBLEMS[(dayIndex * 3 + 2) % ALL_CODING_PROBLEMS.length];

  return [easyPick, mediumPick, hardPick].filter(Boolean);
}

/**
 * Get all questions that have YouTube video solutions, grouped by category.
 */
export function getCuriousFreaksVideos(): Record<string, CodingProblem[]> {
  const grouped: Record<string, CodingProblem[]> = {};

  for (const item of ALL_CODING_PROBLEMS) {
    if (item.youtubeId) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
  }

  return grouped;
}
