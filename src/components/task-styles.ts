export const priorityStyles: Record<string, { label: string; dot: string; pill: string }> = {
  red: {
    label: "High priority",
    dot: "bg-rose-500",
    pill: "border border-rose-200 bg-rose-50 text-rose-700",
  },
  amber: {
    label: "Medium priority",
    dot: "bg-amber-500",
    pill: "border border-amber-200 bg-amber-50 text-amber-700",
  },
  green: {
    label: "Low risk",
    dot: "bg-emerald-500",
    pill: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export const typeStyles: Record<string, string> = {
  exam: "border border-rose-200 bg-rose-50 text-rose-700",
  assignment: "border border-blue-200 bg-blue-50 text-blue-700",
  job: "border border-violet-200 bg-violet-50 text-violet-700",
  manual: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  // Legacy capitalised keys
  Exam: "border border-rose-200 bg-rose-50 text-rose-700",
  Assignment: "border border-blue-200 bg-blue-50 text-blue-700",
  Job: "border border-violet-200 bg-violet-50 text-violet-700",
  GitHub: "border border-emerald-200 bg-emerald-50 text-emerald-700",
};
