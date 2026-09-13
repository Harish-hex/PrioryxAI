import SwiftUI

struct AuthView: View {
  @EnvironmentObject var auth: AuthManager
  @State private var isSignUp = false
  @State private var email = ""
  @State private var password = ""
  @State private var fullName = ""
  @State private var isLoading = false
  @State private var errorMessage: String?
  @State private var infoMessage: String?
  
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
        
        // Social OAuth — not wired to real GitHub/Google sign-in yet (needs
        // ASWebAuthenticationSession + a redirect URI registered with
        // Supabase; ran out of scope for this pass). Shown disabled rather
        // than silently faking a signed-in session as the previous
        // "demo_google_jwt"/"demo_github_jwt" placeholders did.
        VStack(spacing: 12) {
          Button(action: { infoMessage = "Google sign-in is coming soon — use email for now." }) {
            HStack(spacing: 10) {
              Text("🌐")
              Text("Continue with Google")
                .font(.bodyMD)
                .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.surface1)
            .foregroundColor(Color.labelTertiary)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.separator, lineWidth: 1))
          }

          Button(action: { infoMessage = "GitHub sign-in is coming soon — use email for now." }) {
            HStack(spacing: 10) {
              Text("🐙")
              Text("Continue with GitHub")
                .font(.bodyMD)
                .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.surface1)
            .foregroundColor(Color.labelTertiary)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.separator, lineWidth: 1))
          }
        }
        .padding(.top, 8)

        if let infoMessage {
          Text(infoMessage)
            .font(.captionSM)
            .foregroundColor(Color.labelSecondary)
        }
        
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

          if let errorMessage {
            Text(errorMessage)
              .font(.captionSM)
              .foregroundColor(.brandRed)
              .frame(maxWidth: .infinity, alignment: .leading)
          }

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
  
  private func handleEmailAuth() {
    guard !email.isEmpty && !password.isEmpty else { return }
    errorMessage = nil
    infoMessage = nil
    isLoading = true

    Task {
      defer { isLoading = false }
      do {
        if isSignUp {
          if let session = try await SupabaseAuthService.signUp(email: email, password: password, fullName: fullName) {
            await auth.signIn(token: session.accessToken, refreshToken: session.refreshToken)
          } else {
            infoMessage = "Account created — check your email to confirm, then sign in."
            isSignUp = false
          }
        } else {
          let session = try await SupabaseAuthService.signIn(email: email, password: password)
          await auth.signIn(token: session.accessToken, refreshToken: session.refreshToken)
        }
      } catch let authError as SupabaseAuthService.AuthError {
        errorMessage = authError.localizedDescriptionText
      } catch {
        errorMessage = "Something went wrong. Check your connection and try again."
      }
    }
  }
}
