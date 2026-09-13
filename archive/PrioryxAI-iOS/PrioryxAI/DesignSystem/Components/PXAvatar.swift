import SwiftUI

struct PXAvatar: View {
  let initials: String
  var imageURL: URL? = nil
  var size: CGFloat = 40
  
  var body: some View {
    ZStack {
      Circle()
        .fill(LinearGradient.brand)
        .frame(width: size, height: size)
      
      Text(initials.uppercased())
        .font(.system(size: size * 0.4, weight: .bold))
        .foregroundColor(.white)
    }
  }
}
