package in.prioryxai.app.core.network

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import in.prioryxai.app.core.models.Profile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object SupabaseConfig {
  const val SUPABASE_URL = "https://wgvswyatbrdggrdadqss.supabase.co"
  const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnN3eWF0YnJkZ2dyZGFkcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODgyNDgsImV4cCI6MjA5MTQ2NDI0OH0.oZxLP9TjeuyYz1XOCBsrytcM7re514RErKDBk6BIHw0"
}

class TokenManager(context: Context) {
  private val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
  private val sharedPreferences = EncryptedSharedPreferences.create(
    "prioryxai_secure_prefs",
    masterKeyAlias,
    context,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
  )

  fun saveToken(token: String) {
    sharedPreferences.edit().putString("access_token", token).apply()
    ApiClient.setToken(token)
  }

  fun getToken(): String? {
    val token = sharedPreferences.getString("access_token", null)
    ApiClient.setToken(token)
    return token
  }

  fun clearToken() {
    sharedPreferences.edit().remove("access_token").apply()
    ApiClient.setToken(null)
  }
}

class AuthRepository(private val context: Context) {
  private val tokenManager = TokenManager(context)
  
  private val _currentProfile = MutableStateFlow<Profile?>(null)
  val currentProfile: StateFlow<Profile?> = _currentProfile.asStateFlow()
  
  private val _isAuthenticated = MutableStateFlow(false)
  val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()
  
  init {
    val token = tokenManager.getToken()
    if (token != null) {
      _isAuthenticated.value = true
      _currentProfile.value = Profile(
        id = "mock-user-id",
        fullName = "Engineering Student",
        email = "student@prioryxai.in",
        college = "IIT Bombay",
        semester = 6,
        subscriptionStatus = "free"
      )
    }
  }

  fun signIn(token: String, profile: Profile) {
    tokenManager.saveToken(token)
    _currentProfile.value = profile
    _isAuthenticated.value = true
  }

  fun signOut() {
    tokenManager.clearToken()
    _currentProfile.value = null
    _isAuthenticated.value = false
  }

  fun updateProfile(profile: Profile) {
    _currentProfile.value = profile
  }
}
