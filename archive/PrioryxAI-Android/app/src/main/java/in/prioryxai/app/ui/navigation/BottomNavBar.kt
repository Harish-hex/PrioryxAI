package in.prioryxai.app.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prioryxai.app.ui.theme.BrandCyan
import in.prioryxai.app.ui.theme.BrandViolet

@Composable
fun BottomNavBar(
  currentRoute: String?,
  onNavigate: (String) -> Unit
) {
  NavigationBar(
    containerColor = MaterialTheme.colorScheme.surface,
    tonalElevation = 8.dp
  ) {
    BottomNavItems.forEach { screen ->
      val isSelected = currentRoute == screen.route
      
      if (screen == Screen.Assistant) {
        // Floating center AI button
        NavigationBarItem(
          selected = isSelected,
          onClick = { onNavigate(screen.route) },
          icon = {
            Box(
              modifier = Modifier
                .offset(y = (-10).dp)
                .size(48.dp)
                .shadow(elevation = 6.dp, shape = CircleShape, spotColor = BrandViolet)
                .clip(CircleShape)
                .background(Brush.linearGradient(listOf(BrandViolet, BrandCyan))),
              contentAlignment = Alignment.Center
            ) {
              Text("✨", fontSize = 20.sp)
            }
          },
          label = { Text("AI Copilot", style = MaterialTheme.typography.labelSmall) }
        )
      } else {
        NavigationBarItem(
          selected = isSelected,
          onClick = { onNavigate(screen.route) },
          icon = {
            screen.icon?.let {
              Icon(it, contentDescription = screen.title)
            }
          },
          label = { Text(screen.title, style = MaterialTheme.typography.labelSmall) },
          colors = NavigationBarItemDefaults.colors(
            selectedIconColor = BrandViolet,
            selectedTextColor = BrandViolet,
            indicatorColor = BrandViolet.copy(alpha = 0.12f)
          )
        )
      }
    }
  }
}
