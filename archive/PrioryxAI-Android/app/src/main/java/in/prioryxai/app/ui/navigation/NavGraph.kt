package in.prioryxai.app.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import in.prioryxai.app.core.auth.AuthRepository
import in.prioryxai.app.ui.screens.assistant.AssistantScreen
import in.prioryxai.app.ui.screens.career.*
import in.prioryxai.app.ui.screens.dashboard.DashboardScreen
import in.prioryxai.app.ui.screens.learning.LearningScreen
import in.prioryxai.app.ui.screens.onboarding.AuthScreen
import in.prioryxai.app.ui.screens.onboarding.OnboardingScreen
import in.prioryxai.app.ui.screens.profile.ProfileScreen
import in.prioryxai.app.ui.screens.setup.SetupCompleteScreen
import in.prioryxai.app.ui.screens.setup.SetupProfileScreen
import in.prioryxai.app.ui.screens.upgrade.UpgradeScreen

@Composable
fun PrioryxNavGraph(
  authRepository: AuthRepository,
  navController: NavHostController = rememberNavController()
) {
  val isAuthenticated by authRepository.isAuthenticated.collectAsState()
  val profile by authRepository.currentProfile.collectAsState()

  val navBackStackEntry by navController.currentBackStackEntryAsState()
  val currentRoute = navBackStackEntry?.destination?.route

  val showBottomBar = currentRoute in listOf(
    Screen.Dashboard.route,
    Screen.Learning.route,
    Screen.Assistant.route,
    Screen.Profile.route
  )

  val startDestination = when {
    !isAuthenticated -> Screen.Onboarding.route
    profile?.college.isNullOrBlank() -> Screen.SetupProfile.route
    else -> Screen.Dashboard.route
  }

  Scaffold(
    bottomBar = {
      if (showBottomBar) {
        BottomNavBar(
          currentRoute = currentRoute,
          onNavigate = { route ->
            if (route == Screen.CareerMore.route) {
              navController.navigate(Screen.Resume.route)
            } else {
              navController.navigate(route) {
                popUpTo(Screen.Dashboard.route) { saveState = true }
                launchSingleTop = true
                restoreState = true
              }
            }
          }
        )
      }
    }
  ) { padding ->
    NavHost(
      navController = navController,
      startDestination = startDestination,
      modifier = Modifier.padding(if (showBottomBar) padding else androidx.compose.foundation.layout.PaddingValues())
    ) {
      // Onboarding & Setup
      composable(Screen.Onboarding.route) {
        OnboardingScreen(onNavigateToAuth = { navController.navigate(Screen.Auth.route) })
      }

      composable(Screen.Auth.route) {
        AuthScreen(onAuthSuccess = { newProfile ->
          authRepository.signIn("mock_jwt", newProfile)
          if (newProfile.college.isNullOrBlank()) {
            navController.navigate(Screen.SetupProfile.route) {
              popUpTo(Screen.Auth.route) { inclusive = true }
            }
          } else {
            navController.navigate(Screen.Dashboard.route) {
              popUpTo(Screen.Auth.route) { inclusive = true }
            }
          }
        })
      }

      composable(Screen.SetupProfile.route) {
        SetupProfileScreen(onComplete = { college, sem, track ->
          profile?.let {
            authRepository.updateProfile(it.copy(college = college, semester = sem, targetRole = track))
          }
          navController.navigate(Screen.SetupComplete.route)
        })
      }

      composable(Screen.SetupComplete.route) {
        SetupCompleteScreen(onLaunch = {
          navController.navigate(Screen.Dashboard.route) {
            popUpTo(Screen.SetupComplete.route) { inclusive = true }
          }
        })
      }

      // Tabs
      composable(Screen.Dashboard.route) {
        DashboardScreen(
          profile = profile,
          onNavigateToAssistant = { navController.navigate(Screen.Assistant.route) },
          onNavigateToProfile = { navController.navigate(Screen.Profile.route) },
          onNavigateToFoundry = { navController.navigate(Screen.Foundry.route) }
        )
      }

      composable(Screen.Learning.route) {
        LearningScreen()
      }

      composable(Screen.Assistant.route) {
        AssistantScreen()
      }

      composable(Screen.Profile.route) {
        ProfileScreen(
          profile = profile,
          onNavigateToUpgrade = { navController.navigate(Screen.Upgrade.route) },
          onNavigateToResume = { navController.navigate(Screen.Resume.route) },
          onNavigateToCoding = { navController.navigate(Screen.UnifiedCoding.route) },
          onNavigateToCollab = { navController.navigate(Screen.PeerCollab.route) },
          onSignOut = {
            authRepository.signOut()
            navController.navigate(Screen.Onboarding.route) {
              popUpTo(0) { inclusive = true }
            }
          }
        )
      }

      // Career Sub-screens
      composable(Screen.Resume.route) { ResumeScreen() }
      composable(Screen.Foundry.route) { FoundryScreen() }
      composable(Screen.UnifiedCoding.route) { UnifiedCodingScreen() }
      composable(Screen.GitHubIntelligence.route) { GitHubIntelligenceScreen() }
      composable(Screen.JobMarket.route) { JobMarketScreen() }
      composable(Screen.PeerCollab.route) { PeerCollabScreen() }

      composable(Screen.Upgrade.route) {
        UpgradeScreen(
          onDismiss = { navController.popBackStack() },
          onUpgradeSuccess = {
            profile?.let { authRepository.updateProfile(it.copy(subscriptionStatus = "pro")) }
            navController.popBackStack()
          }
        )
      }
    }
  }
}
