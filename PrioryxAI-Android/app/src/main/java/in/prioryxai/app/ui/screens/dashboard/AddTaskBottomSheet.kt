package in.prioryxai.app.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prioryxai.app.core.models.TaskItem
import in.prioryxai.app.core.models.TaskPriority
import in.prioryxai.app.ui.components.ButtonVariant
import in.prioryxai.app.ui.components.PXButton
import in.prioryxai.app.ui.theme.BrandViolet
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTaskBottomSheet(
  onDismiss: () -> Unit,
  onAddTask: (TaskItem) -> Unit
) {
  var title by remember { mutableStateOf("") }
  var description by remember { mutableStateOf("") }
  var priority by remember { mutableStateOf(TaskPriority.HIGH) }
  var category by remember { mutableStateOf("Assignment") }

  val categories = listOf("Assignment", "Exam Prep", "Project", "DSA Practice", "College Timetable")

  ModalBottomSheet(onDismissRequest = onDismiss) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 24.dp, vertical = 16.dp)
        .navigationBarsPadding()
    ) {
      Text("New Priority Task ⚡", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)

      Spacer(Modifier.height(16.dp))

      Text("Task Title", style = MaterialTheme.typography.labelLarge)
      Spacer(Modifier.height(6.dp))
      OutlinedTextField(
        value = title,
        onValueChange = { title = it },
        placeholder = { Text("e.g. OS Lab Assignment 3") },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp)
      )

      Spacer(Modifier.height(14.dp))

      Text("Description", style = MaterialTheme.typography.labelLarge)
      Spacer(Modifier.height(6.dp))
      OutlinedTextField(
        value = description,
        onValueChange = { description = it },
        placeholder = { Text("e.g. Implement mutex locks") },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp)
      )

      Spacer(Modifier.height(14.dp))

      Text("Priority", style = MaterialTheme.typography.labelLarge)
      Spacer(Modifier.height(6.dp))
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        TaskPriority.values().forEach { p ->
          val isSelected = priority == p
          Box(
            modifier = Modifier
              .weight(1f)
              .height(38.dp)
              .clip(RoundedCornerShape(10.dp))
              .background(if (isSelected) BrandViolet else MaterialTheme.colorScheme.surfaceVariant)
              .clickable { priority = p },
            contentAlignment = Alignment.Center
          ) {
            Text(
              p.label,
              color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
              fontWeight = FontWeight.Bold,
              fontSize = 12.sp
            )
          }
        }
      }

      Spacer(Modifier.height(14.dp))

      Text("Category", style = MaterialTheme.typography.labelLarge)
      Spacer(Modifier.height(6.dp))
      LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(categories) { cat ->
          val isSelected = category == cat
          Box(
            modifier = Modifier
              .clip(RoundedCornerShape(8.dp))
              .background(if (isSelected) BrandViolet.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surfaceVariant)
              .clickable { category = cat }
              .padding(horizontal = 12.dp, vertical = 6.dp)
          ) {
            Text(
              cat,
              color = if (isSelected) BrandViolet else MaterialTheme.colorScheme.onSurface,
              fontWeight = FontWeight.SemiBold,
              fontSize = 12.sp
            )
          }
        }
      }

      Spacer(Modifier.height(24.dp))

      PXButton(
        text = "Save Priority Task ⚡",
        variant = ButtonVariant.GRADIENT,
        height = 52.dp,
        onClick = {
          if (title.isNotBlank()) {
            onAddTask(
              TaskItem(
                id = UUID.randomUUID().toString(),
                title = title,
                description = if (description.isNotBlank()) description else null,
                priority = priority,
                category = category
              )
            )
          }
        }
      )
    }
  }
}
