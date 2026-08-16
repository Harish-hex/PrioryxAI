import SwiftUI

struct SkeletonView: View {
  var width: CGFloat? = nil
  var height: CGFloat = 20
  var cornerRadius: CGFloat = 12
  @State private var isAnimating = false
  
  var body: some View {
    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
      .fill(Color.surface3)
      .frame(width: width, height: height)
      .opacity(isAnimating ? 0.4 : 0.8)
      .animation(
        Animation.easeInOut(duration: 0.8)
          .repeatForever(autoreverses: true),
        value: isAnimating
      )
      .onAppear { isAnimating = true }
  }
}
