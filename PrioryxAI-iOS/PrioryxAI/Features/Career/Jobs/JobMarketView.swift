import SwiftUI

struct JobMarketView: View {
  let jobs: [Job] = [
    Job(
      id: UUID(),
      role: "SDE Intern (Backend / Go)",
      company: "Razorpay",
      location: "Bengaluru",
      stipendOrCtc: "₹45,000 / month",
      matchScore: 92,
      skillsRequired: ["Go", "PostgreSQL", "Redis", "Docker"]
    ),
    Job(
      id: UUID(),
      role: "Junior Fullstack Engineer",
      company: "CRED",
      location: "Bengaluru",
      stipendOrCtc: "18 - 24 LPA",
      matchScore: 84,
      skillsRequired: ["React", "TypeScript", "Node.js"]
    ),
    Job(
      id: UUID(),
      role: "AI / ML Intern",
      company: "Postman",
      location: "Remote",
      stipendOrCtc: "₹50,000 / month",
      matchScore: 76,
      skillsRequired: ["Python", "FastAPI", "Vector DBs"]
    )
  ]
  
  var body: some View {
    ScrollView {
      VStack(spacing: 12) {
        ForEach(jobs) { job in
          VStack(alignment: .leading, spacing: 10) {
            HStack {
              VStack(alignment: .leading, spacing: 2) {
                Text(job.role)
                  .font(.titleSM)
                  .fontWeight(.semibold)
                Text("\(job.company) • \(job.location)")
                  .font(.captionLG)
                  .foregroundColor(Color.brandViolet)
                Text(job.stipendOrCtc)
                  .font(.captionSM)
                  .foregroundColor(Color.labelSecondary)
              }
              
              Spacer()
              
              ScoreRingView(score: job.matchScore, size: 52, label: "Match")
            }
            
            HStack(spacing: 6) {
              ForEach(job.skillsRequired, id: \.self) { skill in
                Text(skill)
                  .font(.captionSM)
                  .padding(.horizontal, 8)
                  .padding(.vertical, 3)
                  .background(Color.surface2)
                  .foregroundColor(Color.labelSecondary)
                  .clipShape(RoundedRectangle(cornerRadius: 6))
              }
            }
            
            PXButton(title: "Apply Now →", variant: .primary, size: .sm) {}
              .padding(.top, 4)
          }
          .padding(16)
          .background(Color.surface1)
          .clipShape(RoundedRectangle(cornerRadius: 20))
          .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
        }
      }
      .padding(16)
    }
    .navigationTitle("Job Market 💼")
    .navigationBarTitleDisplayMode(.inline)
  }
}

struct PeerCollabView: View {
  @State private var friendCode = ""
  
  let friends = [
    ("Aarav Patel", "IIT Bombay", 7, 18),
    ("Sneha Reddy", "BITS Pilani", 6, 12),
    ("Vikram Singh", "DTU Delhi", 9, 24)
  ]
  
  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        // Connect Code Card
        HStack {
          VStack(alignment: .leading, spacing: 2) {
            Text("YOUR CONNECT CODE")
              .font(.captionSM)
              .fontWeight(.bold)
              .foregroundColor(Color.brandViolet)
            
            Text("PRX-8492")
              .font(.titleLG)
              .fontWeight(.bold)
              .tracking(2)
          }
          
          Spacer()
          
          Button("Copy Code") {
            UIPasteboard.general.string = "PRX-8492"
            UINotificationFeedbackGenerator().notificationOccurred(.success)
          }
          .font(.captionLG)
          .fontWeight(.bold)
          .foregroundColor(.white)
          .padding(.horizontal, 14)
          .padding(.vertical, 8)
          .background(Color.brandViolet)
          .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(18)
        .background(Color.brandViolet.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color.brandViolet.opacity(0.3), lineWidth: 1.5))
        
        // Add Friend Bar
        HStack(spacing: 10) {
          TextField("Enter classmate's connect code", text: $friendCode)
            .padding()
            .background(Color.surface2)
            .clipShape(RoundedRectangle(cornerRadius: 14))
          
          PXButton(title: "Connect", variant: .gradient, size: .md) {
            friendCode = ""
          }
          .frame(width: 100)
        }
        
        // Friends List
        VStack(alignment: .leading, spacing: 10) {
          Text("STUDY BUDDIES (3)")
            .font(.captionSM)
            .fontWeight(.bold)
            .foregroundColor(Color.labelSecondary)
          
          ForEach(friends, id: \.0) { friend in
            HStack(spacing: 12) {
              PXAvatar(initials: String(friend.0.prefix(2)), size: 44)
              
              VStack(alignment: .leading, spacing: 2) {
                Text(friend.0)
                  .font(.bodyMD)
                  .fontWeight(.semibold)
                Text("\(friend.1) • Lv.\(friend.2)")
                  .font(.captionSM)
                  .foregroundColor(Color.labelSecondary)
                Text("🔥 \(friend.3)d streak")
                  .font(.captionSM)
                  .foregroundColor(Color.brandAmber)
              }
              
              Spacer()
              
              Button("⚔️ Duel") {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
              }
              .font(.captionLG)
              .fontWeight(.bold)
              .foregroundColor(Color.brandViolet)
              .padding(.horizontal, 12)
              .padding(.vertical, 6)
              .background(Color.brandViolet.opacity(0.12))
              .clipShape(Capsule())
            }
            .padding(14)
            .background(Color.surface1)
            .clipShape(RoundedRectangle(cornerRadius: 18))
          }
        }
      }
      .padding(16)
    }
    .navigationTitle("Peer Collab 👥")
    .navigationBarTitleDisplayMode(.inline)
  }
}
