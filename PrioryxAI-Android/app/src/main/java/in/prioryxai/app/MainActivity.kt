package in.prioryxai.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import in.prioryxai.app.core.auth.AuthRepository
import in.prioryxai.app.ui.navigation.PrioryxNavGraph
import in.prioryxai.app.ui.theme.PrioryxAITheme

class MainActivity : ComponentActivity() {
  private lateinit var authRepository: AuthRepository

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    authRepository = AuthRepository(applicationContext)

    setContent {
      PrioryxAITheme {
        Surface(
          modifier = Modifier.fillMaxSize(),
          color = MaterialTheme.colorScheme.background
        ) {
          PrioryxNavGraph(authRepository = authRepository)
        }
      }
    }
  }
}
