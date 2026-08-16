package in.prioryxai.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prioryxai.app.ui.theme.*

@Composable
fun PXBadge(
  text: String,
  modifier: Modifier = Modifier,
  backgroundColor: Color = BrandViolet.copy(alpha = 0.12f),
  textColor: Color = BrandViolet
) {
  Box(
    modifier = modifier
      .clip(RoundedCornerShape(8.dp))
      .background(backgroundColor)
      .padding(horizontal = 8.dp, vertical = 4.dp),
    contentAlignment = Alignment.Center
  ) {
    Text(
      text = text,
      color = textColor,
      style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold)
    )
  }
}

@Composable
fun PXAvatar(
  initials: String,
  modifier: Modifier = Modifier,
  size: Dp = 40.dp
) {
  Box(
    modifier = modifier
      .size(size)
      .clip(CircleShape)
      .background(Brush.linearGradient(listOf(BrandViolet, BrandCyan))),
    contentAlignment = Alignment.Center
  ) {
    Text(
      text = initials.uppercase(),
      color = Color.White,
      fontSize = (size.value * 0.38f).sp,
      fontWeight = FontWeight.Bold
    )
  }
}

@Composable
fun ScoreRing(
  score: Int,
  modifier: Modifier = Modifier,
  size: Dp = 80.dp,
  label: String? = null
) {
  val animatedProgress by animateFloatAsState(
    targetValue = (score.coerceIn(0, 100)) / 100f,
    animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
    label = "score"
  )
  
  val ringColor = when {
    score < 40 -> BrandRed
    score < 60 -> BrandAmber
    score < 80 -> Color(0xFF3B82F6)
    else -> BrandEmerald
  }

  Box(
    modifier = modifier.size(size),
    contentAlignment = Alignment.Center
  ) {
    Canvas(modifier = Modifier.fillMaxSize()) {
      val strokeWidth = size.toPx() * 0.1f
      val radius = (size.toPx() - strokeWidth) / 2
      
      // Track
      drawArc(
        color = Color(0xFFE5E5EA),
        startAngle = -90f,
        sweepAngle = 360f,
        useCenter = false,
        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
      )
      
      // Progress
      drawArc(
        color = ringColor,
        startAngle = -90f,
        sweepAngle = 360f * animatedProgress,
        useCenter = false,
        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
      )
    }
    
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
      Text(
        text = "$score",
        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold)
      )
      Text(
        text = label ?: "/ 100",
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
    }
  }
}

@Composable
fun SkeletonLoader(
  modifier: Modifier = Modifier,
  height: Dp = 20.dp,
  cornerRadius: Dp = 12.dp
) {
  val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
  val alpha by infiniteTransition.animateFloat(
    initialValue = 0.3f,
    targetValue = 0.8f,
    animationSpec = infiniteRepeatable(
      animation = tween(durationMillis = 800, easing = LinearEasing),
      repeatMode = RepeatMode.Reverse
    ),
    label = "alpha"
  )
  
  Box(
    modifier = modifier
      .fillMaxWidth()
      .height(height)
      .clip(RoundedCornerShape(cornerRadius))
      .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = alpha))
  )
}

@Composable
fun EmptyState(
  emoji: String = "✨",
  title: String,
  description: String? = null,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier
      .fillMaxWidth()
      .padding(24.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.Center
  ) {
    Box(
      modifier = Modifier
        .size(64.dp)
        .clip(CircleShape)
        .background(MaterialTheme.colorScheme.surfaceVariant),
      contentAlignment = Alignment.Center
    ) {
      Text(text = emoji, fontSize = 32.sp)
    }
    Spacer(Modifier.height(12.dp))
    Text(
      text = title,
      style = MaterialTheme.typography.headlineSmall,
      textAlign = TextAlign.Center
    )
    if (description != null) {
      Spacer(Modifier.height(6.dp))
      Text(
        text = description,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center
      )
    }
  }
}
