import SwiftUI

private struct FeedResponse: Decodable {
  let feed: [TaskItem]
}

private struct StatsResponse: Decodable {
  let pending_tasks: Int?
  let completed_this_week: Int?
  let overdue: Int?
  let github: GithubStats?

  struct GithubStats: Decodable {
    let streak_days: Int?
  }
}

private struct APIAck: Decodable {
  let success: Bool?
}

private struct NewTaskBody: Encodable {
  let title: String
  let type: String?
  let priority: String?
  let subject: String?
}

@MainActor
class DashboardViewModel: ObservableObject {
  @Published var tasks: [TaskItem] = []
  @Published var stats: WeekStats = WeekStats()
  @Published var projectIdeas: [Project] = []
  @Published var isLoading = false
  @Published var showAddTask = false
  @Published var loadError: String?

  func load() async {
    isLoading = true
    defer { isLoading = false }
    loadError = nil

    async let feedResult: FeedResponse? = try? APIClient.shared.request(Endpoints.feed)
    async let statsResult: StatsResponse? = try? APIClient.shared.request(Endpoints.stats)

    let (feed, stats) = await (feedResult, statsResult)

    if let feed {
      self.tasks = feed.feed.filter { !$0.completed }
    } else if tasks.isEmpty {
      loadError = "Couldn't load your tasks. Pull to refresh to try again."
    }

    if let stats {
      self.stats = WeekStats(
        pending: stats.pending_tasks ?? tasks.count,
        completed: stats.completed_this_week ?? 0,
        overdue: stats.overdue ?? 0,
        streak: stats.github?.streak_days ?? 0
      )
    }

    // Project ideas widget uses the same endpoint the web dashboard's
    // ProjectIdeasPanel does (see src/app/api/projects/ideas/route.ts).
    struct IdeasResponse: Decodable {
      struct Idea: Decodable {
        let title: String
        let description: String
        let difficulty: String
        let techStack: [String]
      }
      let ideas: [Idea]
    }
    if let ideasResult: IdeasResponse = try? await APIClient.shared.request(Endpoints.foundryIdeas) {
      self.projectIdeas = ideasResult.ideas.map {
        Project(id: UUID(), title: $0.title, description: $0.description, tier: $0.difficulty.lowercased(), techStack: $0.techStack)
      }
    }
  }

  func markDone(_ task: TaskItem) {
    withAnimation {
      tasks.removeAll { $0.id == task.id }
      stats.completed += 1
      stats.pending = max(0, stats.pending - 1)
    }
    UINotificationFeedbackGenerator().notificationOccurred(.success)
    Task {
      let _: APIAck? = try? await APIClient.shared.request(Endpoints.taskComplete(task.id), method: "PATCH")
    }
  }

  func deleteTask(_ task: TaskItem) {
    withAnimation {
      tasks.removeAll { $0.id == task.id }
      stats.pending = max(0, stats.pending - 1)
    }
    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    Task {
      let _: APIAck? = try? await APIClient.shared.request(Endpoints.taskDelete(task.id), method: "DELETE")
    }
  }

  func addTask(_ draft: TaskItem) {
    UINotificationFeedbackGenerator().notificationOccurred(.success)
    Task {
      let body = NewTaskBody(title: draft.title, type: draft.type, priority: draft.priority?.rawValue, subject: draft.subject)
      struct CreatedTaskResponse: Decodable { let task: TaskItem }
      if let created: CreatedTaskResponse = try? await APIClient.shared.request(Endpoints.tasks, method: "POST", body: body) {
        withAnimation {
          tasks.insert(created.task, at: 0)
          stats.pending += 1
        }
      } else {
        // Server didn't confirm — refresh from source of truth rather than
        // showing a task that may not actually exist.
        await load()
      }
    }
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
