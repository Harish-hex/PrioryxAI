package in.prioryxai.app.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prioryxai.app.core.models.TaskItem
import in.prioryxai.app.ui.components.ButtonVariant
import in.prioryxai.app.ui.components.PXBadge
import in.prioryxai.app.ui.components.PXButton
import in.prioryxai.app.ui.components.PXCard
import in.prioryxai.app.ui.theme.BrandViolet

@Composable
fun NextPriorityCard(
  task: TaskItem,
  onDone: () -> Unit,
  onAIPrompt: () -> Unit
) {
  PXCard(cornerRadius = 22.dp, padding = 18.dp) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Row(
        modifier = Modifier
          .clip(RoundedCornerShape(8.dp))
          .background(BrandViolet.copy(alpha = 0.1f))
          .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically
      ) {
        Text("⚡", fontSize = 12.sp)
        Spacer(Modifier.width(4.dp))
        Text(
          "NEXT PRIORITY",
          color = BrandViolet,
          style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold)
        )
      }

      PXBadge(text = task.priority.label, backgroundColor = task.priority.color.copy(alpha = 0.15f), textColor = task.priority.color)
    }

    Spacer(Modifier.height(12.dp))

    Text(
      text = task.title,
      style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold)
    )

    if (task.description != null) {
      Spacer(Modifier.height(6.dp))
      Text(
        text = task.description,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
    }

    Spacer(Modifier.height(16.dp))

    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      PXButton(
        text = "Mark Done",
        variant = ButtonVariant.GRADIENT,
        height = 40.dp,
        modifier = Modifier.weight(1f),
        onClick = onDone
      )

      Box(
        modifier = Modifier
          .height(40.dp)
          .clip(RoundedCornerShape(12.dp))
          .background(MaterialTheme.colorScheme.surfaceVariant)
          .clickable(onClick = onAIPrompt)
          .padding(horizontal = 16.dp),
        contentAlignment = Alignment.Center
      ) {
        Text("AI Plan", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
      }
    }
  }
}

@Composable
fun TaskCard(
  task: TaskItem,
  onDone: () -> Unit,
  onDelete: () -> Unit
) {
  PXCard(cornerRadius = 18.dp, padding = 14.dp) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      verticalAlignment = Alignment.Top
    ) {
      Box(
        modifier = Modifier
          .size(22.dp)
          .border(2.dp, task.priority.color, RoundedCornerShape(6.dp))
          .clickable(onClick = onDone)
      )

      Spacer(Modifier.width(12.dp))

      Column(modifier = Modifier.weight(1f)) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
          PXBadge(text = task.priority.label, backgroundColor = task.priority.color.copy(alpha = 0.12f), textColor = task.priority.color)
          if (task.category != null) {
            PXBadge(text = task.category, backgroundColor = MaterialTheme.colorScheme.surfaceVariant, textColor = MaterialTheme.colorScheme.onSurfaceVariant)
          }
        }
        Spacer(Modifier.height(4.dp))
        Text(
          text = task.title,
          style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium)
        )
      }
    }
  }
}
