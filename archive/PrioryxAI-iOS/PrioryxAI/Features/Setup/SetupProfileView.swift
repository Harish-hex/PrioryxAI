import SwiftUI

struct SetupProfileView: View {
  @EnvironmentObject var auth: AuthManager
  @State private var college = ""
  @State private var semester = 6
  @State private var targetRole = "Fullstack Engineer"
  @State private var showComplete = false
  
  let roles = [
    "Fullstack Engineer",
    "Backend Engineer (Go/Java)",
    "Frontend Engineer (React/Next)",
    "AI / ML Engineer",
    "Cloud / DevOps Engineer"
  ]
  
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 20) {
          VStack(alignment: .leading, spacing: 6) {
            Text("STEP 1 OF 2")
              .font(.captionSM)
              .fontWeight(.bold)
              .foregroundColor(Color.brandViolet)
            
            Text("Academic Details")
              .font(.titleXL)
            
            Text("Configure your exam timetable engine & semester priority roadmap.")
              .font(.bodyMD)
              .foregroundColor(Color.labelSecondary)
          }
          .padding(.top, 24)
          
          VStack(alignment: .leading, spacing: 8) {
            Text("College / University")
              .font(.captionLG)
              .foregroundColor(Color.labelSecondary)
            
            TextField("e.g. IIT Bombay, Anna University, BITS Pilani", text: $college)
              .padding()
              .background(Color.surface2)
              .clipShape(RoundedRectangle(cornerRadius: 14))
          }
          
          VStack(alignment: .leading, spacing: 8) {
            Text("Current Semester")
              .font(.captionLG)
              .foregroundColor(Color.labelSecondary)
            
            HStack(spacing: 8) {
              ForEach(1...8, id: \.self) { sem in
                Button(action: { semester = sem }) {
                  Text("Sem \(sem)")
                    .font(.captionLG)
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .frame(height: 38)
                    .background(semester == sem ? Color.brandViolet : Color.surface2)
                    .foregroundColor(semester == sem ? .white : Color.labelPrimary)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
              }
            }
          }
          
          VStack(alignment: .leading, spacing: 8) {
            Text("Target Career Track")
              .font(.captionLG)
              .foregroundColor(Color.labelSecondary)
            
            VStack(spacing: 8) {
              ForEach(roles, id: \.self) { role in
                Button(action: { targetRole = role }) {
                  HStack {
                    Text(role)
                      .font(.bodyMD)
                      .foregroundColor(targetRole == role ? Color.brandViolet : Color.labelPrimary)
                    Spacer()
                    if targetRole == role {
                      Image(systemName: "checkmark")
                        .foregroundColor(Color.brandViolet)
                    }
                  }
                  .padding()
                  .background(targetRole == role ? Color.brandViolet.opacity(0.1) : Color.surface1)
                  .clipShape(RoundedRectangle(cornerRadius: 14))
                  .overlay(
                    RoundedRectangle(cornerRadius: 14)
                      .stroke(targetRole == role ? Color.brandViolet : Color.separator, lineWidth: 1)
                  )
                }
              }
            }
          }
          
          PXButton(title: "Save & Enter Command Center →", variant: .gradient, size: .lg) {
            var updated = auth.profile ?? Profile(id: UUID().uuidString)
            updated.college = college.isEmpty ? "IIT Bombay" : college
            updated.semester = semester
            // targetRole isn't part of the /user/profile schema (no server field
            // for it yet) — kept as local-only UI state for now.
            auth.profile = updated
            showComplete = true
          }
          .padding(.top, 16)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 40)
      }
      .navigationDestination(isPresented: $showComplete) {
        SetupCompleteView()
      }
    }
  }
}

struct SetupCompleteView: View {
  @EnvironmentObject var auth: AuthManager
  
  var body: some View {
    VStack(spacing: 24) {
      Spacer()
      
      ZStack {
        Circle()
          .fill(LinearGradient.brand)
          .frame(width: 120, height: 120)
        Text("🚀").font(.system(size: 56))
      }
      
      Text("You're Ready to Roll!")
        .font(.titleXL)
        .foregroundColor(Color.labelPrimary)
      
      Text("Your college roadmap, priority checklist, and AI career assistant are initialized.")
        .font(.bodyMD)
        .foregroundColor(Color.labelSecondary)
        .multilineTextAlignment(.center)
        .padding(.horizontal, 32)
      
      Spacer()
      
      PXButton(title: "Launch PrioryxAI Command Center ⚡", variant: .gradient, size: .lg) {
        // Triggers navigation to MainTabView
        var updated = auth.profile ?? Profile(id: UUID().uuidString)
        if updated.college == nil { updated.college = "IIT Bombay" }
        auth.profile = updated
      }
      .padding(.horizontal, 24)
      .padding(.bottom, 40)
    }
  }
}
