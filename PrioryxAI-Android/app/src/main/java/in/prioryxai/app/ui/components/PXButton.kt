package in.prioryxai.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import in.prioryxai.app.ui.theme.*

enum class ButtonVariant {
  PRIMARY, SECONDARY, GRADIENT, GHOST, DANGER
}

@Composable
fun PXButton(
  text: String,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
  variant: ButtonVariant = ButtonVariant.PRIMARY,
  height: Dp = 48.dp,
  isLoading: Boolean = false,
  enabled: Boolean = true
) {
  val shape = RoundedCornerShape(14.dp)
  
  val bgModifier = when (variant) {
    ButtonVariant.GRADIENT -> Modifier.background(Brush.linearGradient(listOf(BrandViolet, BrandCyan)))
    ButtonVariant.PRIMARY -> Modifier.background(BrandViolet)
    ButtonVariant.SECONDARY -> Modifier.background(MaterialTheme.colorScheme.surfaceVariant)
    ButtonVariant.GHOST -> Modifier.background(Color.Transparent)
    ButtonVariant.DANGER -> Modifier.background(BrandRed.copy(alpha = 0.12f))
  }
  
  val textColor = when (variant) {
    ButtonVariant.GRADIENT, ButtonVariant.PRIMARY -> Color.White
    ButtonVariant.SECONDARY -> MaterialTheme.colorScheme.onSurface
    ButtonVariant.GHOST -> BrandViolet
    ButtonVariant.DANGER -> BrandRed
  }

  Box(
    modifier = modifier
      .fillMaxWidth()
      .height(height)
      .clip(shape)
      .then(if (variant == ButtonVariant.SECONDARY) Modifier.border(1.dp, MaterialTheme.colorScheme.outline, shape) else Modifier)
      .then(bgModifier)
      .clickable(enabled = enabled && !isLoading, onClick = onClick),
    contentAlignment = Alignment.Center
  ) {
    if (isLoading) {
      CircularProgressIndicator(color = textColor, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
    } else {
      Text(
        text = text,
        color = textColor,
        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
      )
    }
  }
}

@Composable
fun PXCard(
  modifier: Modifier = Modifier,
  cornerRadius: Dp = 20.dp,
  padding: Dp = 16.dp,
  content: @Composable ColumnScope.() -> Unit
) {
  val shape = RoundedCornerShape(cornerRadius)
  Column(
    modifier = modifier
      .fillMaxWidth()
      .shadow(elevation = 2.dp, shape = shape, spotColor = Color.Black.copy(alpha = 0.06f))
      .clip(shape)
      .background(MaterialTheme.colorScheme.surface)
      .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f), shape)
      .padding(padding),
    content = content
  )
}
