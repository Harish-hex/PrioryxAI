import SwiftUI

struct PXButton: View {
  enum Variant {
    case primary, secondary, gradient, ghost, danger
  }
  
  enum Size {
    case sm, md, lg
    
    var height: CGFloat {
      switch self {
      case .sm: return 36
      case .md: return 48
      case .lg: return 56
      }
    }
    
    var font: Font {
      switch self {
      case .sm: return .captionLG
      case .md: return .bodyMD
      case .lg: return .titleSM
      }
    }
  }
  
  let title: String
  var icon: String? = nil
  var variant: Variant = .primary
  var size: Size = .md
  var isLoading: Bool = false
  var disabled: Bool = false
  let action: () -> Void
  
  var body: some View {
    Button(action: {
      guard !disabled && !isLoading else { return }
      UIImpactFeedbackGenerator(style: .light).impactOccurred()
      action()
    }) {
      HStack(spacing: 8) {
        if isLoading {
          ProgressView()
            .tint(textColor)
        } else {
          if let icon = icon {
            Image(systemName: icon)
              .font(size.font)
          }
          Text(title)
            .font(size.font)
            .fontWeight(.semibold)
        }
      }
      .frame(maxWidth: .infinity)
      .frame(height: size.height)
      .background(backgroundView)
      .foregroundColor(textColor)
      .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .stroke(borderColor, lineWidth: variant == .secondary ? 1 : 0)
      )
      .opacity(disabled ? 0.5 : 1.0)
    }
    .disabled(disabled || isLoading)
  }
  
  @ViewBuilder
  private var backgroundView: some View {
    switch variant {
    case .gradient:
      LinearGradient.brand
    case .primary:
      Color.brandViolet
    case .secondary:
      Color.surface2
    case .ghost:
      Color.clear
    case .danger:
      Color.brandRed.opacity(0.12)
    }
  }
  
  private var textColor: Color {
    switch variant {
    case .gradient, .primary:
      return .white
    case .secondary:
      return .labelPrimary
    case .ghost:
      return .brandViolet
    case .danger:
      return .brandRed
    }
  }
  
  private var borderColor: Color {
    variant == .secondary ? Color.separator : Color.clear
  }
}
