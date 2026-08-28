import SwiftUI

struct UpgradeView: View {
  @Environment(\.dismiss) var dismiss
  @EnvironmentObject var auth: AuthManager
  @State private var isLoading = false
  @State private var selectedPlan = "yearly"
  
  let features = [
    ("Unlimited AI Copilot & working memory", "sparkles"),
    ("Resume Intelligence — 64+ technical skills", "doc.text"),
    ("Project Foundry — 6-phase guided portfolio", "hammer"),
    ("LeetCode + HackerRank cross-platform tracking", "code"),
    ("GitHub Intelligence — repo health & streaks", "arrow.triangle.branch"),
    ("AI-Matched internship & SDE openings", "briefcase"),
    ("Placement readiness score breakdown", "chart.bar"),
  ]
  
  var body: some View {
    ScrollView {
      VStack(spacing: 0) {
        // Hero
        ZStack {
          LinearGradient.brand
          VStack(spacing: 16) {
            ZStack {
              Circle()
                .fill(.white.opacity(0.2))
                .frame(width: 80, height: 80)
              Text("⚡").font(.system(size: 40))
            }
            Text("PrioryxAI Pro ✦")
              .font(.titleLG)
              .foregroundColor(.white)
            Text("Everything a serious engineering student needs.")
              .font(.bodyMD)
              .foregroundColor(.white.opacity(0.85))
              .multilineTextAlignment(.center)
          }
          .padding(.top, 60)
          .padding(.bottom, 40)
        }
        
        // Plans
        VStack(spacing: 12) {
          Button(action: { selectedPlan = "yearly" }) {
            HStack {
              VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                  Text("Annual Pro")
                    .font(.titleSM)
                    .fontWeight(.bold)
                  PXBadge(text: "SAVE 40%", style: .primary)
                }
                Text("Billed annually (₹499/year)")
                  .font(.captionSM)
                  .foregroundColor(Color.labelSecondary)
              }
              Spacer()
              Text("₹41/mo")
                .font(.titleMD)
                .fontWeight(.bold)
                .foregroundColor(Color.brandViolet)
            }
            .padding(16)
            .background(Color.surface1)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .overlay(
              RoundedRectangle(cornerRadius: 18)
                .stroke(selectedPlan == "yearly" ? Color.brandViolet : Color.separator, lineWidth: selectedPlan == "yearly" ? 2 : 1)
            )
          }
          
          Button(action: { selectedPlan = "monthly" }) {
            HStack {
              VStack(alignment: .leading, spacing: 2) {
                Text("Monthly Pro")
                  .font(.titleSM)
                  .fontWeight(.bold)
                Text("Cancel anytime")
                  .font(.captionSM)
                  .foregroundColor(Color.labelSecondary)
              }
              Spacer()
              Text("₹59/mo")
                .font(.titleMD)
                .fontWeight(.bold)
                .foregroundColor(Color.labelPrimary)
            }
            .padding(16)
            .background(Color.surface1)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .overlay(
              RoundedRectangle(cornerRadius: 18)
                .stroke(selectedPlan == "monthly" ? Color.brandViolet : Color.separator, lineWidth: selectedPlan == "monthly" ? 2 : 1)
            )
          }
        }
        .padding(20)
        
        // Features list
        VStack(alignment: .leading, spacing: 16) {
          ForEach(features, id: \.0) { feature in
            HStack(spacing: 14) {
              Image(systemName: "checkmark.circle.fill")
                .foregroundColor(Color.brandEmerald)
                .font(.title3)
              Text(feature.0)
                .font(.bodyMD)
                .foregroundColor(Color.labelPrimary)
            }
          }
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 24)
        
        // CTA
        VStack(spacing: 12) {
          PXButton(
            title: selectedPlan == "yearly" ? "Upgrade to Pro — ₹499/year" : "Upgrade to Pro — ₹59/month",
            variant: .gradient,
            size: .lg,
            isLoading: isLoading
          ) {
            handlePurchase()
          }
          
          Text("Secure payment via Razorpay · Cancel anytime")
            .font(.captionSM)
            .foregroundColor(Color.labelTertiary)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 48)
      }
    }
    .ignoresSafeArea(edges: .top)
    .overlay(alignment: .topTrailing) {
      Button { dismiss() } label: {
        Image(systemName: "xmark.circle.fill")
          .foregroundColor(.white.opacity(0.8))
          .font(.title2)
          .padding(20)
      }
    }
  }
  
  // TODO: this simulates a purchase locally — it does not charge anything or
  // call the real backend. The web app uses a Razorpay hosted payment link
  // (see src/app/api/payments/verify/route.ts + src/app/api/webhooks/razorpay);
  // wiring real payments on iOS needs either that same hosted-link flow via
  // SFSafariViewController, or a StoreKit in-app-purchase product, neither of
  // which is implemented yet. Left as local-only so the demo flow still works,
  // but this must not ship to the App Store claiming to sell Pro.
  private func handlePurchase() {
    isLoading = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
      isLoading = false
      var updated = auth.profile ?? Profile(id: UUID().uuidString)
      updated.proStatus = true
      auth.profile = updated
      auth.isPro = true
      UINotificationFeedbackGenerator().notificationOccurred(.success)
      dismiss()
    }
  }
}
