// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "PrioryxAI",
  platforms: [
    .iOS(.v17)
  ],
  products: [
    .library(
      name: "PrioryxAI",
      targets: ["PrioryxAI"]
    )
  ],
  dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
    .package(url: "https://github.com/gonzalezreal/swift-markdown-ui", from: "2.0.0"),
    .package(url: "https://github.com/airbnb/lottie-spm", from: "4.4.0"),
    .package(url: "https://github.com/onevcat/Kingfisher", from: "7.11.0")
  ],
  targets: [
    .target(
      name: "PrioryxAI",
      dependencies: [
        .product(name: "Supabase", package: "supabase-swift"),
        .product(name: "MarkdownUI", package: "swift-markdown-ui"),
        .product(name: "Lottie", package: "lottie-spm"),
        .product(name: "Kingfisher", package: "Kingfisher")
      ],
      path: "PrioryxAI"
    )
  ]
)
