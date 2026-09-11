export interface RoadmapTopic {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  certUrl?: string;
  certLabel?: string;
}

export interface RoadmapSection {
  id: string;
  title: string;
  topics: RoadmapTopic[];
}

export interface RoadmapDefinition {
  id: string;
  label: string;
  tagline: string;
  sections: RoadmapSection[];
  /** The single best "start here" video and certification for this whole skill. */
  heroVideoUrl?: string;
  heroVideoLabel?: string;
  heroCertUrl?: string;
  heroCertLabel?: string;
}

export const ROADMAPS: Record<string, RoadmapDefinition> = {
  "ai-engineer": {
    id: "ai-engineer",
    label: "AI Engineer",
    tagline: "From probability foundations to production LLM agents.",
    heroVideoUrl: "https://www.youtube.com/watch?v=eMlx5fFNoYc",
    heroVideoLabel: "3Blue1Brown: Attention in Transformers, Step by Step",
    heroCertUrl: "https://www.deeplearning.ai/courses/deep-learning-specialization/",
    heroCertLabel: "DeepLearning.AI: Deep Learning Specialization",
    sections: [
      {
        id: "foundations",
        title: "Foundations",
        topics: [
          {
            id: "python-foundations",
            title: "Python for AI",
            description: "NumPy, pandas, and writing clean, vectorized Python.",
            videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/",
            certUrl: "https://www.coursera.org/specializations/python",
            certLabel: "Coursera: Python for Everybody",
          },
          {
            id: "probability-stats",
            title: "Probability & Statistics",
            description: "Distributions, Bayes' theorem, expectation, and variance — the math under every model.",
            videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV",
            certUrl: "https://www.khanacademy.org/math/statistics-probability",
            certLabel: "Khan Academy: Statistics & Probability",
          },
          {
            id: "linear-algebra",
            title: "Linear Algebra",
            description: "Vectors, matrices, eigenvalues — the language of neural networks.",
            videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
            certUrl: "https://www.coursera.org/learn/linear-algebra-machine-learning",
            certLabel: "Coursera: Linear Algebra for ML",
          },
        ],
      },
      {
        id: "ml-core",
        title: "Machine Learning Core",
        topics: [
          {
            id: "classical-ml",
            title: "Classical ML (scikit-learn)",
            description: "Regression, classification, trees, clustering, and evaluation metrics.",
            videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A",
            certUrl: "https://www.coursera.org/specializations/machine-learning-introduction",
            certLabel: "Andrew Ng: Machine Learning Specialization",
          },
          {
            id: "deep-learning",
            title: "Deep Learning (PyTorch)",
            description: "Backprop, CNNs, RNNs, and training loops from scratch, then with PyTorch.",
            videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
            certUrl: "https://www.deeplearning.ai/courses/deep-learning-specialization/",
            certLabel: "DeepLearning.AI: Deep Learning Specialization",
          },
        ],
      },
      {
        id: "llm-agents",
        title: "LLMs & Agents",
        topics: [
          {
            id: "transformers",
            title: "Transformers & Attention",
            description: "Self-attention, tokenization, and how models like GPT are actually built.",
            videoUrl: "https://www.youtube.com/watch?v=eMlx5fFNoYc",
            certUrl: "https://huggingface.co/learn/nlp-course",
            certLabel: "Hugging Face: NLP Course",
          },
          {
            id: "langchain",
            title: "LangChain",
            description: "Chains, tools, memory, and retrieval-augmented generation pipelines.",
            videoUrl: "https://www.freecodecamp.org/news/learn-langchain-and-gen-ai-by-building-6-projects/",
            certUrl: "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/",
            certLabel: "DeepLearning.AI: LangChain for LLM Apps",
          },
          {
            id: "langgraph",
            title: "LangGraph & Agentic Workflows",
            description: "Stateful multi-step agents, tool calling, and graph-based orchestration.",
            videoUrl: "https://www.youtube.com/watch?v=DtW_Lc9hYoU",
            certUrl: "https://academy.langchain.com/",
            certLabel: "LangChain Academy",
          },
          {
            id: "rag-vector-db",
            title: "RAG & Vector Databases",
            description: "Embeddings, chunking strategies, and retrieval quality tuning.",
            videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/",
            certUrl: "https://www.deeplearning.ai/short-courses/building-applications-vector-databases/",
            certLabel: "DeepLearning.AI: Vector Databases",
          },
        ],
      },
      {
        id: "production",
        title: "Production & Deployment",
        topics: [
          {
            id: "llm-eval",
            title: "Evaluation & Guardrails",
            description: "Prompt evals, hallucination checks, and safety guardrails for production agents.",
            certUrl: "https://www.deeplearning.ai/short-courses/evaluating-debugging-generative-ai/",
            certLabel: "DeepLearning.AI: Evaluating & Debugging Generative AI",
          },
          {
            id: "mlops",
            title: "Deployment & MLOps",
            description: "Serving models via FastAPI, containerizing with Docker, and monitoring in production.",
            certUrl: "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops",
            certLabel: "DeepLearning.AI: MLOps Specialization",
          },
        ],
      },
    ],
  },
  frontend: {
    id: "frontend",
    label: "Frontend",
    tagline: "From HTML fundamentals to production React/Next.js apps.",
    heroVideoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
    heroVideoLabel: "freeCodeCamp: React Tutorials Playlist",
    heroCertUrl: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
    heroCertLabel: "Meta Front-End Developer Certificate",
    sections: [
      {
        id: "foundations",
        title: "Foundations",
        topics: [
          {
            id: "html-css",
            title: "HTML & CSS",
            description: "Semantic markup, flexbox, grid, and responsive design.",
            videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88",
            certUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
            certLabel: "freeCodeCamp: Responsive Web Design",
          },
          {
            id: "javascript",
            title: "JavaScript Fundamentals",
            description: "Closures, async/await, the event loop, and modern ES6+ syntax.",
            videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
            certUrl: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
            certLabel: "freeCodeCamp: JavaScript Algorithms",
          },
        ],
      },
      {
        id: "framework",
        title: "Framework & Tooling",
        topics: [
          {
            id: "react",
            title: "React",
            description: "Components, hooks, state management, and the render lifecycle.",
            videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
            certUrl: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
            certLabel: "Meta Front-End Developer Certificate",
          },
          {
            id: "nextjs",
            title: "Next.js",
            description: "App Router, server components, routing, and rendering strategies.",
            videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V",
            certUrl: "https://nextjs.org/learn",
            certLabel: "Next.js Official Learn Course",
          },
          {
            id: "typescript",
            title: "TypeScript",
            description: "Types, generics, and using TypeScript to catch bugs before runtime.",
            videoUrl: "https://www.youtube.com/watch?v=SpwzRDUQ1GI",
            certUrl: "https://www.typescriptlang.org/docs/handbook/intro.html",
            certLabel: "TypeScript Handbook",
          },
        ],
      },
      {
        id: "shipping",
        title: "Testing & Shipping",
        topics: [
          {
            id: "testing",
            title: "Testing",
            description: "Unit, integration, and end-to-end testing with Jest/Playwright.",
            videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/",
          },
          {
            id: "deployment",
            title: "Deployment & CI/CD",
            description: "Deploying to Vercel, environment config, and automated pipelines.",
            videoUrl: "https://www.youtube.com/watch?v=KjY94sAKLlw",
          },
        ],
      },
    ],
  },
  backend: {
    id: "backend",
    label: "Backend",
    tagline: "APIs, databases, and services that hold up in production.",
    heroVideoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
    heroVideoLabel: "freeCodeCamp: Node.js and Express.js — Full Course",
    heroCertUrl: "https://www.coursera.org/professional-certificates/meta-back-end-developer",
    heroCertLabel: "Meta Back-End Developer Certificate",
    sections: [
      {
        id: "foundations",
        title: "Foundations",
        topics: [
          {
            id: "javascript",
            title: "JavaScript Fundamentals",
            description: "Closures, async/await, the event loop, and modern ES6+ syntax.",
            videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
            certUrl: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
            certLabel: "freeCodeCamp: JavaScript Algorithms",
          },
        ],
      },
      {
        id: "core",
        title: "APIs & Databases",
        topics: [
          {
            id: "nodejs-apis",
            title: "Node.js & REST APIs",
            description: "Express/Next API routes, authentication, and REST design.",
            videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
            certUrl: "https://www.coursera.org/professional-certificates/meta-back-end-developer",
            certLabel: "Meta Back-End Developer Certificate",
          },
          {
            id: "databases",
            title: "Databases (SQL & Postgres)",
            description: "Schema design, joins, indexing, and query performance.",
            videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
            certUrl: "https://www.freecodecamp.org/learn/relational-database/",
            certLabel: "freeCodeCamp: Relational Databases",
          },
        ],
      },
      {
        id: "shipping",
        title: "Testing & Shipping",
        topics: [
          {
            id: "testing",
            title: "Testing",
            description: "Unit and integration testing for backend services.",
            videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/",
          },
          {
            id: "deployment",
            title: "Deployment & CI/CD",
            description: "Containerizing, environment config, and automated pipelines.",
            videoUrl: "https://www.youtube.com/watch?v=KjY94sAKLlw",
          },
        ],
      },
    ],
  },
  python: {
    id: "python",
    label: "Python",
    tagline: "Core language fundamentals through practical data & scripting projects.",
    heroVideoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/",
    heroVideoLabel: "freeCodeCamp: Python Data Science — Full Course",
    heroCertUrl: "https://www.coursera.org/specializations/python",
    heroCertLabel: "Coursera: Python for Everybody",
    sections: [
      {
        id: "foundations",
        title: "Foundations",
        topics: [
          {
            id: "python-syntax",
            title: "Python Syntax & Data Structures",
            description: "Variables, control flow, functions, lists, dicts, and comprehensions.",
            videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/",
            certUrl: "https://www.coursera.org/specializations/python",
            certLabel: "Coursera: Python for Everybody",
          },
        ],
      },
      {
        id: "practical",
        title: "Practical Python",
        topics: [
          {
            id: "numpy-pandas",
            title: "NumPy & Pandas",
            description: "Vectorized array operations and dataframe manipulation for real datasets.",
            videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/",
            certUrl: "https://www.freecodecamp.org/learn/data-analysis-with-python/",
            certLabel: "freeCodeCamp: Data Analysis with Python",
          },
        ],
      },
    ],
  },
  sql: {
    id: "sql",
    label: "SQL",
    tagline: "Query, join, and design relational data confidently.",
    heroVideoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
    heroVideoLabel: "freeCodeCamp: Learn PostgreSQL — Full Course",
    heroCertUrl: "https://www.freecodecamp.org/learn/relational-database/",
    heroCertLabel: "freeCodeCamp: Relational Databases",
    sections: [
      {
        id: "foundations",
        title: "Foundations",
        topics: [
          {
            id: "sql-basics",
            title: "SQL Basics",
            description: "SELECT, WHERE, JOIN, GROUP BY — the queries you'll write every day.",
            videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
            certUrl: "https://www.freecodecamp.org/learn/relational-database/",
            certLabel: "freeCodeCamp: Relational Databases",
          },
        ],
      },
      {
        id: "advanced",
        title: "Schema & Performance",
        topics: [
          {
            id: "schema-indexing",
            title: "Schema Design & Indexing",
            description: "Normalization, indexes, and query performance tuning.",
            certUrl: "https://www.freecodecamp.org/learn/relational-database/",
            certLabel: "freeCodeCamp: Relational Databases",
          },
        ],
      },
    ],
  },
  "full-stack": {
    id: "full-stack",
    label: "Full Stack",
    tagline: "Frontend, backend, and deployment — end to end.",
    heroVideoUrl: "https://www.youtube.com/watch?v=KjY94sAKLlw",
    heroVideoLabel: "freeCodeCamp: Next.js — Build & Deploy a Full Stack App",
    heroCertUrl: "https://www.coursera.org/specializations/meta-full-stack-developer",
    heroCertLabel: "Meta Full-Stack Developer Specialization",
    sections: [
      {
        id: "frontend",
        title: "Frontend",
        topics: [
          {
            id: "react-fs",
            title: "React",
            description: "Components, hooks, state management, and the render lifecycle.",
            videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
            certUrl: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
            certLabel: "Meta Front-End Developer Certificate",
          },
          {
            id: "nextjs-fs",
            title: "Next.js",
            description: "App Router, server components, routing, and rendering strategies.",
            videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V",
            certUrl: "https://nextjs.org/learn",
            certLabel: "Next.js Official Learn Course",
          },
        ],
      },
      {
        id: "backend",
        title: "Backend",
        topics: [
          {
            id: "nodejs-apis-fs",
            title: "Node.js & REST APIs",
            description: "Express/Next API routes, authentication, and REST design.",
            videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
            certUrl: "https://www.coursera.org/professional-certificates/meta-back-end-developer",
            certLabel: "Meta Back-End Developer Certificate",
          },
          {
            id: "databases-fs",
            title: "Databases (SQL & Postgres)",
            description: "Schema design, joins, indexing, and query performance.",
            videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
            certUrl: "https://www.freecodecamp.org/learn/relational-database/",
            certLabel: "freeCodeCamp: Relational Databases",
          },
        ],
      },
      {
        id: "shipping",
        title: "Shipping & Production",
        topics: [
          {
            id: "deployment-fs",
            title: "Deployment & CI/CD",
            description: "Deploying to Vercel, environment config, and automated pipelines.",
            videoUrl: "https://www.youtube.com/watch?v=KjY94sAKLlw",
          },
        ],
      },
    ],
  },
  javascript: {
    id: "javascript",
    label: "JavaScript",
    tagline: "Closures, the event loop, and modern ES6+ syntax.",
    heroVideoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
    heroVideoLabel: "freeCodeCamp: JavaScript Full Course for Beginners",
    heroCertUrl: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
    heroCertLabel: "freeCodeCamp: JavaScript Algorithms & Data Structures",
    sections: [
      {
        id: "fundamentals",
        title: "Fundamentals",
        topics: [
          {
            id: "js-syntax",
            title: "Syntax & Control Flow",
            description: "Variables, loops, conditionals, functions, and scope.",
            videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
            certUrl: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
            certLabel: "freeCodeCamp: JavaScript Algorithms",
          },
          {
            id: "js-async",
            title: "Async JS & the Event Loop",
            description: "Callbacks, Promises, async/await, and how the event loop actually schedules work.",
            videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
          },
        ],
      },
      {
        id: "modern",
        title: "Modern JavaScript",
        topics: [
          {
            id: "js-es6",
            title: "ES6+ Features",
            description: "Destructuring, spread/rest, modules, arrow functions, and classes.",
            videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
          },
        ],
      },
    ],
  },
  typescript: {
    id: "typescript",
    label: "TypeScript",
    tagline: "Types, generics, and catching bugs before runtime.",
    heroVideoUrl: "https://www.youtube.com/watch?v=SpwzRDUQ1GI",
    heroVideoLabel: "freeCodeCamp: Learn TypeScript — Full Course for Beginners",
    heroCertUrl: "https://www.typescriptlang.org/docs/handbook/intro.html",
    heroCertLabel: "TypeScript Handbook",
    sections: [
      {
        id: "fundamentals",
        title: "Fundamentals",
        topics: [
          {
            id: "ts-basics",
            title: "Basic Types & Interfaces",
            description: "Type annotations, interfaces, unions, and structural typing.",
            videoUrl: "https://www.youtube.com/watch?v=SpwzRDUQ1GI",
            certUrl: "https://www.typescriptlang.org/docs/handbook/intro.html",
            certLabel: "TypeScript Handbook",
          },
        ],
      },
      {
        id: "advanced",
        title: "Advanced Types",
        topics: [
          {
            id: "ts-generics",
            title: "Generics & Utility Types",
            description: "Writing reusable, type-safe functions and components.",
            videoUrl: "https://www.youtube.com/watch?v=SpwzRDUQ1GI",
            certUrl: "https://www.typescriptlang.org/docs/handbook/2/generics.html",
            certLabel: "TypeScript Handbook: Generics",
          },
        ],
      },
    ],
  },
  react: {
    id: "react",
    label: "React",
    tagline: "Components, hooks, and the ecosystem around them.",
    heroVideoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
    heroVideoLabel: "freeCodeCamp: React Tutorials Playlist",
    heroCertUrl: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
    heroCertLabel: "Meta Front-End Developer Certificate",
    sections: [
      {
        id: "fundamentals",
        title: "Fundamentals",
        topics: [
          {
            id: "react-basics",
            title: "Components & JSX",
            description: "Props, composition, and rendering fundamentals.",
            videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
            certUrl: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
            certLabel: "Meta Front-End Developer Certificate",
          },
          {
            id: "react-hooks",
            title: "Hooks & State",
            description: "useState, useEffect, and managing component lifecycle.",
            videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
          },
        ],
      },
      {
        id: "ecosystem",
        title: "Ecosystem",
        topics: [
          {
            id: "react-nextjs",
            title: "Next.js (React Framework)",
            description: "Server components, routing, and production rendering strategies.",
            videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V",
            certUrl: "https://nextjs.org/learn",
            certLabel: "Next.js Official Learn Course",
          },
        ],
      },
    ],
  },
  nodejs: {
    id: "nodejs",
    label: "Node.js",
    tagline: "Server-side JavaScript, APIs, and the npm ecosystem.",
    heroVideoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
    heroVideoLabel: "freeCodeCamp: Node.js and Express.js — Full Course",
    heroCertUrl: "https://www.coursera.org/professional-certificates/meta-back-end-developer",
    heroCertLabel: "Meta Back-End Developer Certificate",
    sections: [
      {
        id: "fundamentals",
        title: "Fundamentals",
        topics: [
          {
            id: "node-runtime",
            title: "Node Runtime & Modules",
            description: "The event loop, CommonJS/ESM modules, and core built-in modules.",
            videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
          },
          {
            id: "node-express",
            title: "Express & REST APIs",
            description: "Routing, middleware, authentication, and REST API design.",
            videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
            certUrl: "https://www.coursera.org/professional-certificates/meta-back-end-developer",
            certLabel: "Meta Back-End Developer Certificate",
          },
        ],
      },
      {
        id: "data",
        title: "Data Layer",
        topics: [
          {
            id: "node-databases",
            title: "Databases (SQL & Postgres)",
            description: "Connecting Node services to relational databases.",
            videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
            certUrl: "https://www.freecodecamp.org/learn/relational-database/",
            certLabel: "freeCodeCamp: Relational Databases",
          },
        ],
      },
    ],
  },
  devops: {
    id: "devops",
    label: "DevOps",
    tagline: "Linux, containers, CI/CD, and cloud infrastructure.",
    heroVideoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
    heroVideoLabel: "freeCodeCamp: DevOps Courses Playlist",
    heroCertUrl: "https://www.coursera.org/professional-certificates/sre-devops-engineer-google-cloud",
    heroCertLabel: "Google Cloud: DevOps Engineer Professional Certificate",
    sections: [
      {
        id: "foundations",
        title: "Foundations",
        topics: [
          {
            id: "devops-prereqs",
            title: "Linux, Networking & Prerequisites",
            description: "The command line, networking basics, and system fundamentals DevOps builds on.",
            videoUrl: "https://www.freecodecamp.org/news/devops-prerequisites-course/",
          },
          {
            id: "devops-git",
            title: "Git & Version Control",
            description: "Branching, merging, and collaborative workflows.",
            videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
          },
        ],
      },
      {
        id: "cicd-cloud",
        title: "CI/CD & Cloud",
        topics: [
          {
            id: "devops-cicd",
            title: "CI/CD Pipelines",
            description: "Automated build, test, and deploy pipelines.",
            videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
            certUrl: "https://www.coursera.org/professional-certificates/sre-devops-engineer-google-cloud",
            certLabel: "Google Cloud: DevOps Engineer Professional Certificate",
          },
        ],
      },
    ],
  },
  "machine-learning": {
    id: "machine-learning",
    label: "Machine Learning",
    tagline: "Classical ML through deep learning fundamentals.",
    heroVideoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
    heroVideoLabel: "freeCodeCamp: PyTorch for Deep Learning — Full Course",
    heroCertUrl: "https://www.coursera.org/specializations/machine-learning-introduction",
    heroCertLabel: "Andrew Ng: Machine Learning Specialization",
    sections: [
      {
        id: "foundations",
        title: "Foundations",
        topics: [
          {
            id: "ml-python",
            title: "Python for ML",
            description: "NumPy, pandas, and writing clean, vectorized Python.",
            videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/",
            certUrl: "https://www.coursera.org/specializations/python",
            certLabel: "Coursera: Python for Everybody",
          },
        ],
      },
      {
        id: "core",
        title: "Core Machine Learning",
        topics: [
          {
            id: "ml-classical",
            title: "Classical ML (scikit-learn)",
            description: "Regression, classification, trees, clustering, and evaluation metrics.",
            videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A",
            certUrl: "https://www.coursera.org/specializations/machine-learning-introduction",
            certLabel: "Andrew Ng: Machine Learning Specialization",
          },
          {
            id: "ml-deep",
            title: "Deep Learning (PyTorch)",
            description: "Backprop, CNNs, RNNs, and training loops from scratch, then with PyTorch.",
            videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
            certUrl: "https://www.deeplearning.ai/courses/deep-learning-specialization/",
            certLabel: "DeepLearning.AI: Deep Learning Specialization",
          },
        ],
      },
    ],
  },
  "datastructures-and-algorithms": {
    id: "datastructures-and-algorithms",
    label: "Data Structures & Algorithms",
    tagline: "The patterns behind every coding interview and efficient system.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-data-structures-and-algorithms/",
    heroVideoLabel: "freeCodeCamp: Data Structures & Algorithms — Learning Path",
    heroCertUrl: "https://www.coursera.org/specializations/data-structures-algorithms",
    heroCertLabel: "UC San Diego: Data Structures and Algorithms Specialization",
    sections: [
      {
        id: "core",
        title: "Core Structures",
        topics: [
          {
            id: "dsa-linear",
            title: "Arrays, Lists, Stacks & Queues",
            description: "The building blocks every other structure is built from.",
            videoUrl: "https://www.freecodecamp.org/news/learn-data-structures-and-algorithms/",
            certUrl: "https://www.coursera.org/learn/data-structures",
            certLabel: "Coursera: Data Structures (UC San Diego)",
          },
          {
            id: "dsa-trees-graphs",
            title: "Trees & Graphs",
            description: "Traversals, binary search trees, and graph search algorithms.",
            videoUrl: "https://www.freecodecamp.org/news/learn-data-structures-and-algorithms-visually/",
          },
        ],
      },
      {
        id: "technique",
        title: "Algorithmic Technique",
        topics: [
          {
            id: "dsa-sorting-searching",
            title: "Sorting & Searching",
            description: "Comparison sorts, binary search, and complexity trade-offs.",
            certUrl: "https://www.coursera.org/learn/algorithmic-toolbox",
            certLabel: "Coursera: Algorithmic Toolbox",
          },
          {
            id: "dsa-dp",
            title: "Dynamic Programming & Recursion",
            description: "Breaking problems into overlapping subproblems.",
            certUrl: "https://www.coursera.org/specializations/data-structures-algorithms",
            certLabel: "UC San Diego: Data Structures and Algorithms Specialization",
          },
        ],
      },
    ],
  },
  "system-design": {
    id: "system-design",
    label: "System Design",
    tagline: "Designing systems that scale — from a single server to distributed architecture.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-software-system-design/",
    heroVideoLabel: "freeCodeCamp: Learn Software System Design",
    sections: [
      {
        id: "fundamentals",
        title: "Fundamentals",
        topics: [
          {
            id: "sd-basics",
            title: "Scaling Basics",
            description: "Load balancing, caching, and horizontal vs vertical scaling.",
            videoUrl: "https://www.freecodecamp.org/news/software-system-design-for-beginners/",
          },
          {
            id: "sd-databases",
            title: "Database Scaling",
            description: "Replication, sharding, and choosing SQL vs NoSQL.",
            videoUrl: "https://www.freecodecamp.org/news/learn-software-system-design/",
          },
        ],
      },
      {
        id: "applied",
        title: "Applied Design",
        topics: [
          {
            id: "sd-case-study",
            title: "High-Level Design Case Study",
            description: "Designing a real system end-to-end (e.g. a video platform) to tie concepts together.",
            videoUrl: "https://www.freecodecamp.org/news/learn-high-level-system-design-by-building-a-youtube-clone/",
          },
          {
            id: "sd-microservices",
            title: "Microservices",
            description: "Service boundaries, communication patterns, and distributed system trade-offs.",
            videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/",
          },
        ],
      },
    ],
  },
  "git-github": {
    id: "git-github",
    label: "Git and GitHub",
    tagline: "Version control and collaborative workflows.",
    heroVideoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
    heroVideoLabel: "freeCodeCamp: Learn Git — Full Course for Beginners",
    sections: [
      {
        id: "basics",
        title: "Basics",
        topics: [
          {
            id: "git-core",
            title: "Core Git Commands",
            description: "add, commit, status, log, branching, and merging.",
            videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
          },
        ],
      },
      {
        id: "collaboration",
        title: "Collaboration",
        topics: [
          {
            id: "git-collab",
            title: "Pull Requests & GitHub Workflows",
            description: "Forking, pull requests, code review, and resolving merge conflicts.",
            videoUrl: "https://www.freecodecamp.org/news/git-and-github-crash-course-for-beginners/",
          },
        ],
      },
    ],
  },
};

