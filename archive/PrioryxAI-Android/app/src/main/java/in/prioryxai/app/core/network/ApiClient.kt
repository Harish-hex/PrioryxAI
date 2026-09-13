package in.prioryxai.app.core.network

import in.prioryxai.app.core.models.Job
import in.prioryxai.app.core.models.Profile
import in.prioryxai.app.core.models.Project
import in.prioryxai.app.core.models.TaskItem
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {
  @GET("mobile/bootstrap")
  suspend fun getMobileBootstrap(): Map<String, Any>

  @GET("user/context")
  suspend fun getUserContext(): Map<String, Any>

  @GET("planning/overview")
  suspend fun getPlanningOverview(): Map<String, Any>

  @GET("skills/gaps")
  suspend fun getSkillGaps(): Map<String, Any>

  @GET("opportunities")
  suspend fun getOpportunities(): Map<String, Any>

  @GET("user/profile")
  suspend fun getProfile(): Profile
  
  @GET("tasks")
  suspend fun getTasks(): List<TaskItem>
  
  @POST("tasks")
  suspend fun createTask(@Body task: TaskItem): TaskItem
  
  @GET("projects/ideas")
  suspend fun getProjectIdeas(): List<Project>
  
  @GET("career/market/jobs")
  suspend fun getJobs(): List<Job>
}

class AuthInterceptor(private val tokenProvider: () -> String?) : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    val requestBuilder = chain.request().newBuilder()
    tokenProvider()?.let { token ->
      requestBuilder.addHeader("Authorization", "Bearer $token")
    }
    return chain.proceed(requestBuilder.build())
  }
}

object ApiClient {
  private const val BASE_URL = "https://www.prioryxai.in/api/"
  private var token: String? = null
  
  fun setToken(newToken: String?) {
    token = newToken
  }
  
  private val okHttpClient = OkHttpClient.Builder()
    .addInterceptor(AuthInterceptor { token })
    .addInterceptor(HttpLoggingInterceptor().apply {
      level = HttpLoggingInterceptor.Level.BASIC
    })
    .build()
  
  val retrofit: Retrofit = Retrofit.Builder()
    .baseUrl(BASE_URL)
    .client(okHttpClient)
    .addConverterFactory(GsonConverterFactory.create())
    .build()
  
  val apiService: ApiService = retrofit.create(ApiService::class.java)
}
