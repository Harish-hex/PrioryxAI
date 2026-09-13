import SwiftUI

struct OnboardingSlide: Identifiable {
  let id = UUID()
  let emoji: String
  let badge: String
  let title: String
  let highlight: String
  let description: String
}

struct OnboardingView: View {
  @State private var currentStep = 0
  @State private var showAuth = false
  
  let slides: [OnboardingSlide] = [
    OnboardingSlide(
      emoji: "⚡",
      badge: "PRIORITY ENGINE",
      title: "Never miss an exam, assignment, or deadline",
      highlight: "again.",
      description: "PrioryxAI parses your college timetable and syllabus to auto-generate your daily priority checklist."
    ),
    OnboardingSlide(
      emoji: "📄",
      badge: "RESUME & ATS INTELLIGENCE",
      title: "Bridge skill gaps with AI-recommended",
      highlight: "projects.",
      description: "Upload your resume to discover placement match scores, missing industry frameworks, and ATS vulnerabilities."
    ),
    OnboardingSlide(
      emoji: "🎯",
      badge: "CAREER COMMAND CENTER",
      title: "Unified coding profiles & study",
      highlight: "duels.",
      description: "Sync GitHub, LeetCode, and HackerRank in one command center while competing with engineering peers across India."
    )
  ]
  
  var body: some View {
    NavigationStack {
      VStack(spacing: 0) {
        // Top Header
        HStack {
          HStack(spacing: 8) {
            ZStack {
              RoundedRectangle(cornerRadius: 8)
                .fill(LinearGradient.brand)
                .frame(width: 28, height: 28)
              Text("⚡").font(.system(size: 14))
            }
            Text("PrioryxAI")
              .font(.titleSM)
              .fontWeight(.bold)
          }
          
          Spacer()
          
          Button("Skip") {
            showAuth = true
          }
          .font(.bodyMD)
          .foregroundColor(Color.labelSecondary)
        }
        .padding(.horizontal, 24)
        .padding(.top, 12)
        
        // Paged Slides
        TabView(selection: $currentStep) {
          ForEach(0..<slides.count, id: \.self) { index in
            let slide = slides[index]
            VStack(spacing: 16) {
              ZStack {
                Circle()
                  .fill(Color.surface2)
                  .frame(width: 110, height: 110)
                Text(slide.emoji)
                  .font(.system(size: 52))
              }
              .padding(.bottom, 12)
              
              PXBadge(text: slide.badge, style: .brand)
              
              VStack(spacing: 4) {
                Text(slide.title)
                  .font(.titleXL)
                  .multilineTextAlignment(.center)
                Text(slide.highlight)
                  .font(.titleXL)
                  .foregroundColor(Color.brandViolet)
              }
              
              Text(slide.description)
                .font(.bodyMD)
                .foregroundColor(Color.labelSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
                .padding(.top, 4)
            }
            .tag(index)
            .padding(.horizontal, 16)
          }
        }
        .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
        
        // Footer & Dots
        VStack(spacing: 24) {
          HStack(spacing: 6) {
            ForEach(0..<slides.count, id: \.self) { index in
              Capsule()
                .fill(index == currentStep ? Color.brandViolet : Color.surface3)
                .frame(width: index == currentStep ? 24 : 8, height: 8)
                .animation(.easeInOut, value: currentStep)
            }
          }
          
          PXButton(
            title: currentStep == slides.count - 1 ? "Get Started ⚡" : "Continue →",
            variant: .gradient,
            size: .lg
          ) {
            if currentStep < slides.count - 1 {
              withAnimation { currentStep += 1 }
            } else {
              showAuth = true
            }
          }
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 32)
      }
      .navigationDestination(isPresented: $showAuth) {
        AuthView()
      }
    }
  }
}
