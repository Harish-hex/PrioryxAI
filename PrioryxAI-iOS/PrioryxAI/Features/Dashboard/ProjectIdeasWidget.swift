import SwiftUI

struct ProjectIdeasWidget: View {
  let ideas: [Project]
  
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text("RESUME-GAP PROJECT FOUNDRY")
          .font(.captionSM)
          .fontWeight(.bold)
          .foregroundColor(Color.labelSecondary)
        
        Spacer()
        
        NavigationLink(destination: FoundryView()) {
          Text("View all →")
            .font(.captionSM)
            .fontWeight(.bold)
            .foregroundColor(Color.brandViolet)
        }
      }
      
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 12) {
          ForEach(ideas) { project in
            NavigationLink(destination: ProjectDetailView(project: project)) {
              VStack(alignment: .leading, spacing: 8) {
                PXBadge(text: project.tier.uppercased(), style: .brand)
                
                Text(project.title)
                  .font(.bodyMD)
                  .fontWeight(.semibold)
                  .foregroundColor(Color.labelPrimary)
                  .lineLimit(2)
                
                Text(project.description)
                  .font(.captionSM)
                  .foregroundColor(Color.labelSecondary)
                  .lineLimit(2)
                
                HStack(spacing: 4) {
                  ForEach(project.techStack.prefix(3), id: \.self) { tech in
                    Text(tech)
                      .font(.captionSM)
                      .padding(.horizontal, 6)
                      .padding(.vertical, 2)
                      .background(Color.surface2)
                      .clipShape(RoundedRectangle(cornerRadius: 6))
                      .foregroundColor(Color.labelSecondary)
                  }
                }
                .padding(.top, 4)
              }
              .padding(14)
              .frame(width: 240, alignment: .leading)
              .background(Color.surface1)
              .clipShape(RoundedRectangle(cornerRadius: 18))
              .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.separator, lineWidth: 1))
              .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
            }
          }
        }
      }
    }
  }
}
