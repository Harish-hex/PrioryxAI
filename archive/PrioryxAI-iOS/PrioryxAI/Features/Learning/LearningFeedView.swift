import SwiftUI
import SafariServices

struct VideoItem: Identifiable {
  let id = UUID()
  let title: String
  let channel: String
  let duration: String
  let category: String
  let views: String
  let url: String
}

struct LearningFeedView: View {
  @State private var selectedCategory = "All"
  @State private var openURL: URL? = nil
  
  let categories = ["All", "DSA & LeetCode", "System Design", "Fullstack", "AI & ML", "Interview Prep"]
  
  let videos: [VideoItem] = [
    VideoItem(
      title: "Top 15 Dynamic Programming Patterns for FAANG",
      channel: "NeetCode",
      duration: "42:15",
      category: "DSA & LeetCode",
      views: "340K views",
      url: "https://www.youtube.com/watch?v=Hdr64lKQ3e4"
    ),
    VideoItem(
      title: "Design a Distributed Message Queue like Kafka",
      channel: "Gaurav Sen",
      duration: "28:40",
      category: "System Design",
      views: "520K views",
      url: "https://www.youtube.com/watch?v=kGZmsU7l870"
    ),
    VideoItem(
      title: "Building Production REST & gRPC Microservices in Go",
      channel: "Tech With Tim",
      duration: "35:10",
      category: "Fullstack",
      views: "180K views",
      url: "https://www.youtube.com/watch?v=un6ZyFkqFKo"
    )
  ]
  
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          // Category horizontal scroll
          ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
              ForEach(categories, id: \.self) { cat in
                Button(action: { selectedCategory = cat }) {
                  Text(cat)
                    .font(.captionLG)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(selectedCategory == cat ? Color.brandViolet : Color.surface2)
                    .foregroundColor(selectedCategory == cat ? .white : Color.labelPrimary)
                    .clipShape(Capsule())
                }
              }
            }
            .padding(.horizontal, 16)
          }
          
          VStack(spacing: 14) {
            ForEach(videos) { video in
              Button(action: {
                if let url = URL(string: video.url) {
                  openURL = url
                }
              }) {
                VStack(alignment: .leading, spacing: 10) {
                  ZStack(alignment: .bottomTrailing) {
                    RoundedRectangle(cornerRadius: 16)
                      .fill(Color.black.opacity(0.85))
                      .frame(height: 180)
                      .overlay(
                        Image(systemName: "play.circle.fill")
                          .font(.system(size: 44))
                          .foregroundColor(.white.opacity(0.8))
                      )
                    
                    Text(video.duration)
                      .font(.captionSM)
                      .fontWeight(.bold)
                      .foregroundColor(.white)
                      .padding(.horizontal, 6)
                      .padding(.vertical, 3)
                      .background(Color.black.opacity(0.7))
                      .clipShape(RoundedRectangle(cornerRadius: 4))
                      .padding(8)
                  }
                  
                  VStack(alignment: .leading, spacing: 4) {
                    HStack {
                      PXBadge(text: video.category, style: .brand)
                      Spacer()
                      Text(video.views)
                        .font(.captionSM)
                        .foregroundColor(Color.labelTertiary)
                    }
                    
                    Text(video.title)
                      .font(.titleSM)
                      .foregroundColor(Color.labelPrimary)
                      .multilineTextAlignment(.leading)
                      .lineLimit(2)
                    
                    Text(video.channel)
                      .font(.captionSM)
                      .fontWeight(.semibold)
                      .foregroundColor(Color.labelSecondary)
                  }
                  .padding(.horizontal, 4)
                }
                .padding(12)
                .background(Color.surface1)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
              }
            }
          }
          .padding(.horizontal, 16)
        }
        .padding(.vertical, 8)
        .padding(.bottom, 100)
      }
      .navigationTitle("Learning Feed 🧭")
      .sheet(item: $openURL) { url in
        SafariView(url: url)
      }
    }
  }
}

extension URL: @retroactive Identifiable {
  public var id: String { absoluteString }
}

struct SafariView: UIViewControllerRepresentable {
  let url: URL
  func makeUIViewController(context: Context) -> SFSafariViewController {
    SFSafariViewController(url: url)
  }
  func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}
