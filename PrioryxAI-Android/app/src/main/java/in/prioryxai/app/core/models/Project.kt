package in.prioryxai.app.core.models

import com.google.gson.annotations.SerializedName

data class Project(
  val id: String,
  val title: String,
  val description: String,
  val tier: String,
  @SerializedName("tech_stack") val techStack: List<String> = emptyList(),
  @SerializedName("current_phase") val currentPhase: Int = 1,
  @SerializedName("total_phases") val totalPhases: Int = 6
)

data class Job(
  val id: String,
  val role: String,
  val company: String,
  val location: String,
  @SerializedName("stipend_or_ctc") val stipendOrCtc: String,
  @SerializedName("match_score") val matchScore: Int,
  @SerializedName("skills_required") val skillsRequired: List<String> = emptyList()
)

data class ChatMessage(
  val id: String,
  val role: String, // "user" or "assistant"
  val content: String,
  val timestamp: String = "Just now"
) {
  val isUser: Boolean get() = role == "user"
}

data class CodingProfile(
  val platform: String,
  val username: String? = null,
  @SerializedName("problems_solved") val problemsSolved: Int = 0,
  val rating: Int = 0,
  @SerializedName("is_connected") val isConnected: Boolean = false
)
