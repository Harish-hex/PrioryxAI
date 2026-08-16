package in.prioryxai.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector? = null) {
  object Onboarding : Screen("onboarding", "Onboarding")
  object Auth : Screen("auth", "Auth")
  object SetupProfile : Screen("setup_profile", "Academic Setup")
  object SetupComplete : Screen("setup_complete", "Setup Complete")
  
  // Tabs
  object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Home)
  object Learning : Screen("learning", "Feed", Icons.Default.PlayCircle)
  object Assistant : Screen("assistant", "AI Copilot", Icons.Default.AutoAwesome)
  object Profile : Screen("profile", "Profile", Icons.Default.Person)
  object CareerMore : Screen("career_more", "Career", Icons.Default.MoreHoriz)
  
  // Career Sub-screens
  object Resume : Screen("career_resume", "Resume Intelligence")
  object Foundry : Screen("career_foundry", "Project Foundry")
  object UnifiedCoding : Screen("career_coding", "Coding Profiles")
  object GitHubIntelligence : Screen("career_github", "GitHub Intelligence")
  object JobMarket : Screen("career_jobs", "Job Market")
  object PeerCollab : Screen("career_collab", "Peer Collab")
  object Upgrade : Screen("upgrade", "PrioryxAI Pro")
}

val BottomNavItems = listOf(
  Screen.Dashboard,
  Screen.Learning,
  Screen.Assistant,
  Screen.Profile,
  Screen.CareerMore
)
