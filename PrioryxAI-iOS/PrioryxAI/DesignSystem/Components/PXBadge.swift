import SwiftUI

struct PXBadge: View {
  enum Style {
    case brand, primary, secondary, urgent, high, medium, low, pro
  }
  
  let text: String
  var style: Style = .secondary
  
  var body: some View {
    Text(text)
      .font(.captionSM)
      .fontWeight(.semibold)
      .padding(.horizontal, 10)
      .padding(.vertical, 4)
      .background(backgroundColor)
      .foregroundColor(textColor)
      .clipShape(Capsule())
  }
  
  private var backgroundColor: Color {
    switch style {
    case .brand:
      return Color.brandViolet.opacity(0.12)
    case .primary:
      return Color.brandViolet
    case .secondary:
      return Color.surface2
    case .urgent:
      return Color.brandRed.opacity(0.12)
    case .high:
      return Color.brandAmber.opacity(0.15)
    case .medium:
      return Color.brandAmber.opacity(0.1)
    case .low:
      return Color.brandEmerald.opacity(0.12)
    case .pro:
      return Color.brandCyan.opacity(0.15)
    }
  }
  
  private var textColor: Color {
    switch style {
    case .brand:
      return Color.brandViolet
    case .primary:
      return .white
    case .secondary:
      return Color.labelSecondary
    case .urgent:
      return Color.brandRed
    case .high:
      return Color(hex: "#F97316")
    case .medium:
      return Color(hex: "#EAB308")
    case .low:
      return Color.brandEmerald
    case .pro:
      return Color.brandCyan
    }
  }
}
