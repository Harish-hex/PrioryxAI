package in.prioryxai.app.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prioryxai.app.core.models.Profile
import in.prioryxai.app.ui.components.*
import in.prioryxai.app.ui.theme.BrandAmber
import in.prioryxai.app.ui.theme.BrandRed
import in.prioryxai.app.ui.theme.BrandViolet

@Composable
fun ContributionGraph(streakDays: Int = 14) {
  PXCard(cornerRadius = 20.dp, padding = 16.dp) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Column {
        Text("GITHUB COMMIT STREAK", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text("$streakDays Days Active", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
      }

      Row(horizontalArrangement = Arrangement.spacedBy(3.dp), verticalAlignment = Alignment.CenterVertically) {
        Text("Less", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 10.sp)
        listOf(0.15f, 0.35f, 0.65f, 0.95f).forEach { opacity ->
          Box(
            modifier = Modifier
              .size(8.dp)
              .clip(RoundedCornerShape(2.dp))
              .background(BrandViolet.copy(alpha = opacity))
          )
        }
        Text("More", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 10.sp)
      }
    }

    Spacer(Modifier.height(12.dp))

    LazyRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
      items(20) { col ->
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
          repeat(7) { row ->
            val isFilled = (col * 7 + row) % 3 != 0
            val opacity = if (isFilled) (((col + row) % 4) + 1) * 0.25f else 0f
            Box(
              modifier = Modifier
                .size(12.dp)
                .clip(RoundedCornerShape(3.dp))
                .background(if (isFilled) BrandViolet.copy(alpha = opacity) else MaterialTheme.colorScheme.surfaceVariant)
            )
          }
        }
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
  profile: Profile?,
  onNavigateToUpgrade: () -> Unit,
  onNavigateToResume: () -> Unit,
  onNavigateToCoding: () -> Unit,
  onNavigateToCollab: () -> Unit,
  onSignOut: () -> Unit
) {
  Scaffold(
    topBar = {
      TopAppBar(
        title = { Text("Profile 👤", fontWeight = FontWeight.Bold) },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
      )
    }
  ) { padding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .background(MaterialTheme.colorScheme.background)
        .padding(padding)
        .padding(horizontal = 16.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp),
      contentPadding = PaddingValues(top = 8.dp, bottom = 100.dp)
    ) {
      // User Profile Header
      item {
        PXCard(cornerRadius = 22.dp, padding = 18.dp) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
          ) {
            PXAvatar(initials = profile?.initials ?: "PR", size = 60.dp)
            Spacer(Modifier.width(16.dp))
            Column {
              Row(verticalAlignment = Alignment.CenterVertically) {
                Text(profile?.displayName ?: "Engineering Student", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                if (profile?.isPro == true) {
                  Spacer(Modifier.width(6.dp))
                  PXBadge(text = "PRO ✦")
                }
              }
              Text(
                "${profile?.college ?: "Engineering College"} • Sem ${profile?.semester ?: 6}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
              )
              if (profile?.githubUsername != null) {
                Text("@${profile.githubUsername}", style = MaterialTheme.typography.labelSmall, color = BrandViolet)
              }
            }
          }

          if (profile?.isPro != true) {
            Spacer(Modifier.height(14.dp))
            PXButton(
              text = "Upgrade to Pro (₹59/mo) ✦",
              variant = ButtonVariant.GRADIENT,
              height = 40.dp,
              onClick = onNavigateToUpgrade
            )
          }
        }
      }

      // Readiness Scores
      item {
        PXCard(cornerRadius = 22.dp, padding = 18.dp) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            ScoreRing(score = profile?.placementScore ?: 82, size = 80.dp, label = "ATS")
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
              Text("GitHub Health", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
              Text("${profile?.githubHealthScore ?: 88}%", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
              Spacer(Modifier.height(8.dp))
              Text("Weekly Solved", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
              Text("6 tasks", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
          }
        }
      }

      // Commit Heatmap
      item {
        ContributionGraph(streakDays = profile?.githubStreakDays ?: 14)
      }

      // Links
      item {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
          ProfileLink(emoji = "📄", title = "Resume Intelligence & SWOT", subtitle = "ATS score & missing skills", onClick = onNavigateToResume)
          ProfileLink(emoji = "💻", title = "Connected Coding Profiles", subtitle = "LeetCode & HackerRank sync", onClick = onNavigateToCoding)
          ProfileLink(emoji = "👥", title = "Peer Collaboration & Duels", subtitle = "Study buddies & ranking", onClick = onNavigateToCollab)
        }
      }

      item {
        Box(
          modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onSignOut)
            .padding(vertical = 12.dp),
          contentAlignment = Alignment.Center
        ) {
          Text("Sign Out", color = BrandRed, fontWeight = FontWeight.Bold)
        }
      }
    }
  }
}

@Composable
fun ProfileLink(emoji: String, title: String, subtitle: String, onClick: () -> Unit) {
  PXCard(
    cornerRadius = 18.dp,
    padding = 14.dp,
    modifier = Modifier.clickable(onClick = onClick)
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      verticalAlignment = Alignment.CenterVertically
    ) {
      Text(emoji, fontSize = 24.sp)
      Spacer(Modifier.width(12.dp))
      Column(modifier = Modifier.weight(1f)) {
        Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
        Text(subtitle, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
      }
      Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
  }
}
