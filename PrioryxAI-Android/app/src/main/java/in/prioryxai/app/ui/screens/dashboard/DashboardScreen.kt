package in.prioryxai.app.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import in.prioryxai.app.core.models.Profile
import in.prioryxai.app.core.models.Project
import in.prioryxai.app.ui.components.EmptyState
import in.prioryxai.app.ui.components.PXAvatar
import in.prioryxai.app.ui.components.PXBadge
import in.prioryxai.app.ui.components.PXCard
import in.prioryxai.app.ui.theme.BrandViolet

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
  profile: Profile?,
  onNavigateToAssistant: () -> Unit,
  onNavigateToProfile: () -> Unit,
  onNavigateToFoundry: () -> Unit,
  viewModel: DashboardViewModel = viewModel()
) {
  val uiState by viewModel.uiState.collectAsStateWithLifecycle()

  Scaffold(
    topBar = {
      TopAppBar(
        title = {
          Text("Dashboard", fontWeight = FontWeight.Bold)
        },
        actions = {
          IconButton(onClick = onNavigateToProfile) {
            PXAvatar(initials = profile?.initials ?: "PR", size = 34.dp)
          }
        },
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
      uiState.topTask?.let { topTask ->
        item {
          NextPriorityCard(
            task = topTask,
            onDone = { viewModel.markDone(topTask) },
            onAIPrompt = onNavigateToAssistant
          )
        }
      }

      // Weekly Stats
      item {
        Column {
          Text(
            "THIS WEEK",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )
          Spacer(Modifier.height(8.dp))
          LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            item { StatBox(emoji = "⏳", count = "${uiState.stats.pending}", label = "Pending") }
            item { StatBox(emoji = "✅", count = "${uiState.stats.completed}", label = "Done this week", isHighlight = true) }
            item { StatBox(emoji = "⚠️", count = "${uiState.stats.overdue}", label = "Overdue") }
            item { StatBox(emoji = "🔥", count = "${uiState.stats.streak}d", label = "GitHub Streak") }
          }
        }
      }

      // Quick Add
      item {
        PXCard(cornerRadius = 18.dp, padding = 14.dp) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .clickable { viewModel.setShowAddTask(true) },
            verticalAlignment = Alignment.CenterVertically
          ) {
            Box(
              modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(BrandViolet),
              contentAlignment = Alignment.Center
            ) {
              Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
            }
            Spacer(Modifier.width(12.dp))
            Text(
              "Add assignment, exam, or career goal...",
              style = MaterialTheme.typography.bodyMedium,
              color = MaterialTheme.colorScheme.onSurfaceVariant
            )
          }
        }
      }

      // Priority Feed
      item {
        Text(
          "PRIORITY FEED (${uiState.tasks.size})",
          style = MaterialTheme.typography.labelSmall,
          fontWeight = FontWeight.Bold,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
      }

      if (uiState.tasks.isEmpty()) {
        item {
          EmptyState(
            emoji = "🎯",
            title = "No tasks pending",
            description = "Add assignments or timetable classes to prioritize your week."
          )
        }
      } else {
        items(uiState.tasks, key = { it.id }) { task ->
          TaskCard(
            task = task,
            onDone = { viewModel.markDone(task) },
            onDelete = { viewModel.deleteTask(task) }
          )
        }
      }

      // Project Foundry Widget
      if (uiState.projectIdeas.isNotEmpty()) {
        item {
          Column {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Text(
                "RESUME-GAP PROJECT FOUNDRY",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
              )
              Text(
                "View all →",
                style = MaterialTheme.typography.labelSmall,
                color = BrandViolet,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.clickable(onClick = onNavigateToFoundry)
              )
            }
            Spacer(Modifier.height(10.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
              items(uiState.projectIdeas) { idea ->
                ProjectIdeaCard(idea = idea, onClick = onNavigateToFoundry)
              }
            }
          }
        }
      }
    }
  }

  if (uiState.showAddTask) {
    AddTaskBottomSheet(
      onDismiss = { viewModel.setShowAddTask(false) },
      onAddTask = { viewModel.addTask(it) }
    )
  }
}

@Composable
fun StatBox(emoji: String, count: String, label: String, isHighlight: Boolean = false) {
  PXCard(
    modifier = Modifier.width(130.dp),
    cornerRadius = 18.dp,
    padding = 12.dp
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Text(emoji, fontSize = 20.sp)
      Text(
        count,
        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold)
      )
    }
    Spacer(Modifier.height(6.dp))
    Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
  }
}

@Composable
fun ProjectIdeaCard(idea: Project, onClick: () -> Unit) {
  PXCard(
    modifier = Modifier
      .width(230.dp)
      .clickable(onClick = onClick),
    cornerRadius = 18.dp,
    padding = 14.dp
  ) {
    PXBadge(text = idea.tier.uppercase())
    Spacer(Modifier.height(8.dp))
    Text(idea.title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, maxLines = 2)
    Spacer(Modifier.height(4.dp))
    Text(
      idea.description,
      style = MaterialTheme.typography.bodySmall,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
      maxLines = 2
    )
    Spacer(Modifier.height(8.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
      idea.techStack.take(3).forEach { tech ->
        Box(
          modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(horizontal = 6.dp, vertical = 2.dp)
        ) {
          Text(tech, style = MaterialTheme.typography.labelSmall, fontSize = 10.sp)
        }
      }
    }
  }
}
