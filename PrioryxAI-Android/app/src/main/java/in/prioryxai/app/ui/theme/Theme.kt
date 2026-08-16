package in.prioryxai.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val PrioryxTypography = Typography(
  displayLarge = TextStyle(
    fontFamily = FontFamily.Default,
    fontWeight = FontWeight.Bold,
    fontSize = 32.sp,
    lineHeight = 40.sp
  ),
  headlineLarge = TextStyle(
    fontFamily = FontFamily.Default,
    fontWeight = FontWeight.Bold,
    fontSize = 24.sp,
    lineHeight = 32.sp
  ),
  headlineMedium = TextStyle(
    fontFamily = FontFamily.Default,
    fontWeight = FontWeight.SemiBold,
    fontSize = 20.sp,
    lineHeight = 28.sp
  ),
  headlineSmall = TextStyle(
    fontFamily = FontFamily.Default,
    fontWeight = FontWeight.SemiBold,
    fontSize = 17.sp,
    lineHeight = 24.sp
  ),
  bodyLarge = TextStyle(
    fontFamily = FontFamily.Default,
    fontWeight = FontWeight.Normal,
    fontSize = 16.sp,
    lineHeight = 24.sp
  ),
  bodyMedium = TextStyle(
    fontFamily = FontFamily.Default,
    fontWeight = FontWeight.Normal,
    fontSize = 14.sp,
    lineHeight = 20.sp
  ),
  bodySmall = TextStyle(
    fontFamily = FontFamily.Default,
    fontWeight = FontWeight.Normal,
    fontSize = 12.sp,
    lineHeight = 16.sp
  ),
  labelLarge = TextStyle(
    fontFamily = FontFamily.Default,
    fontWeight = FontWeight.Medium,
    fontSize = 13.sp,
    lineHeight = 18.sp
  ),
  labelSmall = TextStyle(
    fontFamily = FontFamily.Default,
    fontWeight = FontWeight.Medium,
    fontSize = 11.sp,
    lineHeight = 14.sp
  )
)

val PrioryxShapes = Shapes(
  small = RoundedCornerShape(8.dp),
  medium = RoundedCornerShape(16.dp),
  large = RoundedCornerShape(22.dp)
)

private val LightColorScheme = lightColorScheme(
  primary = BrandViolet,
  secondary = BrandCyan,
  tertiary = BrandEmerald,
  background = LightBackground,
  surface = LightSurface1,
  surfaceVariant = LightSurface2,
  onPrimary = LightBackground,
  onBackground = LightLabelPrimary,
  onSurface = LightLabelPrimary,
  onSurfaceVariant = LightLabelSecondary,
  outline = LightSeparator
)

private val DarkColorScheme = darkColorScheme(
  primary = BrandViolet,
  secondary = BrandCyan,
  tertiary = BrandEmerald,
  background = DarkBackground,
  surface = DarkSurface1,
  surfaceVariant = DarkSurface2,
  onPrimary = LightBackground,
  onBackground = DarkLabelPrimary,
  onSurface = DarkLabelPrimary,
  onSurfaceVariant = DarkLabelSecondary,
  outline = DarkSeparator
)

@Composable
fun PrioryxAITheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  content: @Composable () -> Unit
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
  MaterialTheme(
    colorScheme = colorScheme,
    typography = PrioryxTypography,
    shapes = PrioryxShapes,
    content = content
  )
}
