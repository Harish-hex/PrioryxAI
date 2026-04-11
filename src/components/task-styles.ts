export const priorityStyles: Record<string, { label: string; dot: string; pill: string }> = {
  red: {
    label: "High priority",
    dot: "bg-signal shadow-[0_0_18px_rgba(255,77,125,0.55)]",
    pill: "border border-signal/25 bg-signal/10 text-signal",
  },
  amber: {
    label: "Medium priority",
    dot: "bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.5)]",
    pill: "border border-amber-300/25 bg-amber-300/10 text-amber-200",
  },
  green: {
    label: "Low risk",
    dot: "bg-mint shadow-[0_0_18px_rgba(70,242,165,0.5)]",
    pill: "border border-mint/25 bg-mint/10 text-mint",
  },
};

export const typeStyles: Record<string, string> = {
  exam: "border border-rose-300/20 bg-rose-300/10 text-rose-200",
  assignment: "border border-volt/20 bg-volt/10 text-cyan-100",
  job: "border border-aura/25 bg-aura/10 text-violet-100",
  manual: "border border-mint/20 bg-mint/10 text-emerald-100",
  // Legacy capitalised keys (frontend demo used these)
  Exam: "border border-rose-300/20 bg-rose-300/10 text-rose-200",
  Assignment: "border border-volt/20 bg-volt/10 text-cyan-100",
  Job: "border border-aura/25 bg-aura/10 text-violet-100",
  GitHub: "border border-mint/20 bg-mint/10 text-emerald-100",
};
