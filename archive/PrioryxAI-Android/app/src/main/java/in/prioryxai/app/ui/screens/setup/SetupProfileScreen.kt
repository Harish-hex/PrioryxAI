package in.prioryxai.app.ui.screens.setup

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prioryxai.app.ui.components.ButtonVariant
import in.prioryxai.app.ui.components.PXBadge
import in.prioryxai.app.ui.components.PXButton
import in.prioryxai.app.ui.theme.BrandCyan
import in.prioryxai.app.ui.theme.BrandViolet

@Composable
fun SetupProfileScreen(
  onComplete: (String, Int, String) -> Unit
) {
  var college by remember { mutableStateOf("") }
  var semester by remember { mutableIntStateOf(6) }
  var targetRole by remember { mutableStateOf("Fullstack Engineer") }

  val roles = listOf(
    "Fullstack Engineer",
    "Backend Engineer (Go/Java)",
    "Frontend Engineer (React/Next)",
    "AI / ML Engineer",
    "Cloud / DevOps Engineer"
  )

  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
      .statusBarsPadding()
      .navigationBarsPadding()
      .verticalScroll(rememberScrollState())
      .padding(horizontal = 24.dp, vertical = 20.dp)
  ) {
    PXBadge(text = "STEP 1 OF 2")
    Spacer(Modifier.height(10.dp))
    Text("Academic Details", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
    Text(
      "Configure your exam timetable engine & semester priority roadmap.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )

    Spacer(Modifier.height(24.dp))

    Text("College / University", style = MaterialTheme.typography.labelLarge)
    Spacer(Modifier.height(6.dp))
    OutlinedTextField(
      value = college,
      onValueChange = { college = it },
      placeholder = { Text("e.g. IIT Bombay, Anna University, BITS Pilani") },
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(14.dp)
    )

    Spacer(Modifier.height(20.dp))

    Text("Current Semester", style = MaterialTheme.typography.labelLarge)
    Spacer(Modifier.height(8.dp))
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
      (1..8).forEach { sem ->
        val isSelected = semester == sem
        Box(
          modifier = Modifier
            .weight(1f)
            .height(40.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) BrandViolet else MaterialTheme.colorScheme.surfaceVariant)
            .clickable { semester = sem },
          contentAlignment = Alignment.Center
        ) {
          Text(
            "S$sem",
            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp
          )
        }
      }
    }

    Spacer(Modifier.height(24.dp))

    Text("Target Career Track", style = MaterialTheme.typography.labelLarge)
    Spacer(Modifier.height(8.dp))
    roles.forEach { role ->
      val isSelected = targetRole == role
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(vertical = 4.dp)
          .clip(RoundedCornerShape(14.dp))
          .background(if (isSelected) BrandViolet.copy(alpha = 0.08f) else MaterialTheme.colorScheme.surface)
          .border(
            1.dp,
            if (isSelected) BrandViolet else MaterialTheme.colorScheme.outline,
            RoundedCornerShape(14.dp)
          )
          .clickable { targetRole = role }
          .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Text(role, fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal)
        if (isSelected) {
          Text("✓", color = BrandViolet, fontWeight = FontWeight.Bold)
        }
      }
    }

    Spacer(Modifier.height(24.dp))

    PXButton(
      text = "Save & Enter Command Center →",
      variant = ButtonVariant.GRADIENT,
      height = 54.dp,
      onClick = {
        onComplete(if (college.isNotBlank()) college else "IIT Bombay", semester, targetRole)
      }
    )
  }
}

@Composable
fun SetupCompleteScreen(
  onLaunch: () -> Unit
) {
  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
      .statusBarsPadding()
      .navigationBarsPadding()
      .padding(24.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.Center
  ) {
    Box(
      modifier = Modifier
        .size(110.dp)
        .clip(CircleShape)
        .background(Brush.linearGradient(listOf(BrandViolet, BrandCyan))),
      contentAlignment = Alignment.Center
    ) {
      Text("🚀", fontSize = 52.sp)
    }

    Spacer(Modifier.height(24.dp))

    Text(
      "You're Ready to Roll!",
      style = MaterialTheme.typography.headlineLarge,
      fontWeight = FontWeight.Bold
    )

    Spacer(Modifier.height(10.dp))

    Text(
      "Your college roadmap, priority checklist, and AI career assistant are initialized.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
      textAlign = TextAlign.Center
    )

    Spacer(Modifier.height(36.dp))

    PXButton(
      text = "Launch PrioryxAI Command Center ⚡",
      variant = ButtonVariant.GRADIENT,
      height = 54.dp,
      onClick = onLaunch
    )
  }
}
