import Foundation

class SupabaseManager {
  static let shared = SupabaseManager()
  
  let supabaseURL = URL(string: "https://wgvswyatbrdggrdadqss.supabase.co")!
  let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnN3eWF0YnJkZ2dyZGFkcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODgyNDgsImV4cCI6MjA5MTQ2NDI0OH0.oZxLP9TjeuyYz1XOCBsrytcM7re514RErKDBk6BIHw0"
  
  private init() {}
}

class APIClient {
  static let shared = APIClient()
  let baseURL = Endpoints.baseURL
  
  private init() {}
  
  func request<T: Decodable>(
    _ endpoint: String,
    method: String = "GET",
    body: Encodable? = nil,
    accessToken: String? = nil
  ) async throws -> T {
    guard let url = URL(string: baseURL + endpoint) else {
      throw URLError(.badURL)
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = method
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    if let token = accessToken ?? KeychainHelper.standard.read(service: "in.prioryxai.app", account: "access_token") {
      request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
    
    if let body = body {
      request.httpBody = try JSONEncoder().encode(body)
    }
    
    let (data, response) = try await URLSession.shared.data(for: request)
    
    guard let httpResponse = response as? HTTPURLResponse,
          (200...299).contains(httpResponse.statusCode) else {
      throw URLError(.badServerResponse)
    }
    
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return try decoder.decode(T.self, from: data)
  }
}
