import SwiftUI
import UniformTypeIdentifiers

struct ResumeView: View {
  @State private var atsScore: Int = 82
  @State private var extractedSkills = ["React", "TypeScript", "Go", "PostgreSQL", "Docker", "REST APIs", "Git", "TailwindCSS"]
  @State private var missingSkills = ["Redis Caching", "Kafka / RabbitMQ", "Kubernetes", "CI/CD Pipelines"]
  @State private var isImporting = false
  @State private var isAnalyzing = false
  
  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        // ATS Score Hero
        HStack(spacing: 18) {
          ScoreRingView(score: atsScore, size: 92, label: "ATS Score")
          
          VStack(alignment: .leading, spacing: 4) {
            Text(atsScore >= 80 ? "Strong Tier 1 Profile" : "Target Gaps Found")
              .font(.titleMD)
              .fontWeight(.bold)
            
            Text("Evaluated against 1,200+ SDE job descriptions at top product firms.")
              .font(.bodySM)
              .foregroundColor(Color.labelSecondary)
          }
        }
        .padding(18)
        .background(Color.surface1)
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
        
        // Upload Card
        VStack(spacing: 12) {
          ZStack {
            Circle()
              .fill(Color.brandViolet.opacity(0.1))
              .frame(width: 60, height: 60)
            Text("📄").font(.system(size: 28))
          }
          
          Text("Upload or Update Resume")
            .font(.titleSM)
            .fontWeight(.semibold)
          
          Text("PDF or DOCX. AI extracts 64+ technical competencies & ATS gaps.")
            .font(.captionLG)
            .foregroundColor(Color.labelSecondary)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 16)
          
          if isAnalyzing {
            ProgressView("Analyzing resume with AI...")
              .padding(.top, 8)
          } else {
            PXButton(title: "Select File", variant: .gradient, size: .sm) {
              isImporting = true
            }
            .frame(maxWidth: 160)
            .padding(.top, 4)
          }
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(Color.surface1)
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .overlay(
          RoundedRectangle(cornerRadius: 22)
            .stroke(Color.brandViolet.opacity(0.3), style: StrokeStyle(lineWidth: 1.5, dash: [6]))
        )
        
        // Extracted Skills
        VStack(alignment: .leading, spacing: 10) {
          Text("DETECTED TECHNICAL SKILLS (\(extractedSkills.count))")
            .font(.captionSM)
            .fontWeight(.bold)
            .foregroundColor(Color.labelSecondary)
          
          FlowLayout(spacing: 8) {
            ForEach(extractedSkills, id: \.self) { skill in
              Text(skill)
                .font(.captionLG)
                .fontWeight(.semibold)
                .foregroundColor(Color.brandViolet)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.brandViolet.opacity(0.1))
                .clipShape(Capsule())
            }
          }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.surface1)
        .clipShape(RoundedRectangle(cornerRadius: 22))
        
        // Missing Keywords
        VStack(alignment: .leading, spacing: 10) {
          Text("RECOMMENDED MISSING KEYWORDS")
            .font(.captionSM)
            .fontWeight(.bold)
            .foregroundColor(Color.brandAmber)
          
          Text("Add projects using these tools to boost placement shortlisting:")
            .font(.captionLG)
            .foregroundColor(Color.labelSecondary)
          
          FlowLayout(spacing: 8) {
            ForEach(missingSkills, id: \.self) { skill in
              Text("+ \(skill)")
                .font(.captionLG)
                .fontWeight(.bold)
                .foregroundColor(Color.brandAmber)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.brandAmber.opacity(0.12))
                .clipShape(Capsule())
            }
          }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.surface1)
        .clipShape(RoundedRectangle(cornerRadius: 22))
      }
      .padding(16)
    }
    .navigationTitle("Resume Intelligence 📄")
    .navigationBarTitleDisplayMode(.inline)
    .fileImporter(
      isPresented: $isImporting,
      allowedContentTypes: [.pdf, .plainText],
      allowsMultipleSelection: false
    ) { result in
      if let _ = try? result.get().first {
        isAnalyzing = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
          isAnalyzing = false
          atsScore = 88
          extractedSkills.append("AWS")
          extractedSkills.append("Python")
          UINotificationFeedbackGenerator().notificationOccurred(.success)
        }
      }
    }
  }
}

// Simple FlowLayout for skill chips
struct FlowLayout: Layout {
  var spacing: CGFloat = 8
  
  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let width = proposal.width ?? 300
    var height: CGFloat = 0
    var currentX: CGFloat = 0
    var currentY: CGFloat = 0
    var rowHeight: CGFloat = 0
    
    for subview in subviews {
      let size = subview.sizeThatFits(.unspecified)
      if currentX + size.width > width {
        currentX = 0
        currentY += rowHeight + spacing
        rowHeight = 0
      }
      currentX += size.width + spacing
      rowHeight = max(rowHeight, size.height)
    }
    height = currentY + rowHeight
    return CGSize(width: width, height: height)
  }
  
  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    var currentX: CGFloat = bounds.minX
    var currentY: CGFloat = bounds.minY
    var rowHeight: CGFloat = 0
    
    for subview in subviews {
      let size = subview.sizeThatFits(.unspecified)
      if currentX + size.width > bounds.maxX {
        currentX = bounds.minX
        currentY += rowHeight + spacing
        rowHeight = 0
      }
      subview.place(at: CGPoint(x: currentX, y: currentY), proposal: .unspecified)
      currentX += size.width + spacing
      rowHeight = max(rowHeight, size.height)
    }
  }
}
