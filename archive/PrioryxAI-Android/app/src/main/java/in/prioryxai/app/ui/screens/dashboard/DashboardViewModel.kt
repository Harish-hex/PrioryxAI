package in.prioryxai.app.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import in.prioryxai.app.core.models.Project
import in.prioryxai.app.core.models.TaskItem
import in.prioryxai.app.core.models.TaskPriority
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.util.UUID

data class WeekStats(
  val pending: Int = 3,
  val completed: Int = 6,
  val overdue: Int = 1,
  val streak: Int = 14
)

data class DashboardUiState(
  val tasks: List<TaskItem> = emptyList(),
  val stats: WeekStats = WeekStats(),
  val projectIdeas: List<Project> = emptyList(),
  val isLoading: Boolean = false,
  val showAddTask: Boolean = false
) {
  val topTask: TaskItem? get() = tasks.firstOrNull()
}

class DashboardViewModel : ViewModel() {
  private val _uiState = MutableStateFlow(DashboardUiState())
  val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

  init {
    loadDashboard()
  }

  fun loadDashboard() {
    _uiState.update {
      it.copy(
        tasks = listOf(
          TaskItem(
            id = UUID.randomUUID().toString(),
            title = "Complete Operating Systems Lab Assignment 3",
            description = "Implement multi-threaded producer-consumer problem with mutex in C++.",
            priority = TaskPriority.URGENT,
            category = "Assignment"
          ),
          TaskItem(
            id = UUID.randomUUID().toString(),
            title = "Solve 2 LeetCode Mediums on Graph BFS/DFS",
            description = "Target Course Schedule and Number of Islands.",
            priority = TaskPriority.HIGH,
            category = "DSA Practice"
          ),
          TaskItem(
            id = UUID.randomUUID().toString(),
            title = "Review Distributed Rate Limiter Go Architecture",
            description = "Add Docker Compose and Redis cluster caching primitives.",
            priority = TaskPriority.MEDIUM,
            category = "Project"
          )
        ),
        projectIdeas = listOf(
          Project(
            id = UUID.randomUUID().toString(),
            title = "Distributed Rate Limiter in Go",
            description = "High-throughput token bucket algorithm with Redis cluster & Docker.",
            tier = "Intermediate",
            techStack = listOf("Go", "Redis", "Docker")
          ),
          Project(
            id = UUID.randomUUID().toString(),
            title = "Real-Time Collaborative Code Editor",
            description = "CRDT and WebSocket multiplayer document sync with Node.js.",
            tier = "Advanced",
            techStack = listOf("TypeScript", "WebSockets", "Node.js")
          )
        ),
        stats = WeekStats(pending = 3, completed = 6, overdue = 1, streak = 14)
      )
    }
  }

  fun markDone(task: TaskItem) {
    _uiState.update { state ->
      val newTasks = state.tasks.filter { it.id != task.id }
      state.copy(
        tasks = newTasks,
        stats = state.stats.copy(
          completed = state.stats.completed + 1,
          pending = maxOf(0, state.stats.pending - 1)
        )
      )
    }
  }

  fun deleteTask(task: TaskItem) {
    _uiState.update { state ->
      state.copy(
        tasks = state.tasks.filter { it.id != task.id },
        stats = state.stats.copy(pending = maxOf(0, state.stats.pending - 1))
      )
    }
  }

  fun addTask(task: TaskItem) {
    _uiState.update { state ->
      state.copy(
        tasks = listOf(task) + state.tasks,
        stats = state.stats.copy(pending = state.stats.pending + 1),
        showAddTask = false
      )
    }
  }

  fun setShowAddTask(show: Boolean) {
    _uiState.update { it.copy(showAddTask = show) }
  }
}