export type RoadmapCategory = "role" | "skill" | "beginner" | "practice";

export interface RoadmapCatalogEntry {
  id: string;
  label: string;
  category: RoadmapCategory;
  roadmapShUrl: string;
}

// The full roadmap.sh catalog. Entries whose `id` matches a key in ROADMAPS
// render the in-app visual tree; every other entry opens the equivalent
// roadmap.sh page in a new tab so nothing in this list is ever a dead link.
export const CATALOG: RoadmapCatalogEntry[] = [
  // Role-based
  { id: "frontend", label: "Frontend", category: "role", roadmapShUrl: "https://roadmap.sh/frontend" },
  { id: "backend", label: "Backend", category: "role", roadmapShUrl: "https://roadmap.sh/backend" },
  { id: "full-stack", label: "Full Stack", category: "role", roadmapShUrl: "https://roadmap.sh/full-stack" },
  { id: "android", label: "Android", category: "role", roadmapShUrl: "https://roadmap.sh/android" },
  { id: "devops", label: "DevOps", category: "role", roadmapShUrl: "https://roadmap.sh/devops" },
  { id: "devsecops", label: "DevSecOps", category: "role", roadmapShUrl: "https://roadmap.sh/devsecops" },
  { id: "data-analyst", label: "Data Analyst", category: "role", roadmapShUrl: "https://roadmap.sh/data-analyst" },
  { id: "ai-engineer", label: "AI Engineer", category: "role", roadmapShUrl: "https://roadmap.sh/ai-engineer" },
  { id: "ai-data-scientist", label: "AI and Data Scientist", category: "role", roadmapShUrl: "https://roadmap.sh/ai-data-scientist" },
  { id: "data-engineer", label: "Data Engineer", category: "role", roadmapShUrl: "https://roadmap.sh/data-engineer" },
  { id: "machine-learning", label: "Machine Learning", category: "role", roadmapShUrl: "https://roadmap.sh/machine-learning" },
  { id: "postgresql-dba", label: "PostgreSQL", category: "role", roadmapShUrl: "https://roadmap.sh/postgresql-dba" },
  { id: "ios", label: "iOS", category: "role", roadmapShUrl: "https://roadmap.sh/ios" },
  { id: "blockchain", label: "Blockchain", category: "role", roadmapShUrl: "https://roadmap.sh/blockchain" },
  { id: "qa", label: "QA", category: "role", roadmapShUrl: "https://roadmap.sh/qa" },
  { id: "software-architect", label: "Software Architect", category: "role", roadmapShUrl: "https://roadmap.sh/software-architect" },
  { id: "api-design", label: "API Design", category: "role", roadmapShUrl: "https://roadmap.sh/api-design" },
  { id: "cyber-security", label: "Cyber Security", category: "role", roadmapShUrl: "https://roadmap.sh/cyber-security" },
  { id: "ux-design", label: "UX Design", category: "role", roadmapShUrl: "https://roadmap.sh/ux-design" },
  { id: "technical-writer", label: "Technical Writer", category: "role", roadmapShUrl: "https://roadmap.sh/technical-writer" },
  { id: "game-developer", label: "Game Developer", category: "role", roadmapShUrl: "https://roadmap.sh/game-developer" },
  { id: "server-side-game-developer", label: "Server Side Game Developer", category: "role", roadmapShUrl: "https://roadmap.sh/server-side-game-developer" },
  { id: "mlops", label: "MLOps", category: "role", roadmapShUrl: "https://roadmap.sh/mlops" },
  { id: "product-manager", label: "Product Manager", category: "role", roadmapShUrl: "https://roadmap.sh/product-manager" },
  { id: "engineering-manager", label: "Engineering Manager", category: "role", roadmapShUrl: "https://roadmap.sh/engineering-manager" },
  { id: "devrel", label: "Developer Relations", category: "role", roadmapShUrl: "https://roadmap.sh/devrel" },
  { id: "bi-analyst", label: "BI Analyst", category: "role", roadmapShUrl: "https://roadmap.sh/bi-analyst" },
  { id: "ai-red-teaming", label: "AI Red Teaming", category: "role", roadmapShUrl: "https://roadmap.sh/ai-red-teaming" },
  { id: "network-engineer", label: "Network Engineer", category: "role", roadmapShUrl: "https://roadmap.sh/network-engineer" },
  { id: "forward-deployed-engineer", label: "Forward Deployed Engineer", category: "role", roadmapShUrl: "https://roadmap.sh/forward-deployed-engineer" },

  // Skill-based
  { id: "claude-code", label: "Claude Code", category: "skill", roadmapShUrl: "https://roadmap.sh/claude-code" },
  { id: "python-data-analysis", label: "Python for Data Analysis", category: "skill", roadmapShUrl: "https://roadmap.sh/python-data-analysis" },
  { id: "r-programming", label: "R Programming", category: "skill", roadmapShUrl: "https://roadmap.sh/r-programming" },
  { id: "vibe-coding", label: "Vibe Coding", category: "skill", roadmapShUrl: "https://roadmap.sh/vibe-coding" },
  { id: "power-bi", label: "Power BI", category: "skill", roadmapShUrl: "https://roadmap.sh/power-bi" },
  { id: "leetcode", label: "LeetCode", category: "skill", roadmapShUrl: "https://roadmap.sh/roadmaps" },
  { id: "python", label: "Python", category: "skill", roadmapShUrl: "https://roadmap.sh/python" },
  { id: "computer-science", label: "Computer Science", category: "skill", roadmapShUrl: "https://roadmap.sh/computer-science" },
  { id: "sql", label: "SQL", category: "skill", roadmapShUrl: "https://roadmap.sh/sql" },
  { id: "openclaw", label: "OpenClaw", category: "skill", roadmapShUrl: "https://roadmap.sh/roadmaps" },
  { id: "react", label: "React", category: "skill", roadmapShUrl: "https://roadmap.sh/react" },
  { id: "vue", label: "Vue", category: "skill", roadmapShUrl: "https://roadmap.sh/vue" },
  { id: "angular", label: "Angular", category: "skill", roadmapShUrl: "https://roadmap.sh/angular" },
  { id: "javascript", label: "JavaScript", category: "skill", roadmapShUrl: "https://roadmap.sh/javascript" },
  { id: "typescript", label: "TypeScript", category: "skill", roadmapShUrl: "https://roadmap.sh/typescript" },
  { id: "nodejs", label: "Node.js", category: "skill", roadmapShUrl: "https://roadmap.sh/nodejs" },
  { id: "system-design", label: "System Design", category: "skill", roadmapShUrl: "https://roadmap.sh/system-design" },
  { id: "java", label: "Java", category: "skill", roadmapShUrl: "https://roadmap.sh/java" },
  { id: "aspnet-core", label: "ASP.NET Core", category: "skill", roadmapShUrl: "https://roadmap.sh/aspnet-core" },
  { id: "spring-boot", label: "Spring Boot", category: "skill", roadmapShUrl: "https://roadmap.sh/spring-boot" },
  { id: "flutter", label: "Flutter", category: "skill", roadmapShUrl: "https://roadmap.sh/flutter" },
  { id: "c-programming", label: "C Programming", category: "skill", roadmapShUrl: "https://roadmap.sh/c" },
  { id: "cpp", label: "C++", category: "skill", roadmapShUrl: "https://roadmap.sh/cpp" },
  { id: "rust", label: "Rust", category: "skill", roadmapShUrl: "https://roadmap.sh/rust" },
  { id: "golang", label: "Go", category: "skill", roadmapShUrl: "https://roadmap.sh/golang" },
  { id: "ai-product-builders", label: "AI Product Builders", category: "skill", roadmapShUrl: "https://roadmap.sh/roadmaps" },
  { id: "software-design-architecture", label: "Design Architecture", category: "skill", roadmapShUrl: "https://roadmap.sh/software-design-architecture" },
  { id: "react-native", label: "React Native", category: "skill", roadmapShUrl: "https://roadmap.sh/react-native" },
  { id: "design-system", label: "Design System", category: "skill", roadmapShUrl: "https://roadmap.sh/design-system" },
  { id: "prompt-engineering", label: "Prompt Engineering", category: "skill", roadmapShUrl: "https://roadmap.sh/prompt-engineering" },
  { id: "mongodb", label: "MongoDB", category: "skill", roadmapShUrl: "https://roadmap.sh/mongodb" },
  { id: "linux", label: "Linux", category: "skill", roadmapShUrl: "https://roadmap.sh/linux" },
  { id: "kubernetes", label: "Kubernetes", category: "skill", roadmapShUrl: "https://roadmap.sh/kubernetes" },
  { id: "docker", label: "Docker", category: "skill", roadmapShUrl: "https://roadmap.sh/docker" },
  { id: "aws", label: "AWS", category: "skill", roadmapShUrl: "https://roadmap.sh/aws" },
  { id: "terraform", label: "Terraform", category: "skill", roadmapShUrl: "https://roadmap.sh/terraform" },
  { id: "datastructures-and-algorithms", label: "Data Structures & Algorithms", category: "skill", roadmapShUrl: "https://roadmap.sh/datastructures-and-algorithms" },
  { id: "redis", label: "Redis", category: "skill", roadmapShUrl: "https://roadmap.sh/redis" },
  { id: "git-github", label: "Git and GitHub", category: "skill", roadmapShUrl: "https://roadmap.sh/git-github" },
  { id: "php", label: "PHP", category: "skill", roadmapShUrl: "https://roadmap.sh/php" },
  { id: "cloudflare", label: "Cloudflare", category: "skill", roadmapShUrl: "https://roadmap.sh/cloudflare" },
  { id: "ai-agents", label: "AI Agents", category: "skill", roadmapShUrl: "https://roadmap.sh/ai-agents" },
  { id: "nextjs", label: "Next.js", category: "skill", roadmapShUrl: "https://roadmap.sh/nextjs" },
  { id: "kotlin", label: "Kotlin", category: "skill", roadmapShUrl: "https://roadmap.sh/kotlin" },
  { id: "html", label: "HTML", category: "skill", roadmapShUrl: "https://roadmap.sh/html" },
  { id: "css", label: "CSS", category: "skill", roadmapShUrl: "https://roadmap.sh/css" },
  { id: "swift-ui", label: "Swift & Swift UI", category: "skill", roadmapShUrl: "https://roadmap.sh/swift-ui" },
  { id: "shell-bash", label: "Shell / Bash", category: "skill", roadmapShUrl: "https://roadmap.sh/shell-bash" },
  { id: "laravel", label: "Laravel", category: "skill", roadmapShUrl: "https://roadmap.sh/laravel" },
  { id: "elasticsearch", label: "Elasticsearch", category: "skill", roadmapShUrl: "https://roadmap.sh/elasticsearch" },
  { id: "wordpress", label: "WordPress", category: "skill", roadmapShUrl: "https://roadmap.sh/wordpress" },
  { id: "django", label: "Django", category: "skill", roadmapShUrl: "https://roadmap.sh/django" },
  { id: "ruby", label: "Ruby", category: "skill", roadmapShUrl: "https://roadmap.sh/ruby" },
  { id: "ruby-on-rails", label: "Ruby on Rails", category: "skill", roadmapShUrl: "https://roadmap.sh/ruby-on-rails" },
  { id: "scala", label: "Scala", category: "skill", roadmapShUrl: "https://roadmap.sh/scala" },

  // Beginner
  { id: "frontend-beginner", label: "Frontend Beginner", category: "beginner", roadmapShUrl: "https://roadmap.sh/frontend-beginner" },
  { id: "backend-beginner", label: "Backend Beginner", category: "beginner", roadmapShUrl: "https://roadmap.sh/backend-beginner" },
  { id: "devops-beginner", label: "DevOps Beginner", category: "beginner", roadmapShUrl: "https://roadmap.sh/devops-beginner" },
  { id: "git-github-beginner", label: "Git and GitHub Beginner", category: "beginner", roadmapShUrl: "https://roadmap.sh/git-github-beginner" },

  // Best practices
  { id: "aws-best-practices", label: "AWS Best Practices", category: "practice", roadmapShUrl: "https://roadmap.sh/aws-best-practices" },
  { id: "api-security-best-practices", label: "API Security", category: "practice", roadmapShUrl: "https://roadmap.sh/api-security-best-practices" },
  { id: "backend-performance-best-practices", label: "Backend Performance", category: "practice", roadmapShUrl: "https://roadmap.sh/backend-performance-best-practices" },
  { id: "frontend-performance-best-practices", label: "Frontend Performance", category: "practice", roadmapShUrl: "https://roadmap.sh/frontend-performance-best-practices" },
  { id: "code-review-best-practices", label: "Code Review", category: "practice", roadmapShUrl: "https://roadmap.sh/code-review-best-practices" },
];

export function isCurated(id: string): boolean {
  return id in ROADMAPS;
}

export function getRoadmap(streamId: string): RoadmapDefinition | null {
  return ROADMAPS[streamId] ?? null;
}

export function listRoadmaps(): RoadmapDefinition[] {
  return Object.values(ROADMAPS);
}

export function totalTopicCount(roadmap: RoadmapDefinition): number {
  return roadmap.sections.reduce((sum, s) => sum + s.topics.length, 0);
}
