import SwiftUI

struct FoundryView: View {
  @State private var selectedTier = "All"
  
  let tiers = ["All", "Foundation", "Intermediate", "Advanced"]
  
  let projects: [Project] = [
    Project(
      id: UUID(),
      title: "High-Throughput Distributed Rate Limiter",
      description: "Token Bucket and Sliding Window algorithms in Go with Redis caching cluster and Docker.",
      tier: "Intermediate",
      techStack: ["Go", "Redis", "Docker", "gRPC"],
      currentPhase: 3,
      totalPhases: 6
    ),
    Project(
      id: UUID(),
      title: "Real-Time Collaborative Markdown Editor",
      description: "Multiplayer document editor using Conflict-Free Replicated Data Types (CRDT) & WebSockets.",
      tier: "Advanced",
      techStack: ["TypeScript", "Node.js", "WebSockets", "CRDT"],
      currentPhase: 1,
      totalPhases: 6
    ),
    Project(
      id: UUID(),
      title: "AI Resume Semantic Matcher & Parser",
      description: "Vector embeddings and LLM integration to extract skills and compute cosine placement match.",
      tier: "Foundation",
      techStack: ["Python", "FastAPI", "pgvector", "OpenAI"],
      currentPhase: 4,
      totalPhases: 6
    )
  ]
  
  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        ScrollView(.horizontal, showsIndicators: false) {
          HStack(spacing: 8) {
            ForEach(tiers, id: \.self) { tier in
              Button(action: { selectedTier = tier }) {
                Text(tier)
                  .font(.captionLG)
                  .fontWeight(.semibold)
                  .padding(.horizontal, 14)
                  .padding(.vertical, 8)
                  .background(selectedTier == tier ? Color.brandViolet : Color.surface2)
                  .foregroundColor(selectedTier == tier ? .white : Color.labelPrimary)
                  .clipShape(Capsule())
              }
            }
          }
          .padding(.horizontal, 16)
        }
        
        VStack(spacing: 12) {
          ForEach(projects) { project in
            NavigationLink(destination: ProjectDetailView(project: project)) {
              VStack(alignment: .leading, spacing: 10) {
                HStack {
                  PXBadge(text: project.tier.uppercased(), style: .brand)
                  Spacer()
                  Text("Phase \(project.currentPhase ?? 1)/\(project.totalPhases ?? 6)")
                    .font(.captionSM)
                    .fontWeight(.bold)
                    .foregroundColor(Color.labelSecondary)
                }
                
                Text(project.title)
                  .font(.titleSM)
                  .foregroundColor(Color.labelPrimary)
                  .multilineTextAlignment(.leading)
                
                Text(project.description)
                  .font(.bodyMD)
                  .foregroundColor(Color.labelSecondary)
                  .multilineTextAlignment(.leading)
                  .lineLimit(2)
                
                HStack(spacing: 6) {
                  ForEach(project.techStack, id: \.self) { tech in
                    Text(tech)
                      .font(.captionSM)
                      .padding(.horizontal, 8)
                      .padding(.vertical, 3)
                      .background(Color.surface2)
                      .foregroundColor(Color.labelSecondary)
                      .clipShape(RoundedRectangle(cornerRadius: 6))
                  }
                }
              }
              .padding(16)
              .background(Color.surface1)
              .clipShape(RoundedRectangle(cornerRadius: 20))
              .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
            }
          }
        }
        .padding(.horizontal, 16)
      }
      .padding(.vertical, 8)
    }
    .navigationTitle("Project Foundry 🔨")
    .navigationBarTitleDisplayMode(.inline)
  }
}

struct ProjectPhaseItem: Identifiable {
  let id: Int
  let title: String
  let desc: String
  var completed: Bool
  let deliverables: [String]
}

