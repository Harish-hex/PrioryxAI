import SwiftUI

struct PXCardModifier: ViewModifier {
  var cornerRadius: CGFloat = 20
  var padding: CGFloat = 16
  
  func body(content: Content) -> some View {
    content
      .padding(padding)
      .background(Color.surface1)
      .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
      .shadow(color: Color.black.opacity(0.06), radius: 8, x: 0, y: 2)
  }
}

extension View {
  func pxCard(cornerRadius: CGFloat = 20, padding: CGFloat = 16) -> some View {
    self.modifier(PXCardModifier(cornerRadius: cornerRadius, padding: padding))
  }
}
