import SwiftUI

struct ScoreRingView: View {
  let score: Int
  var size: CGFloat = 80
  var label: String? = nil
  @State private var animatedScore: Double = 0
  
  var ringColor: Color {
    switch score {
    case 0..<40:  return .brandRed
    case 40..<60: return .brandAmber
    case 60..<80: return Color(hex: "#3B82F6")
    default:      return .brandEmerald
    }
  }
  
  var progress: Double { Double(min(100, max(0, score))) / 100.0 }
  
  var body: some View {
    ZStack {
      Circle()
        .stroke(Color.surface3, lineWidth: size * 0.1)
      
      Circle()
        .trim(from: 0, to: animatedScore)
        .stroke(
          ringColor,
          style: StrokeStyle(lineWidth: size * 0.1, lineCap: .round)
        )
        .rotationEffect(.degrees(-90))
        .animation(.easeOut(duration: 0.8), value: animatedScore)
      
      VStack(spacing: 1) {
        Text("\(score)")
          .font(.system(size: size * 0.28, weight: .bold))
          .foregroundColor(Color.labelPrimary)
        if let label = label {
          Text(label)
            .font(.system(size: size * 0.13, weight: .medium))
            .foregroundColor(Color.labelSecondary)
        } else {
          Text("/ 100")
            .font(.system(size: size * 0.12))
            .foregroundColor(Color.labelTertiary)
        }
      }
    }
    .frame(width: size, height: size)
    .onAppear { animatedScore = progress }
    .onChange(of: score) { animatedScore = progress }
  }
}
