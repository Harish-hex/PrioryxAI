plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("org.jetbrains.kotlin.plugin.compose")
}

android {
  namespace = "in.prioryxai.app"
  compileSdk = 34

  defaultConfig {
    applicationId = "in.prioryxai.app"
    minSdk = 26
    targetSdk = 34
    versionCode = 1
    versionName = "1.0.0"

    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    vectorDrawables {
      useSupportLibrary = true
    }
  }

  buildTypes {
    release {
      isMinifyEnabled = true
      proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
      )
    }
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
  kotlinOptions {
    jvmTarget = "17"
  }
  buildFeatures {
    compose = true
  }
  packaging {
    resources {
      excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
  }
}

dependencies {
  // Compose BOM
  val composeBom = platform("androidx.compose:compose-bom:2024.05.00")
  implementation(composeBom)
  implementation("androidx.compose.ui:ui")
  implementation("androidx.compose.ui:ui-graphics")
  implementation("androidx.compose.ui:ui-tooling-preview")
  implementation("androidx.compose.material3:material3")
  implementation("androidx.compose.material:material-icons-extended")
  
  // Navigation
  implementation("androidx.navigation:navigation-compose:2.7.7")
  
  // Architecture
  implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.0")
  implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.0")
  implementation("androidx.activity:activity-compose:1.9.0")
  
  // Supabase
  implementation(platform("io.github.jan-tennert.supabase:bom:2.4.0"))
  implementation("io.github.jan-tennert.supabase:postgrest-kt")
  implementation("io.github.jan-tennert.supabase:auth-kt")
  implementation("io.github.jan-tennert.supabase:storage-kt")
  implementation("io.github.jan-tennert.supabase:realtime-kt")
  implementation("io.ktor:ktor-client-android:2.3.11")
  
  // Coroutines
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
  
  // DataStore
  implementation("androidx.datastore:datastore-preferences:1.1.1")
  
  // Image loading
  implementation("io.coil-kt:coil-compose:2.6.0")
  
  // Lottie
  implementation("com.airbnb.android:lottie-compose:6.4.0")
  
  // Razorpay
  implementation("com.razorpay:checkout:1.6.40")
  
  // Security
  implementation("androidx.security:security-crypto:1.1.0-alpha06")
  
  // Retrofit & Networking
  implementation("com.squareup.retrofit2:retrofit:2.11.0")
  implementation("com.squareup.retrofit2:converter-gson:2.11.0")
  implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
}
