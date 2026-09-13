import SwiftUI

struct AssistantMessage: Identifiable {
  let id = UUID()
  let role: String
  let content: String
  let timestamp: String
  
  var isUser: Bool { role == "user" }
}

@MainActor
class AssistantViewModel: ObservableObject {
  @Published var messages: [AssistantMessage] = [
    AssistantMessage(
      role: "assistant",
      content: "Hello! I'm your PrioryxAI academic & career copilot. Ask me to prioritize tasks, analyze syllabus topics, suggest system design projects, or review your resume.",
      timestamp: "Just now"
    )
  ]
  @Published var inputText: String = ""
  @Published var isLoading: Bool = false
  @Published var showUpgrade: Bool = false
  @Published var messagesUsed: Int = 1
  var isPro: Bool = false
  
  let suggestedPrompts = [
    "⚡ Prioritize my pending assignments for this week",
    "📄 Review my resume for ATS flaws and backend gaps",
    "💻 What 3 LeetCode problems should I solve today?",
    "🔨 Recommend a system design project for 6th semester"
  ]
  
  func sendMessage() async {
    guard !inputText.isEmpty else { return }
    let prompt = inputText
    inputText = ""
    
    let userMsg = AssistantMessage(role: "user", content: prompt, timestamp: "Just now")
    messages.append(userMsg)
    isLoading = true
    
    do {
      try await Task.sleep(nanoseconds: 1_000_000_000)
      let reply = "Here is my prioritized plan for you:\n\n1. **High Leverage Deliverables**: Complete your immediate Operating Systems lab task.\n2. **Targeted DSA**: Solve 2 LeetCode Mediums on Trees/Graphs.\n3. **Portfolio**: Push 1 clean commit to your Go Rate Limiter repository."
      let aiMsg = AssistantMessage(role: "assistant", content: reply, timestamp: "Just now")
      messages.append(aiMsg)
      messagesUsed += 1
      UINotificationFeedbackGenerator().notificationOccurred(.success)
    } catch {}
    isLoading = false
  }
}

struct ChatBubbleView: View {
  let message: AssistantMessage
  
  var body: some View {
    HStack(alignment: .bottom, spacing: 8) {
      if !message.isUser {
        ZStack {
          RoundedRectangle(cornerRadius: 10)
            .fill(Color.brandViolet.opacity(0.12))
            .frame(width: 28, height: 28)
          Text("✨").font(.system(size: 14))
        }
      } else {
        Spacer()
      }
      
      VStack(alignment: message.isUser ? .trailing : .leading, spacing: 4) {
        Text(message.content)
          .font(.bodyMD)
          .foregroundColor(message.isUser ? .white : Color.labelPrimary)
          .padding(.horizontal, 14)
          .padding(.vertical, 10)
          .background(message.isUser ? Color.brandViolet : Color.surface2)
          .clipShape(RoundedRectangle(cornerRadius: 18))
        
        Text(message.timestamp)
          .font(.captionSM)
          .foregroundColor(Color.labelTertiary)
          .padding(.horizontal, 4)
      }
      .frame(maxWidth: 300, alignment: message.isUser ? .trailing : .leading)
      
      if !message.isUser {
        Spacer()
      }
    }
  }
}

struct AssistantView: View {
  @StateObject var vm = AssistantViewModel()
  @FocusState private var isInputFocused: Bool
  
  var body: some View {
    NavigationStack {
      VStack(spacing: 0) {
        ScrollViewReader { proxy in
          ScrollView {
            LazyVStack(spacing: 12) {
              ForEach(vm.messages) { msg in
                ChatBubbleView(message: msg)
                  .id(msg.id)
              }
              
              if vm.isLoading {
                HStack {
                  Text("✨ Reasoning through your syllabus...")
                    .font(.captionLG)
                    .italic()
                    .foregroundColor(Color.brandViolet)
                  Spacer()
                }
                .padding(.horizontal, 16)
              }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
          }
          .onChange(of: vm.messages.count) {
            if let last = vm.messages.last {
              withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
            }
          }
        }
        
        if vm.messages.count <= 2 {
          ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
              ForEach(vm.suggestedPrompts, id: \.self) { prompt in
                Button(action: {
                  vm.inputText = prompt
                }) {
                  Text(prompt)
                    .font(.captionLG)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.surface2)
                    .foregroundColor(Color.labelPrimary)
                    .clipShape(Capsule())
                }
              }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 6)
          }
        }
        
        // Input bar
        HStack(spacing: 10) {
          TextField("Ask anything about syllabus, tasks, career...", text: $vm.inputText, axis: .vertical)
            .lineLimit(1...4)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.surface2)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .focused($isInputFocused)
          
          Button(action: {
            Task { await vm.sendMessage() }
          }) {
            ZStack {
              Circle()
                .fill(vm.inputText.isEmpty ? Color.surface3 : Color.brandViolet)
                .frame(width: 38, height: 38)
              Text("↑")
                .font(.titleSM)
                .foregroundColor(.white)
            }
          }
          .disabled(vm.inputText.isEmpty || vm.isLoading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.surface1)
      }
      .navigationTitle("AI Copilot ✨")
      .navigationBarTitleDisplayMode(.inline)
    }
  }
}
