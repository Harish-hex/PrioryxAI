import SwiftUI

struct EmptyStateView: View {
  var emoji: String = "✨"
  let title: String
  var description: String? = nil
  var actionTitle: String? = nil
  var action: (() -> Void)? = nil
  
  var body: some View {
    VStack(spacing: 12) {
      ZStack {
        Circle()
          .fill(Color.surface2)
          .frame(width: 72, height: 72)
        Text(emoji)
          .font(.system(size: 36))
      }
      
      Text(title)
        .font(.titleMD)
        .foregroundColor(Color.labelPrimary)
        .multilineTextAlignment(.center)
      
      if let description = description {
        Text(description)
          .font(.bodyMD)
          .foregroundColor(Color.labelSecondary)
          .multilineTextAlignment(.center)
          .padding(.horizontal, 24)
      }
      
      if let actionTitle = actionTitle, let action = action {
        PXButton(title: actionTitle, variant: .gradient, size: .sm, action: action)
          .frame(maxWidth: 200)
          .padding(.top, 8)
      }
    }
    .padding(.vertical, 32)
  }
}
