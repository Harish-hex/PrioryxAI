package in.prioryxai.app.ui.screens.upgrade

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
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
import in.prioryxai.app.ui.components.PXCard
import in.prioryxai.app.ui.theme.BrandCyan
import in.prioryxai.app.ui.theme.BrandEmerald
import in.prioryxai.app.ui.theme.BrandViolet

@Composable
fun UpgradeScreen(
  onDismiss: () -> Unit,
  onUpgradeSuccess: () -> Unit
) {
  var selectedPlan by remember { mutableStateOf("yearly") }
  var isLoading by remember { mutableStateOf(false) }

  val features = listOf(
    "Unlimited AI Copilot messages",
    "Resume Intelligence — 64+ technical skills",
    "Project Foundry — 6-phase guided portfolio",
    "LeetCode + HackerRank tracking",
    "GitHub Intelligence — repo health & streaks",
    "Matched internship & SDE openings",
    "Placement readiness score breakdown"
  )

  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
  ) {
    // Hero Banner
    Box(
      modifier = Modifier
        .fillMaxWidth()
        .background(Brush.linearGradient(listOf(BrandViolet, BrandCyan)))
        .statusBarsPadding()
        .padding(vertical = 32.dp),
      contentAlignment = Alignment.Center
    ) {
      IconButton(
        onClick = onDismiss,
        modifier = Modifier
          .align(Alignment.TopEnd)
          .padding(8.dp)
      ) {
        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
      }

      Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
          modifier = Modifier
            .size(72.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.2f)),
          contentAlignment = Alignment.Center
        ) {
          Text("⚡", fontSize = 36.sp)
        }
        Spacer(Modifier.height(12.dp))
        Text("PrioryxAI Pro ✦", style = MaterialTheme.typography.headlineLarge, color = Color.White, fontWeight = FontWeight.Bold)
        Text("Everything a serious engineering student needs.", color = Color.White.copy(alpha = 0.85f), textAlign = TextAlign.Center)
      }
    }

    LazyColumn(
      modifier = Modifier
        .weight(1f)
        .padding(horizontal = 20.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
      contentPadding = PaddingValues(vertical = 16.dp)
    ) {
      // Plan Selection
      item {
        PXCard(
          cornerRadius = 18.dp,
          padding = 16.dp,
          modifier = Modifier.clickable { selectedPlan = "yearly" }
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Column {
              Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Annual Pro", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(8.dp))
                PXBadge(text = "SAVE 40%")
              }
              Text("Billed annually (₹499/year)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text("₹41/mo", style = MaterialTheme.typography.headlineSmall, color = BrandViolet, fontWeight = FontWeight.Bold)
          }
        }
      }

      item {
        PXCard(
          cornerRadius = 18.dp,
          padding = 16.dp,
          modifier = Modifier.clickable { selectedPlan = "monthly" }
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Column {
              Text("Monthly Pro", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
              Text("Cancel anytime", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text("₹59/mo", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
          }
        }
      }

      item {
        Spacer(Modifier.height(8.dp))
        Text("INCLUDED WITH PRO", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
      }

      items(features) { feature ->
        Row(verticalAlignment = Alignment.CenterVertically) {
          Icon(Icons.Default.CheckCircle, contentDescription = null, tint = BrandEmerald, modifier = Modifier.size(20.dp))
          Spacer(Modifier.width(12.dp))
          Text(feature, style = MaterialTheme.typography.bodyMedium)
        }
      }
    }

    // CTA
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .navigationBarsPadding()
        .padding(horizontal = 20.dp, vertical = 16.dp),
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      PXButton(
        text = if (selectedPlan == "yearly") "Upgrade to Pro — ₹499/year" else "Upgrade to Pro — ₹59/month",
        variant = ButtonVariant.GRADIENT,
        height = 54.dp,
        isLoading = isLoading,
        onClick = {
          isLoading = true
          onUpgradeSuccess()
        }
      )
      Spacer(Modifier.height(6.dp))
      Text("Secure payment via Razorpay · Cancel anytime", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
  }
}
