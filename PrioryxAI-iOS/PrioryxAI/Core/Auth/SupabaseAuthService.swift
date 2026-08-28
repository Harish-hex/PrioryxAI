import Foundation

/// Talks directly to Supabase's Auth (GoTrue) REST API rather than pulling
/// in the full supabase-swift client surface for just email/password auth —
/// this keeps the auth path small and easy to verify by inspection (no Xcode
/// compiler available in the environment this was written in), while using
/// the exact same project the web app (prioryxai.in) authenticates against.
///
/// The anon key below is the public, RLS-safe anon key (matches
/// NEXT_PUBLIC_SUPABASE_ANON_KEY on the web) — it is meant to be embedded in
/// client apps and is not a secret.
enum SupabaseAuthService {
  private static let projectURL = URL(string: "https://wgvswyatbrdggrdadqss.supabase.co")!
  private static let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnN3eWF0YnJkZ2dyZGFkcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODgyNDgsImV4cCI6MjA5MTQ2NDI0OH0.oZxLP9TjeuyYz1XOCBsrytcM7re514RErKDBk6BIHw0"

  struct Session: Decodable {
    let accessToken: String
    let refreshToken: String
    let user: SupabaseUser

    enum CodingKeys: String, CodingKey {
      case accessToken = "access_token"
      case refreshToken = "refresh_token"
      case user
    }
  }

  struct SupabaseUser: Decodable {
    let id: String
    let email: String?
  }

  struct AuthError: Decodable, LocalizedError {
    let errorDescription: String?
    let msg: String?

    enum CodingKeys: String, CodingKey {
      case errorDescription = "error_description"
      case msg
    }

    var localizedDescriptionText: String { errorDescription ?? msg ?? "Authentication failed." }
  }

  static func signIn(email: String, password: String) async throws -> Session {
    try await tokenRequest(grantType: "password", body: ["email": email, "password": password])
  }

  /// Supabase's `/signup` endpoint returns a session directly only when
  /// email confirmation is disabled for the project; if confirmation is
  /// required, `session` comes back nil and the caller should tell the
  /// user to check their email rather than treating this as a hard failure.
  static func signUp(email: String, password: String, fullName: String?) async throws -> Session? {
    let url = projectURL.appendingPathComponent("auth/v1/signup")
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(anonKey, forHTTPHeaderField: "apikey")

    var payload: [String: Any] = ["email": email, "password": password]
    if let fullName, !fullName.isEmpty {
      payload["data"] = ["full_name": fullName]
    }
    request.httpBody = try JSONSerialization.data(withJSONObject: payload)

    let (data, response) = try await URLSession.shared.data(for: request)
    try throwIfError(data: data, response: response)

    struct SignupResponse: Decodable {
      let accessToken: String?
      let refreshToken: String?
      let user: SupabaseUser?

      enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case user
      }
    }

    let decoded = try JSONDecoder().decode(SignupResponse.self, from: data)
    guard let accessToken = decoded.accessToken, let refreshToken = decoded.refreshToken, let user = decoded.user else {
      return nil // signed up, but needs email confirmation before a session exists
    }
    return Session(accessToken: accessToken, refreshToken: refreshToken, user: user)
  }

  private static func tokenRequest(grantType: String, body: [String: Any]) async throws -> Session {
    guard let url = URL(string: "auth/v1/token?grant_type=\(grantType)", relativeTo: projectURL) else {
      throw URLError(.badURL)
    }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(anonKey, forHTTPHeaderField: "apikey")
    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (data, response) = try await URLSession.shared.data(for: request)
    try throwIfError(data: data, response: response)
    return try JSONDecoder().decode(Session.self, from: data)
  }

  private static func throwIfError(data: Data, response: URLResponse) throws {
    guard let http = response as? HTTPURLResponse else { return }
    guard !(200...299).contains(http.statusCode) else { return }
    if let apiError = try? JSONDecoder().decode(AuthError.self, from: data) {
      throw apiError
    }
    throw URLError(.badServerResponse)
  }
}
