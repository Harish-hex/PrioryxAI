import SwiftUI

extension Font {
  static let titleXL   = Font.system(size: 28, weight: .bold, design: .default)
  static let titleLG   = Font.system(size: 24, weight: .bold)
  static let titleMD   = Font.system(size: 20, weight: .semibold)
  static let titleSM   = Font.system(size: 17, weight: .semibold)
  static let bodyLG    = Font.system(size: 17, weight: .regular)
  static let bodyMD    = Font.system(size: 15, weight: .regular)
  static let bodySM    = Font.system(size: 13, weight: .regular)
  static let captionLG = Font.system(size: 12, weight: .medium)
  static let captionSM = Font.system(size: 11, weight: .regular)
  static let overline  = Font.system(size: 11, weight: .medium).uppercaseSmallCaps()
  static let mono      = Font.system(size: 13, design: .monospaced)
}
