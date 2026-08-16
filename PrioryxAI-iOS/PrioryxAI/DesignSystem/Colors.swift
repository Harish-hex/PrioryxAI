import SwiftUI

extension Color {
  // Brand Colors
  static let brandViolet = Color(hex: "#7C3AED")
  static let brandCyan   = Color(hex: "#06B6D4")
  static let brandEmerald = Color(hex: "#10B981")
  static let brandAmber  = Color(hex: "#F59E0B")
  static let brandRed    = Color(hex: "#EF4444")
  
  // Adaptive Semantic Surfaces & Backgrounds
  static let bgPrimary   = Color(uiColor: .systemBackground)
  static let bgSecondary = Color(uiColor: .secondarySystemBackground)
  static let bgGrouped   = Color(uiColor: .systemGroupedBackground)
  static let surface1    = Color(uiColor: .systemBackground)
  static let surface2    = Color(uiColor: .secondarySystemBackground)
  static let surface3    = Color(uiColor: .tertiarySystemBackground)
  
  // Labels
  static let labelPrimary   = Color(uiColor: .label)
  static let labelSecondary = Color(uiColor: .secondaryLabel)
  static let labelTertiary  = Color(uiColor: .tertiaryLabel)
  static let separator      = Color(uiColor: .separator)
  
  init(hex: String) {
    let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var int: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&int)
    let r = Double((int >> 16) & 0xFF) / 255
    let g = Double((int >> 8)  & 0xFF) / 255
    let b = Double(int & 0xFF) / 255
    self.init(red: r, green: g, blue: b)
  }
}

extension LinearGradient {
  static let brand = LinearGradient(
    colors: [.brandViolet, .brandCyan],
    startPoint: .topLeading, endPoint: .bottomTrailing
  )
  static let success = LinearGradient(
    colors: [.brandEmerald, .brandCyan],
    startPoint: .topLeading, endPoint: .bottomTrailing
  )
  static let warm = LinearGradient(
    colors: [.brandAmber, .brandRed],
    startPoint: .topLeading, endPoint: .bottomTrailing
  )
}