struct ProjectDetailView: View {
  let project: Project
  @State private var phases: [ProjectPhaseItem] = [
    ProjectPhaseItem(
      id: 1,
      title: "Problem Framing & Architecture",
      desc: "Define non-functional requirements (10,000 RPS) and draw data flow diagrams.",
      completed: true,
      deliverables: ["System Diagram SVG", "Latency budget sheet"]
    ),
    ProjectPhaseItem(
      id: 2,
      title: "Database Schema & Migration",
      desc: "Design PostgreSQL schema with indexing strategy and Docker Compose.",
      completed: true,
      deliverables: ["init.sql", "Foreign keys", "Indexing strategy"]
    ),
    ProjectPhaseItem(
      id: 3,
      title: "Core Algorithm in Go",
      desc: "Write Token Bucket concurrency primitives in Go with atomic sync.",
      completed: true,
      deliverables: ["rate_limiter.go", "Benchmark unit tests"]
    ),
    ProjectPhaseItem(
      id: 4,
      title: "Redis Cluster & Lua Scripts",
      desc: "Connect Redis cluster with Lua scripts for zero-race atomic counters.",
      completed: false,
      deliverables: ["Lua atomic script", "Connection pool"]
    ),
    ProjectPhaseItem(
      id: 5,
      title: "Docker & GitHub Actions CI",
      desc: "Multi-stage Dockerfile build, automated test runner, and security scan.",
      completed: false,
      deliverables: ["Dockerfile (<25MB)", "ci.yml"]
    ),
    ProjectPhaseItem(
      id: 6,
      title: "Resume STAR Bullets",
      desc: "Synthesize STAR bullet points with quantifiable performance metrics.",
      completed: false,
      deliverables: ["3 ATS Bullet points", "Interview FAQ script"]
    )
  ]
  @State private var mentorInput = ""
  @State private var mentorReplies: [String] = []
  
  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        // Banner
        VStack(alignment: .leading, spacing: 8) {
          PXBadge(text: project.tier.uppercased(), style: .brand)
          Text(project.title)
            .font(.titleMD)
            .fontWeight(.bold)
          Text(project.description)
            .font(.bodyMD)
            .foregroundColor(Color.labelSecondary)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.surface1)
        .clipShape(RoundedRectangle(cornerRadius: 22))
        
        // Phases
        VStack(alignment: .leading, spacing: 10) {
          Text("EXECUTION PHASES (6)")
            .font(.captionSM)
            .fontWeight(.bold)
            .foregroundColor(Color.labelSecondary)
          
          ForEach(0..<phases.count, id: \.self) { index in
            let phase = phases[index]
            VStack(alignment: .leading, spacing: 8) {
              HStack {
                Button(action: {
                  UIImpactFeedbackGenerator(style: .light).impactOccurred()
                  phases[index].completed.toggle()
                }) {
                  Image(systemName: phase.completed ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundColor(phase.completed ? Color.brandEmerald : Color.separator)
                }
                
                Text("Phase \(phase.id): \(phase.title)")
                  .font(.bodyMD)
                  .fontWeight(.semibold)
                  .foregroundColor(Color.labelPrimary)
                
                Spacer()
              }
              
              Text(phase.desc)
                .font(.captionLG)
                .foregroundColor(Color.labelSecondary)
                .padding(.leading, 32)
            }
            .padding(14)
            .background(Color.surface1)
            .clipShape(RoundedRectangle(cornerRadius: 16))
          }
        }
        
        // AI Project Mentor
        VStack(alignment: .leading, spacing: 12) {
          HStack(spacing: 8) {
            Text("🧠").font(.system(size: 20))
            Text("Ask AI Project Mentor")
              .font(.titleSM)
              .fontWeight(.semibold)
          }
          
          ForEach(mentorReplies, id: \.self) { reply in
            Text(reply)
              .font(.captionLG)
              .padding(10)
              .background(Color.surface2)
              .clipShape(RoundedRectangle(cornerRadius: 12))
          }
          
          HStack(spacing: 8) {
            TextField("Ask anything about this project phase...", text: $mentorInput)
              .padding(10)
              .background(Color.surface2)
              .clipShape(RoundedRectangle(cornerRadius: 12))
            
            Button("Ask") {
              guard !mentorInput.isEmpty else { return }
              mentorReplies.append("✨ Mentor: For Token Bucket in Go, use atomic.AddInt64 with sync.Mutex for zero-race conditions.")
              mentorInput = ""
            }
            .font(.captionLG)
            .fontWeight(.bold)
            .foregroundColor(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.brandViolet)
            .clipShape(RoundedRectangle(cornerRadius: 12))
          }
        }
        .padding(18)
        .background(Color.brandViolet.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color.brandViolet.opacity(0.3), lineWidth: 1))
      }
      .padding(16)
    }
    .navigationTitle("Foundry Project 🔨")
    .navigationBarTitleDisplayMode(.inline)
  }
}
