package in.prioryxai.app.ui.screens.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prioryxai.app.core.models.Profile
import in.prioryxai.app.ui.components.ButtonVariant
import in.prioryxai.app.ui.components.PXButton
import in.prioryxai.app.ui.theme.BrandViolet

@Composable
fun AuthScreen(
  onAuthSuccess: (Profile) -> Unit
) {
  var isSignUp by remember { mutableStateOf(false) }
  var email by remember { mutableStateOf("") }
  var password by remember { mutableStateOf("") }
  var fullName by remember { mutableStateOf("") }
  var isLoading by remember { mutableStateOf(false) }

  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
      .statusBarsPadding()
      .navigationBarsPadding()
      .verticalScroll(rememberScrollState())
      .padding(horizontal = 24.dp, vertical = 20.dp)
  ) {
    Text(
      text = if (isSignUp) "Create account" else "Welcome back",
      style = MaterialTheme.typography.displayLarge.copy(fontSize = 28.sp),
      fontWeight = FontWeight.Bold
    )
    Spacer(Modifier.height(6.dp))
    Text(
      text = if (isSignUp) "Join engineering students building high-signal portfolios." else "Sign in to access your prioritized tasks & career tools.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )

    Spacer(Modifier.height(24.dp))

    // Social OAuth
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .height(50.dp)
        .clip(RoundedCornerShape(14.dp))
        .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
        .clickable {
          onAuthSuccess(
            Profile(
              id = "google-user-123",
              fullName = "Rahul Sharma",
              email = "student@gmail.com",
              college = "IIT Bombay",
              semester = 6
            )
          )
        },
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.Center
    ) {
      Text("🌐", fontSize = 18.sp)
      Spacer(Modifier.width(10.dp))
      Text("Continue with Google", fontWeight = FontWeight.SemiBold)
    }

    Spacer(Modifier.height(12.dp))

    Row(
      modifier = Modifier
        .fillMaxWidth()
        .height(50.dp)
        .clip(RoundedCornerShape(14.dp))
        .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
        .clickable {
          onAuthSuccess(
            Profile(
              id = "github-user-123",
              fullName = "Developer User",
              email = "dev@github.com",
              college = "BITS Pilani",
              semester = 6,
              githubUsername = "codewithyug06"
            )
          )
        },
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.Center
    ) {
      Text("🐙", fontSize = 18.sp)
      Spacer(Modifier.width(10.dp))
      Text("Continue with GitHub", fontWeight = FontWeight.SemiBold)
    }

    Spacer(Modifier.height(20.dp))
    HorizontalDivider()
    Spacer(Modifier.height(20.dp))

    // Form
    if (isSignUp) {
      OutlinedTextField(
        value = fullName,
        onValueChange = { fullName = it },
        label = { Text("Full Name") },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp)
      )
      Spacer(Modifier.height(12.dp))
    }

    OutlinedTextField(
      value = email,
      onValueChange = { email = it },
      label = { Text("College Email (you@college.edu.in)") },
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(14.dp)
    )

    Spacer(Modifier.height(12.dp))

    OutlinedTextField(
      value = password,
      onValueChange = { password = it },
      label = { Text("Password") },
      visualTransformation = PasswordVisualTransformation(),
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(14.dp)
    )

    Spacer(Modifier.height(20.dp))

    PXButton(
      text = if (isSignUp) "Create Free Account →" else "Sign In ⚡",
      variant = ButtonVariant.GRADIENT,
      height = 52.dp,
      isLoading = isLoading,
      onClick = {
        isLoading = true
        onAuthSuccess(
          Profile(
            id = "mock-email-id",
            fullName = if (fullName.isNotBlank()) fullName else "Engineering Student",
            email = if (email.isNotBlank()) email else "user@prioryxai.in",
            college = "Engineering College",
            semester = 6
          )
        )
      }
    )

    Spacer(Modifier.height(20.dp))

    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.Center,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Text(
        text = if (isSignUp) "Already have an account? " else "Don't have an account? ",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
      Text(
        text = if (isSignUp) "Sign in" else "Sign up",
        color = BrandViolet,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.clickable { isSignUp = !isSignUp }
      )
    }
  }
}
