import SwiftUI

struct PXCard<Content: View>: View {
  var cornerRadius: CGFloat = 20
  var padding: CGFloat = 16
  @ViewBuilder let content: () -> Content
  
  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      content()
    }
    .padding(padding)
    .background(Color.surface1)
    .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    .shadow(color: Color.black.opacity(0.06), radius: 8, x: 0, y: 2)
  }
}
