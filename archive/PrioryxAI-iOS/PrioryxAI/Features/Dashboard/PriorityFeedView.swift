import SwiftUI

struct PriorityFeedView: View {
  let tasks: [TaskItem]
  let onDone: (TaskItem) -> Void
  let onDelete: (TaskItem) -> Void
  
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("PRIORITY FEED (\(tasks.count))")
        .font(.captionSM)
        .fontWeight(.bold)
        .foregroundColor(Color.labelSecondary)
      
      if tasks.isEmpty {
        EmptyStateView(
          emoji: "🎯",
          title: "No tasks pending",
          description: "Add assignments or timetable classes to let PrioryxAI prioritize your week."
        )
      } else {
        VStack(spacing: 8) {
          ForEach(tasks) { task in
            TaskRowView(
              task: task,
              onDone: { onDone(task) },
              onDelete: { onDelete(task) }
            )
          }
        }
      }
    }
  }
}
