import SwiftUI

struct AuthView: View {
  @EnvironmentObject var auth: AuthManager
  @State private var isSignUp = false
  @State private var email = ""
  @State private var password = ""
  @State private var fullName = ""
  @State private var isLoading = false
  
  var body: some View {
    ScrollView {
      VStack(spacing: 20) {
        VStack(alignment: .leading, spacing: 8) {
          Text(isSignUp ? "Create account" : "Welcome back")
            .font(.titleXL)
            .foregroundColor(Color.labelPrimary)
          
          Text(isSignUp ? "Join engineering students building high-signal portfolios." : "Sign in to access your prioritized tasks & career tools.")
            .font(.bodyMD)
            .foregroundColor(Color.labelSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 24)
        
        // Social OAuth
        VStack(spacing: 12) {
          Button(action: handleGoogleAuth) {
            HStack(spacing: 10) {
              Text("🌐")
              Text("Continue with Google")
                .font(.bodyMD)
                .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.surface1)
            .foregroundColor(Color.labelPrimary)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.separator, lineWidth: 1))
          }
          
          Button(action: handleGitHubAuth) {
            HStack(spacing: 10) {
              Text("🐙")
              Text("Continue with GitHub")
                .font(.bodyMD)
                .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.surface1)
            .foregroundColor(Color.labelPrimary)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.separator, lineWidth: 1))
          }
        }
        .padding(.top, 8)
        
        // Divider
        HStack {
          Rectangle().fill(Color.separator).frame(height: 1)
          Text("OR EMAIL").font(.captionSM).foregroundColor(Color.labelTertiary).padding(.horizontal, 8)
          Rectangle().fill(Color.separator).frame(height: 1)
        }
        .padding(.vertical, 8)
        
        // Email Form
        VStack(spacing: 14) {
          if isSignUp {
            TextField("Full Name (e.g. Rahul Sharma)", text: $fullName)
              .padding()
              .background(Color.surface2)
              .clipShape(RoundedRectangle(cornerRadius: 14))
          }
          
          TextField("College Email (you@college.edu.in)", text: $email)
            .keyboardType(.emailAddress)
            .textInputAutocapitalization(.never)
            .padding()
            .background(Color.surface2)
            .clipShape(RoundedRectangle(cornerRadius: 14))
          
          SecureField("Password", text: $password)
            .padding()
            .background(Color.surface2)
            .clipShape(RoundedRectangle(cornerRadius: 14))
          
          PXButton(
            title: isSignUp ? "Create Free Account →" : "Sign In ⚡",
            variant: .gradient,
            size: .lg,
            isLoading: isLoading
          ) {
            handleEmailAuth()
          }
          .padding(.top, 8)
        }
        
        // Toggle Sign In / Sign Up
        HStack {
          Text(isSignUp ? "Already have an account?" : "Don't have an account?")
            .font(.bodyMD)
            .foregroundColor(Color.labelSecondary)
          
          Button(isSignUp ? "Sign in" : "Sign up") {
            withAnimation { isSignUp.toggle() }
          }
          .font(.bodyMD)
          .fontWeight(.semibold)
          .foregroundColor(Color.brandViolet)
        }
        .padding(.top, 16)
      }
      .padding(.horizontal, 24)
      .padding(.bottom, 40)
    }
  }
  
  private func handleGoogleAuth() {
    // Authenticate via OAuth
    auth.signIn(token: "demo_google_jwt", userProfile: Profile(
      id: UUID(),
      fullName: "Engineering Student",
      name: "Student",
      email: "user@gmail.com",
      college: "IIT Bombay",
      semester: 6,
      subscriptionStatus: "free"
    ))
  }
  
  private func handleGitHubAuth() {
    auth.signIn(token: "demo_github_jwt", userProfile: Profile(
      id: UUID(),
      fullName: "GitHub Developer",
      name: "Developer",
      email: "dev@github.com",
      college: "Anna University",
      semester: 6,
      githubUsername: "codewithyug06",
      subscriptionStatus: "free"
    ))
  }
  
  private func handleEmailAuth() {
    guard !email.isEmpty && !password.isEmpty else { return }
    isLoading = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
      isLoading = false
      auth.signIn(token: "demo_email_jwt", userProfile: Profile(
        id: UUID(),
        fullName: fullName.isEmpty ? "Rahul Sharma" : fullName,
        name: fullName.isEmpty ? "Rahul" : fullName,
        email: email,
        college: "Engineering Institute",
        semester: 6,
        subscriptionStatus: "free"
      ))
    }
  }
}
