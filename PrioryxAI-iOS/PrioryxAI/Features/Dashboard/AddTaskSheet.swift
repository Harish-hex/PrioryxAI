import SwiftUI

struct AddTaskSheet: View {
  @Environment(\.dismiss) var dismiss
  @State private var title = ""
  @State private var description = ""
  @State private var priority: TaskItem.Priority = .high
  @State private var category = "Assignment"
  
  let onAdd: (TaskItem) -> Void
  
  let categories = ["Assignment", "Exam Prep", "Project", "DSA Practice", "College Timetable"]
  
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 18) {
          VStack(alignment: .leading, spacing: 6) {
            Text("Task Title")
              .font(.captionLG)
              .foregroundColor(Color.labelSecondary)
            
            TextField("e.g. Operating Systems lab assignment 3", text: $title)
              .padding()
              .background(Color.surface2)
              .clipShape(RoundedRectangle(cornerRadius: 14))
          }
          
          VStack(alignment: .leading, spacing: 6) {
            Text("Description (Optional)")
              .font(.captionLG)
              .foregroundColor(Color.labelSecondary)
            
            TextField("e.g. Producer-consumer problem in C++", text: $description, axis: .vertical)
              .lineLimit(2...4)
              .padding()
              .background(Color.surface2)
              .clipShape(RoundedRectangle(cornerRadius: 14))
          }
          
          VStack(alignment: .leading, spacing: 6) {
            Text("Priority")
              .font(.captionLG)
              .foregroundColor(Color.labelSecondary)
            
            HStack(spacing: 8) {
              ForEach(TaskItem.Priority.allCases, id: \.self) { p in
                Button(action: { priority = p }) {
                  Text(p.label)
                    .font(.captionLG)
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .frame(height: 38)
                    .background(priority == p ? Color.brandViolet : Color.surface2)
                    .foregroundColor(priority == p ? .white : Color.labelPrimary)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
              }
            }
          }
          
          VStack(alignment: .leading, spacing: 6) {
            Text("Category")
              .font(.captionLG)
              .foregroundColor(Color.labelSecondary)
            
            ScrollView(.horizontal, showsIndicators: false) {
              HStack(spacing: 8) {
                ForEach(categories, id: \.self) { cat in
                  Button(action: { category = cat }) {
                    Text(cat)
                      .font(.captionLG)
                      .fontWeight(.semibold)
                      .padding(.horizontal, 14)
                      .padding(.vertical, 8)
                      .background(category == cat ? Color.brandViolet.opacity(0.1) : Color.surface2)
                      .foregroundColor(category == cat ? Color.brandViolet : Color.labelPrimary)
                      .clipShape(Capsule())
                  }
                }
              }
            }
          }
          
          PXButton(title: "Save Priority Task ⚡", variant: .gradient, size: .lg) {
            guard !title.isEmpty else { return }
            let newTask = TaskItem(
              id: UUID(),
              title: title,
              description: description.isEmpty ? nil : description,
              priority: priority,
              status: .pending,
              category: category,
              source: "manual",
              createdAt: Date()
            )
            onAdd(newTask)
            dismiss()
          }
          .padding(.top, 16)
        }
        .padding(20)
      }
      .navigationTitle("New Priority Task ⚡")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
          Button("Cancel") { dismiss() }
        }
      }
    }
  }
}
