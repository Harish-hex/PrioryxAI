package in.prioryxai.app.core.models

import androidx.compose.ui.graphics.Color
import com.google.gson.annotations.SerializedName
import in.prioryxai.app.ui.theme.BrandAmber
import in.prioryxai.app.ui.theme.BrandEmerald
import in.prioryxai.app.ui.theme.BrandRed

enum class TaskPriority(val label: String, val color: Color) {
  @SerializedName("urgent")
  URGENT("Urgent", BrandRed),
  
  @SerializedName("high")
  HIGH("High", Color(0xFFF97316)),
  
  @SerializedName("medium")
  MEDIUM("Medium", BrandAmber),
  
  @SerializedName("low")
  LOW("Low", BrandEmerald)
}

data class TaskItem(
  val id: String,
  @SerializedName("user_id") val userId: String? = null,
  val title: String,
  val description: String? = null,
  val priority: TaskPriority = TaskPriority.HIGH,
  val status: String = "pending",
  val category: String? = "Assignment",
  val source: String? = "manual",
  @SerializedName("estimated_hours") val estimatedHours: Double? = null,
  @SerializedName("created_at") val createdAt: String? = null
)

data class Profile(
  val id: String,
  @SerializedName("full_name") val fullName: String? = null,
  val name: String? = null,
  val username: String? = null,
  val email: String? = null,
  val college: String? = null,
  val semester: Int? = 6,
  val cgpa: Double? = 8.5,
  @SerializedName("target_role") val targetRole: String? = "Fullstack SDE",
  @SerializedName("github_username") val githubUsername: String? = null,
  @SerializedName("subscription_status") val subscriptionStatus: String? = "free",
  @SerializedName("placement_score") val placementScore: Int? = 82,
  @SerializedName("github_streak_days") val githubStreakDays: Int? = 14,
  @SerializedName("github_health_score") val githubHealthScore: Int? = 88
) {
  val displayName: String
    get() = fullName ?: name ?: username ?: "Student"
  
  val initials: String
    get() {
      val parts = displayName.split(" ").filter { it.isNotBlank() }
      return if (parts.size >= 2) {
        "${parts[0].first()}${parts[1].first()}".uppercase()
      } else {
        displayName.take(2).uppercase()
      }
    }
  
  val isPro: Boolean
    get() = subscriptionStatus == "pro"
}
