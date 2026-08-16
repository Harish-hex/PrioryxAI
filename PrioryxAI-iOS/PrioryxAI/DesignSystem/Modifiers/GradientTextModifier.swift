import SwiftUI

struct GradientTextModifier: ViewModifier {
  var gradient: LinearGradient = .brand
  
  func body(content: Content) -> some View {
    content
      .overlay(gradient)
      .mask(content)
  }
}

extension View {
  func gradientText(gradient: LinearGradient = .brand) -> some View {
    self.modifier(GradientTextModifier(gradient: gradient))
  }
}
