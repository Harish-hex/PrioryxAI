import SwiftUI

struct NextPriorityCard: View {
  let task: TaskItem
  let onDone: () -> Void
  @EnvironmentObject var auth: AuthManager
  
  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack {
        HStack(spacing: 6) {
          Text("⚡")
          Text("NEXT PRIORITY")
            .font(.captionSM)
            .fontWeight(.bold)
            .foregroundColor(Color.brandViolet)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Color.brandViolet.opacity(0.1))
        .clipShape(Capsule())
        
        Spacer()
        
        PXBadge(text: task.priority.label, style: badgeStyle(task.priority))
      }
      
      Text(task.title)
        .font(.titleMD)
        .foregroundColor(Color.labelPrimary)
        .padding(.top, 14)
        .lineLimit(2)
      
      if let desc = task.description {
        Text(desc)
          .font(.bodyMD)
          .foregroundColor(Color.labelSecondary)
          .padding(.top, 6)
          .lineLimit(2)
      }
      
      HStack(spacing: 10) {
        PXButton(title: "Mark Done", variant: .gradient, size: .sm) {
          onDone()
        }
        
        NavigationLink(destination: AssistantView()) {
          Text("AI Plan")
            .font(.captionLG)
            .fontWeight(.semibold)
            .foregroundColor(Color.labelPrimary)
            .frame(width: 80, height: 36)
            .background(Color.surface2)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
      }
      .padding(.top, 16)
    }
    .padding(18)
    .background(Color.surface1)
    .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    .shadow(color: Color.black.opacity(0.06), radius: 8, x: 0, y: 2)
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
