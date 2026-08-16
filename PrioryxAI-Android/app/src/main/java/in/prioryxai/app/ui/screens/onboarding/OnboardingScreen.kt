package in.prioryxai.app.ui.screens.onboarding

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prioryxai.app.ui.components.ButtonVariant
import in.prioryxai.app.ui.components.PXBadge
import in.prioryxai.app.ui.components.PXButton
import in.prioryxai.app.ui.theme.BrandViolet
import kotlinx.coroutines.launch

data class OnboardingPage(
  val emoji: String,
  val badge: String,
  val title: String,
  val highlight: String,
  val description: String
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(
  onNavigateToAuth: () -> Unit
) {
  val pages = listOf(
    OnboardingPage(
      emoji = "⚡",
      badge = "PRIORITY ENGINE",
      title = "Never miss an exam, assignment, or deadline",
      highlight = "again.",
      description = "PrioryxAI parses your college timetable and syllabus to auto-generate your daily priority checklist."
    ),
    OnboardingPage(
      emoji = "📄",
      badge = "RESUME INTELLIGENCE",
      title = "Bridge skill gaps with AI-recommended",
      highlight = "projects.",
      description = "Upload your resume to discover placement match scores, missing industry frameworks, and ATS vulnerabilities."
    ),
    OnboardingPage(
      emoji = "🎯",
      badge = "CAREER COMMAND CENTER",
      title = "Unified coding profiles & study",
      highlight = "duels.",
      description = "Sync GitHub, LeetCode, and HackerRank in one command center while competing with engineering peers across India."
    )
  )

  val pagerState = rememberPagerState(pageCount = { pages.size })
  val scope = rememberCoroutineScope()

  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
      .statusBarsPadding()
      .navigationBarsPadding()
  ) {
    // Header
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 24.dp, vertical = 16.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
          modifier = Modifier
            .size(28.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(BrandViolet),
          contentAlignment = Alignment.Center
        ) {
          Text("⚡", fontSize = 14.sp)
        }
        Spacer(Modifier.width(8.dp))
        Text("PrioryxAI", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
      }

      TextButton(onClick = onNavigateToAuth) {
        Text("Skip", color = MaterialTheme.colorScheme.onSurfaceVariant)
      }
    }

    // Pager
    HorizontalPager(
      state = pagerState,
      modifier = Modifier
        .weight(1f)
        .fillMaxWidth()
    ) { pageIndex ->
      val page = pages[pageIndex]
      Column(
        modifier = Modifier
          .fillMaxSize()
          .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
      ) {
        Box(
          modifier = Modifier
            .size(100.dp)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.surfaceVariant),
          contentAlignment = Alignment.Center
        ) {
          Text(page.emoji, fontSize = 48.sp)
        }
        Spacer(Modifier.height(16.dp))
        PXBadge(text = page.badge)
        Spacer(Modifier.height(16.dp))
        Text(
          text = page.title,
          style = MaterialTheme.typography.headlineLarge,
          textAlign = TextAlign.Center
        )
        Text(
          text = page.highlight,
          style = MaterialTheme.typography.headlineLarge.copy(color = BrandViolet),
          textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(12.dp))
        Text(
          text = page.description,
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
          textAlign = TextAlign.Center
        )
      }
    }

    // Footer
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 24.dp, vertical = 24.dp),
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        repeat(pages.size) { iteration ->
          val color = if (pagerState.currentPage == iteration) BrandViolet else MaterialTheme.colorScheme.surfaceVariant
          val width = if (pagerState.currentPage == iteration) 24.dp else 8.dp
          Box(
            modifier = Modifier
              .height(8.dp)
              .width(width)
              .clip(CircleShape)
              .background(color)
          )
        }
      }
      Spacer(Modifier.height(24.dp))
      PXButton(
        text = if (pagerState.currentPage == pages.size - 1) "Get Started ⚡" else "Continue →",
        variant = ButtonVariant.GRADIENT,
        height = 54.dp,
        onClick = {
          if (pagerState.currentPage < pages.size - 1) {
            scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
          } else {
            onNavigateToAuth()
          }
        }
      )
    }
  }
}
