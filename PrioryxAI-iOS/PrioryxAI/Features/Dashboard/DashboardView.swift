import SwiftUI

@MainActor
class DashboardViewModel: ObservableObject {
  @Published var tasks: [TaskItem] = []
  @Published var stats: WeekStats = WeekStats()
  @Published var projectIdeas: [Project] = []
  @Published var isLoading = false
  @Published var showAddTask = false
  
  func load() async {
    isLoading = true
    defer { isLoading = false }
    
    // Sample tasks & project ideas
    self.tasks = [
      TaskItem(
        id: UUID(),
        title: "Complete Operating Systems Lab Assignment 3",
        description: "Implement multi-threaded producer-consumer problem with mutex in C++.",
        priority: .urgent,
        status: .pending,
        category: "Assignment",
        source: "timetable"
      ),
      TaskItem(
        id: UUID(),
        title: "Solve 2 LeetCode Mediums on Graph BFS/DFS",
        description: "Target Course Schedule and Number of Islands.",
        priority: .high,
        status: .pending,
        category: "DSA Practice",
        source: "ai"
      ),
      TaskItem(
        id: UUID(),
        title: "Review Distributed Rate Limiter Go Architecture",
        description: "Add Docker Compose and Redis cluster caching primitives.",
        priority: .medium,
        status: .pending,
        category: "Project",
        source: "foundry"
      )
    ]
    
    self.projectIdeas = [
      Project(
        id: UUID(),
        title: "Distributed Rate Limiter in Go",
        description: "High-throughput token bucket algorithm with Redis cluster & Docker.",
        tier: "intermediate",
        techStack: ["Go", "Redis", "Docker"]
      ),
      Project(
        id: UUID(),
        title: "Real-Time Collaborative Code Editor",
        description: "CRDT and WebSocket multiplayer document sync with Node.js.",
        tier: "advanced",
        techStack: ["TypeScript", "WebSockets", "Node.js"]
      )
    ]
    
    self.stats = WeekStats(pending: tasks.count, completed: 6, overdue: 1, streak: 14)
  }
  
  func markDone(_ task: TaskItem) {
    withAnimation {
      tasks.removeAll { $0.id == task.id }
      stats.completed += 1
      stats.pending = max(0, stats.pending - 1)
    }
    UINotificationFeedbackGenerator().notificationOccurred(.success)
  }
  
  func deleteTask(_ task: TaskItem) {
    withAnimation {
      tasks.removeAll { $0.id == task.id }
      stats.pending = max(0, stats.pending - 1)
    }
    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
  }
  
  func addTask(_ task: TaskItem) {
    withAnimation {
      tasks.insert(task, at: 0)
      stats.pending += 1
    }
    UINotificationFeedbackGenerator().notificationOccurred(.success)
  }
}

struct DashboardView: View {
  @EnvironmentObject var auth: AuthManager
  @StateObject private var vm = DashboardViewModel()
  
  var body: some View {
    NavigationStack {
      ScrollView {
        LazyVStack(spacing: 16) {
          if vm.isLoading {
            SkeletonView(height: 140, cornerRadius: 22)
            SkeletonView(height: 70, cornerRadius: 18)
          } else {
            if let topTask = vm.tasks.first {
              NextPriorityCard(task: topTask) {
                vm.markDone(topTask)
              }
            }
            
            ThisWeekStats(stats: vm.stats, isPro: auth.isPro)
            
            Button(action: { vm.showAddTask = true }) {
              HStack(spacing: 10) {
                ZStack {
                  RoundedRectangle(cornerRadius: 8)
                    .fill(Color.brandViolet)
                    .frame(width: 26, height: 26)
                  Text("+").font(.titleSM).foregroundColor(.white)
                }
                
                Text("Add assignment, exam, or career goal...")
                  .font(.bodyMD)
                  .foregroundColor(Color.labelSecondary)
                
                Spacer()
                
                Text("⌘N")
                  .font(.captionSM)
                  .fontWeight(.bold)
                  .foregroundColor(Color.labelTertiary)
                  .padding(.horizontal, 6)
                  .padding(.vertical, 2)
                  .background(Color.surface2)
                  .clipShape(RoundedRectangle(cornerRadius: 6))
              }
              .padding(14)
              .background(Color.surface1)
              .clipShape(RoundedRectangle(cornerRadius: 18))
              .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.separator, lineWidth: 1))
              .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
            }
            
            PriorityFeedView(
              tasks: vm.tasks,
              onDone: { vm.markDone($0) },
              onDelete: { vm.deleteTask($0) }
            )
            
            ProjectIdeasWidget(ideas: vm.projectIdeas)
          }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 100)
      }
      .refreshable {
        await vm.load()
      }
      .navigationTitle("Dashboard")
      .navigationBarTitleDisplayMode(.large)
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
          HStack(spacing: 12) {
            NavigationLink(destination: ProfileView()) {
              PXAvatar(initials: auth.profile?.initials ?? "PR", size: 34)
            }
          }
        }
      }
      .sheet(isPresented: $vm.showAddTask) {
        AddTaskSheet { newTask in
          vm.addTask(newTask)
        }
      }
    }
    .task {
      await vm.load()
    }
  }
}
