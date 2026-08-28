import SwiftUI

struct TaskRowView: View {
  let task: TaskItem
  let onDone: () -> Void
  let onDelete: () -> Void
  
  var body: some View {
    HStack(alignment: .top, spacing: 12) {
      Button(action: {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        onDone()
      }) {
        RoundedRectangle(cornerRadius: 6)
          .stroke(task.effectivePriority == .urgent ? Color.brandRed : Color.brandViolet, lineWidth: 2)
          .frame(width: 20, height: 20)
      }
      .padding(.top, 2)

      VStack(alignment: .leading, spacing: 4) {
        HStack(spacing: 6) {
          PXBadge(text: task.effectivePriority.label, style: badgeStyle(task.effectivePriority))
          if let subject = task.subject {
            PXBadge(text: subject, style: .secondary)
          }
        }
        
        Text(task.title)
          .font(.bodyMD)
          .fontWeight(.medium)
          .foregroundColor(Color.labelPrimary)
          .lineLimit(2)
      }
      
      Spacer()
    }
    .padding(14)
    .background(Color.surface1)
    .clipShape(RoundedRectangle(cornerRadius: 18))
    .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
    .swipeActions(edge: .leading) {
      Button {
        onDone()
      } label: {
        Label("Done", systemImage: "checkmark")
      }
      .tint(Color.brandEmerald)
    }
    .swipeActions(edge: .trailing) {
      Button(role: .destructive) {
        onDelete()
      } label: {
        Label("Delete", systemImage: "trash")
      }
    }
  }
  
  private func badgeStyle(_ p: TaskItem.Priority) -> PXBadge.Style {
    switch p {
    case .urgent: return .urgent
    case .high: return .high
    case .medium: return .medium
    case .low: return .low
    }
  }
}
