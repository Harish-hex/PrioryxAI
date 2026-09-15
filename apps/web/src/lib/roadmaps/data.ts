export interface RoadmapTopic {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  certUrl?: string;
  certLabel?: string;
  /**
   * Third-level items from the source roadmap.sh diagram. A plain string is an
   * exact-wording placeholder with no verified link yet ("coming soon" in the
   * UI); a full RoadmapTopic is used once that specific item has been linked.
   */
  subtopics?: Array<RoadmapTopic | string>;
}

export interface RoadmapSection {
  id: string;
  title: string;
  topics: RoadmapTopic[];
  /** The section IS the PDF's "main topic" node — video + cert live here, never on its sub-items. */
  videoUrl?: string;
  certUrl?: string;
  certLabel?: string;
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
    tagline: "The exact roadmap.sh AI Engineer path — introduction through multimodal AI.",
    heroVideoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/",
    heroVideoLabel: "freeCodeCamp: AI Engineering Roadmap — Essential Skills",
    heroCertUrl: "https://www.deeplearning.ai/courses/ai-for-everyone/",
    heroCertLabel: "DeepLearning.AI: AI For Everyone",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/",
        certUrl: "https://www.deeplearning.ai/courses/ai-for-everyone/",
        certLabel: "DeepLearning.AI: AI For Everyone",
        topics: [
          { id: "what-is-ai-engineer", title: "What is an AI Engineer?", description: "Role definition and scope.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "ai-engineer-vs-ml-engineer", title: "AI Engineer vs ML Engineer", description: "How the two roles differ in practice.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "llms-intro", title: "LLMs", description: "What large language models are and how they're used.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "inference", title: "Inference", description: "Running a trained model to get predictions.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "training", title: "Training", description: "How models learn from data.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "embeddings-intro", title: "Embeddings", description: "Vector representations of meaning.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "vector-databases-intro", title: "Vector Databases", description: "Storing and searching embeddings at scale.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "rag-intro", title: "RAG", description: "Retrieval-augmented generation, in brief.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "prompt-engineering-intro", title: "Prompt Engineering", description: "Shaping model output through input design.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "ai-agents-intro", title: "AI Agents", description: "Systems that plan and act using tools.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "ai-vs-agi", title: "AI vs AGI", description: "Narrow AI versus hypothetical general intelligence.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "common-terminology", title: "Common Terminology", description: "The vocabulary you'll see everywhere in AI engineering.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "impact-product-development", title: "Impact on Product Development", description: "How AI changes what and how teams ship.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "roles-responsibilities-ai", title: "Roles and Responsibilities", description: "What an AI engineer is actually accountable for day to day.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
        ],
      },
      {
        id: "pretrained-models",
        title: "Using Pre-trained Models",
        videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU",
        certUrl: "https://huggingface.co/learn/nlp-course",
        certLabel: "Hugging Face: NLP Course",
        topics: [
          {
            id: "pretrained-models-topic", title: "Pre-trained Models", description: "Using models trained by someone else instead of training from scratch.",
            videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU",
            subtopics: [
              { id: "benefits-pretrained", title: "Benefits of Pre-trained Models", description: "Why reuse beats retraining for most use cases.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "limitations-pretrained", title: "Limitations and Considerations", description: "What you give up by not training your own model.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
            ],
          },
          {
            id: "popular-ai-models", title: "Popular AI Models", description: "The major model families in production today.",
            videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU",
            subtopics: [
              { id: "openai-models", title: "OpenAI Models", description: "GPT family capabilities and context length.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU",
                subtopics: [
                  { id: "capabilities-context-length", title: "Capabilities / Context Length", description: "How much a model can take in, and what it can do with it.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
                  { id: "cutoff-dates-knowledge", title: "Cut-off Dates / Knowledge", description: "What a model does and doesn't know based on training data recency.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
                ],
              },
              { id: "anthropic-claude", title: "Anthropic's Claude", description: "Claude model family overview.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "google-gemini", title: "Google's Gemini", description: "Gemini model family overview.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "azure-ai", title: "Azure AI", description: "Microsoft's hosted AI model services.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "aws-sagemaker", title: "AWS Sagemaker", description: "Amazon's ML model hosting and training platform.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "huggingface-models-popular", title: "Hugging Face Models", description: "The open model hub.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "mistral-ai", title: "Mistral AI", description: "Mistral's open and hosted model family.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "cohere", title: "Cohere", description: "Cohere's enterprise-focused model family.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
            ],
          },
        ],
      },
      {
        id: "openai-api",
        title: "OpenAI API",
        videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/",
        certUrl: "https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/",
        certLabel: "DeepLearning.AI: ChatGPT Prompt Engineering for Developers",
        topics: [
          { id: "openai-platform", title: "OpenAI Platform", description: "The dashboard, keys, and account setup behind the API.", videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/" },
          { id: "chat-completions-api", title: "Chat Completions API", description: "The core endpoint for sending messages and getting model replies.", videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/" },
          { id: "writing-prompts", title: "Writing Prompts", description: "Structuring input to get reliable output.", videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/" },
          { id: "openai-playground", title: "OpenAI Playground", description: "Testing prompts interactively before wiring up code.", videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/" },
          { id: "fine-tuning", title: "Fine-tuning", description: "Adapting a base model to your own data.", videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/" },
          {
            id: "managing-tokens", title: "Managing Tokens", description: "Token limits, counting, and cost control.",
            videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/",
            subtopics: [
              { id: "maximum-tokens", title: "Maximum Tokens", description: "The hard ceiling on input+output length per request.", videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/" },
              { id: "token-counting", title: "Token Counting", description: "Estimating tokens before you send a request.", videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/" },
              { id: "pricing-considerations-tokens", title: "Pricing Considerations", description: "How token usage translates to cost.", videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/" },
            ],
          },
          { id: "prompt-engineering-roadmap-link", title: "Prompt Engineering Roadmap", description: "The dedicated deep-dive track for prompt design.", videoUrl: "https://www.freecodecamp.org/news/chatgpt-course-use-the-openai-api-to-code-5-projects/" },
        ],
      },
      {
        id: "ai-safety-ethics",
        title: "AI Safety and Ethics",
        videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs",
        certUrl: "https://www.coursera.org/specializations/ethics-in-ai",
        certLabel: "Coursera: Ethics in the Age of AI Specialization",
        topics: [
          { id: "understanding-ai-safety-issues", title: "Understanding AI Safety Issues", description: "The core categories of risk in deployed AI systems.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
          { id: "prompt-injection-attacks", title: "Prompt Injection Attacks", description: "Getting a model to ignore its instructions via crafted input.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
          { id: "bias-fairness", title: "Bias and Fairness", description: "How training data skews model behavior.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
          { id: "security-privacy-concerns", title: "Security and Privacy Concerns", description: "Data leakage and unsafe handling of user input.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
          { id: "adversarial-testing", title: "Conducting Adversarial Testing", description: "Deliberately probing a model for failure modes.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
          { id: "openai-moderation-api", title: "OpenAI Moderation API", description: "Automated content-safety screening.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
          { id: "end-user-ids-prompts", title: "Adding End-user IDs in Prompts", description: "Traceability for abuse monitoring.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
          { id: "robust-prompt-engineering", title: "Robust Prompt Engineering", description: "Writing prompts resistant to manipulation.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
          { id: "know-customers-usecases", title: "Know Your Customers / Usecases", description: "Understanding who uses your system and how, to anticipate misuse.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
          { id: "constraining-outputs-inputs", title: "Constraining Outputs and Inputs", description: "Schema and format enforcement to reduce unsafe output.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
          { id: "safety-best-practices", title: "Safety Best Practices", description: "The checklist before shipping an AI feature.", videoUrl: "https://www.youtube.com/watch?v=agEPmYdbQLs" },
        ],
      },
      {
        id: "opensource-ai",
        title: "OpenSource AI",
        videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU",
        certUrl: "https://huggingface.co/learn/nlp-course",
        certLabel: "Hugging Face: NLP Course",
        topics: [
          { id: "open-vs-closed-source", title: "Open vs Closed Source Models", description: "Trade-offs between openly-weighted and API-only models.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
          { id: "popular-open-source-models", title: "Popular Open Source Models", description: "The most widely used openly-weighted model families.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
          {
            id: "hugging-face-topic", title: "Hugging Face", description: "The open-model hub, ecosystem, and tooling.",
            videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU",
            subtopics: [
              { id: "hugging-face-hub", title: "Hugging Face Hub", description: "The model, dataset, and Space repository.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "hugging-face-tasks", title: "Hugging Face Tasks", description: "Pre-built pipelines for common ML tasks.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "finding-open-source-models", title: "Finding Open Source Models", description: "Searching and filtering the Hub for the right model.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
            ],
          },
          {
            id: "using-open-source-models", title: "Using Open Source Models", description: "Running open models locally or via SDKs.",
            videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU",
            subtopics: [
              { id: "inference-sdk", title: "Inference SDK", description: "Hugging Face's hosted inference client.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "transformers-js", title: "Transformers.js", description: "Running transformer models directly in the browser.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
              { id: "ollama-topic", title: "Ollama", description: "Running open models locally on your own machine.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU",
                subtopics: [
                  { id: "ollama-models", title: "Ollama Models", description: "The model library available through Ollama.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
                  { id: "ollama-sdk", title: "Ollama SDK", description: "Programmatic access to locally running Ollama models.", videoUrl: "https://www.youtube.com/watch?v=R8h_gpSpEVU" },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "embeddings-vector-databases",
        title: "Embeddings & Vector Databases",
        videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/",
        certUrl: "https://www.deeplearning.ai/short-courses/building-applications-vector-databases/",
        certLabel: "DeepLearning.AI: Vector Databases",
        topics: [
          { id: "what-are-embeddings", title: "What are Embeddings", description: "Turning data into vectors that capture meaning.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
          {
            id: "use-cases-embeddings", title: "Use Cases for Embeddings", description: "Where embeddings actually get used in production.",
            videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/",
            subtopics: [
              { id: "semantic-search", title: "Semantic Search", description: "Finding results by meaning, not keyword match.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "recommendation-systems", title: "Recommendation Systems", description: "Suggesting similar items based on vector proximity.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "anomaly-detection", title: "Anomaly Detection", description: "Flagging outliers in embedding space.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "data-classification", title: "Data Classification", description: "Categorizing content using embedding similarity.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
            ],
          },
          {
            id: "openai-embeddings-api", title: "OpenAI Embeddings API", description: "Generating embeddings via OpenAI's hosted models.",
            videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/",
            subtopics: [
              { id: "openai-embedding-models", title: "OpenAI Embedding Models", description: "The specific embedding model options and dimensions.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "pricing-considerations-embeddings", title: "Pricing Considerations", description: "Cost per embedding call at scale.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
            ],
          },
          {
            id: "open-source-embeddings", title: "Open-Source Embeddings", description: "Generating embeddings without a paid API.",
            videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/",
            subtopics: [
              { id: "sentence-transformers", title: "Sentence Transformers", description: "A popular open embedding model library.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "models-on-hugging-face", title: "Models on Hugging Face", description: "Finding open embedding models on the Hub.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
            ],
          },
          {
            id: "vector-databases-topic", title: "Vector Databases", description: "Storing embeddings for fast similarity search.",
            videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/",
            subtopics: [
              { id: "purpose-functionality-vdb", title: "Purpose and Functionality", description: "What a vector database actually does differently from a normal DB.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "popular-vector-dbs", title: "Popular Vector DBs (pick one)", description: "Chroma, Pinecone, Weaviate, FAISS, LanceDB, Qdrant, Supabase, MongoDB Atlas.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "indexing-embeddings", title: "Indexing Embeddings", description: "Structuring vectors for fast retrieval.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "performing-similarity-search", title: "Performing Similarity Search", description: "Querying by nearest-neighbor distance.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "implementing-vector-search", title: "Implementing Vector Search", description: "Wiring vector search into an application end to end.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
            ],
          },
        ],
      },
      {
        id: "rag-implementation",
        title: "RAG & Implementation",
        videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/",
        certUrl: "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/",
        certLabel: "DeepLearning.AI: LangChain for LLM Application Development",
        topics: [
          { id: "rag-usecases", title: "RAG Usecases", description: "When retrieval beats a bigger context window.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
          { id: "rag-vs-fine-tuning", title: "RAG vs Fine-tuning", description: "Choosing between injecting knowledge and baking it in.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
          { id: "chunking", title: "Chunking", description: "Splitting documents into retrievable pieces.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
          { id: "embedding-step", title: "Embedding", description: "Converting chunks into vectors.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
          { id: "vector-database-step", title: "Vector Database", description: "Storing and indexing the embedded chunks.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
          { id: "retrieval-process", title: "Retrieval Process", description: "Fetching the most relevant chunks for a query.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
          { id: "generation-step", title: "Generation", description: "Producing the final answer from retrieved context.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
          {
            id: "implementing-rag", title: "Implementing RAG", description: "The concrete tools used to wire a RAG pipeline together.",
            videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/",
            subtopics: [
              { id: "using-sdks-directly", title: "Using SDKs Directly", description: "Building RAG by calling provider SDKs without a framework.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "langchain-rag", title: "Langchain", description: "Framework for chaining retrieval and generation steps.", videoUrl: "https://www.freecodecamp.org/news/learn-langchain-and-gen-ai-by-building-6-projects/" },
              { id: "llama-index", title: "Llama Index", description: "A framework purpose-built for RAG data pipelines.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "openai-assistant-api-rag", title: "Open AI Assistant API", description: "OpenAI's own hosted retrieval-augmented assistant primitive.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
              { id: "replicate", title: "Replicate", description: "Hosted inference for open models used inside a RAG pipeline.", videoUrl: "https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/" },
            ],
          },
        ],
      },
      {
        id: "ai-agents-section",
        title: "AI Agents",
        videoUrl: "https://www.freecodecamp.org/news/ai-agents-for-beginners/",
        certUrl: "https://academy.langchain.com/",
        certLabel: "LangChain Academy",
        topics: [
          { id: "rag-alternative", title: "RAG Alternative", description: "When an agent's tool use replaces a retrieval pipeline.", videoUrl: "https://www.freecodecamp.org/news/ai-agents-for-beginners/" },
          { id: "agents-usecases", title: "Agents Usecases", description: "Where autonomous multi-step agents actually add value.", videoUrl: "https://www.freecodecamp.org/news/ai-agents-for-beginners/" },
          { id: "prompt-engineering-agents", title: "Prompt Engineering", description: "Prompting patterns specific to agentic behavior.", videoUrl: "https://www.freecodecamp.org/news/ai-agents-for-beginners/" },
          { id: "react-prompting", title: "ReAct Prompting", description: "Interleaving reasoning and acting in a single prompt loop.", videoUrl: "https://www.freecodecamp.org/news/ai-agents-for-beginners/" },
          { id: "manual-implementation", title: "Manual Implementation", description: "Building an agent loop yourself without a framework.", videoUrl: "https://www.freecodecamp.org/news/ai-agents-for-beginners/" },
          { id: "openai-functions-tools", title: "OpenAI Functions / Tools", description: "Structured tool-calling support in the OpenAI API.", videoUrl: "https://www.freecodecamp.org/news/ai-agents-for-beginners/" },
          { id: "openai-assistant-api-agents", title: "OpenAI Assistant API", description: "OpenAI's hosted stateful agent primitive.", videoUrl: "https://www.freecodecamp.org/news/ai-agents-for-beginners/" },
          { id: "building-ai-agents", title: "Building AI Agents", description: "Putting the pieces together into a working agent.", videoUrl: "https://www.freecodecamp.org/news/ai-agents-for-beginners/" },
        ],
      },
      {
        id: "multimodal-ai",
        title: "Multimodal AI",
        videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/",
        certUrl: "https://www.deeplearning.ai/courses/building-multimodal-data-pipelines",
        certLabel: "DeepLearning.AI: Building Multimodal Data Pipelines",
        topics: [
          { id: "multimodal-ai-usecases", title: "Multimodal AI Usecases", description: "Where combining text, image, audio, and video pays off.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
          { id: "image-understanding", title: "Image Understanding", description: "Getting a model to describe or reason about an image.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
          { id: "image-generation", title: "Image Generation", description: "Producing images from text prompts.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
          { id: "video-understanding", title: "Video Understanding", description: "Extracting meaning from video content.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
          { id: "audio-processing", title: "Audio Processing", description: "Working with audio as model input.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
          { id: "text-to-speech", title: "Text-to-Speech", description: "Converting generated text into spoken audio.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
          { id: "speech-to-text", title: "Speech-to-Text", description: "Transcribing spoken audio into text.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
          {
            id: "multimodal-ai-tasks", title: "Multimodal AI Tasks", description: "The specific APIs used to implement multimodal features.",
            videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/",
            subtopics: [
              { id: "openai-vision-api", title: "OpenAI Vision API", description: "Sending images to GPT for understanding.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
              { id: "dalle-api", title: "DALL-E API", description: "OpenAI's image generation endpoint.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
              { id: "whisper-api", title: "Whisper API", description: "OpenAI's speech-to-text endpoint.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
              { id: "huggingface-models-multimodal", title: "Hugging Face Models", description: "Open multimodal models on the Hub.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
              { id: "langchain-multimodal", title: "LangChain for Multimodal Apps", description: "Chaining multimodal calls together.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
              { id: "llamaindex-multimodal", title: "LlamaIndex for Multimodal Apps", description: "Indexing and retrieving across multiple content types.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
            ],
          },
          { id: "implementing-multimodal-ai", title: "Implementing Multimodal AI", description: "Putting multimodal inputs/outputs together in a real feature.", videoUrl: "https://www.freecodecamp.org/news/learn-to-use-the-gemini-ai-multimodal-model/" },
        ],
      },
      {
        id: "development-tools-ai",
        title: "Development Tools",
        videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/",
        topics: [
          { id: "ai-code-editors", title: "AI Code Editors", description: "Editors built around AI-assisted coding (e.g. Cursor).", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "code-completion-tools", title: "Code Completion Tools", description: "Inline AI suggestions inside your existing editor (e.g. Copilot).", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
        ],
      },
    ],
  },
  frontend: {
    id: "frontend",
    label: "Frontend",
    tagline: "The exact roadmap.sh Frontend path — internet basics through browser APIs.",
    heroVideoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
    heroVideoLabel: "freeCodeCamp: React Tutorials Playlist",
    heroCertUrl: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
    heroCertLabel: "Meta Front-End Developer Certificate",
    sections: [
      {
        id: "internet",
        title: "Internet",
        videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc",
        topics: [
          { id: "how-internet-works", title: "How does the internet work?", description: "Client, server, and the request/response cycle.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
          { id: "what-is-http", title: "What is HTTP?", description: "The protocol underlying nearly all web traffic.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
          { id: "what-is-domain-name", title: "What is Domain Name?", description: "Human-readable addresses for servers.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
          { id: "what-is-hosting", title: "What is hosting?", description: "Where your site's files actually live.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
          { id: "dns-how-it-works", title: "DNS and how it works?", description: "Translating domain names into IP addresses.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
          { id: "browsers-how-they-work", title: "Browsers and how they work?", description: "Parsing, rendering, and executing a page.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
        ],
      },
      {
        id: "html",
        title: "HTML",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88",
        certUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
        certLabel: "freeCodeCamp: Responsive Web Design",
        topics: [
          { id: "html-basics", title: "Learn the basics", description: "Tags, elements, and document structure.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
          { id: "semantic-html", title: "Writing Semantic HTML", description: "Using elements for their meaning, not just their look.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
          { id: "forms-validations", title: "Forms and Validations", description: "Collecting and validating user input.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
          { id: "html-accessibility", title: "Accessibility", description: "Making markup usable by assistive technology.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
          { id: "seo-basics", title: "SEO Basics", description: "Markup choices that affect search visibility.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
        ],
      },
      {
        id: "css",
        title: "CSS",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88",
        certUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
        certLabel: "freeCodeCamp: Responsive Web Design",
        topics: [
          { id: "css-basics", title: "Learn the basics", description: "Selectors, the box model, and cascading rules.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
          { id: "making-layouts", title: "Making Layouts", description: "Flexbox and Grid for page structure.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
          { id: "responsive-design", title: "Responsive Design", description: "Layouts that adapt across screen sizes.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
        ],
      },
      {
        id: "javascript-section",
        title: "JavaScript",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        certUrl: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
        certLabel: "freeCodeCamp: JavaScript Algorithms",
        topics: [
          { id: "js-learn-basics", title: "Learn the Basics", description: "Variables, functions, and control flow.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "dom-manipulation", title: "Learn DOM Manipulation", description: "Reading and changing the page from script.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "fetch-ajax", title: "Fetch API / Ajax (XHR)", description: "Making network requests from the browser.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
        ],
      },
      {
        id: "vcs",
        title: "Version Control Systems",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [
          { id: "git-frontend", title: "Git", description: "Tracking changes and collaborating on code.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
        ],
      },
      {
        id: "vcs-hosting",
        title: "VCS Hosting",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [
          { id: "github-frontend", title: "GitHub", description: "The most widely used Git hosting platform.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
          { id: "gitlab-frontend", title: "GitLab", description: "A self-hostable Git platform with built-in CI/CD.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
          { id: "bitbucket-frontend", title: "Bitbucket", description: "Atlassian's Git hosting, integrated with Jira.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
        ],
      },
      {
        id: "package-managers",
        title: "Package Managers",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [
          { id: "npm", title: "npm", description: "The default Node.js package manager.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "pnpm", title: "pnpm", description: "A faster, disk-space-efficient package manager.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "yarn", title: "yarn", description: "An alternative package manager focused on speed and reliability.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
        ],
      },
      {
        id: "pick-framework",
        title: "Pick a Framework",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
        certUrl: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
        certLabel: "Meta Front-End Developer Certificate",
        topics: [
          { id: "react-frontend", title: "React", description: "Components, hooks, and the render lifecycle.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" },
          { id: "vuejs", title: "Vue.js", description: "An approachable, incrementally-adoptable framework.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" },
          { id: "angular", title: "Angular", description: "A full-featured, opinionated framework from Google.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" },
          { id: "svelte", title: "Svelte", description: "A compiler-based framework with no runtime overhead.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" },
          { id: "solidjs", title: "Solid JS", description: "Fine-grained reactivity without a virtual DOM.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" },
          { id: "qwik", title: "Qwik", description: "A framework built around resumability instead of hydration.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" },
        ],
      },
      {
        id: "writing-css",
        title: "Writing CSS",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88",
        topics: [
          { id: "tailwind", title: "Tailwind", description: "A utility-first CSS framework.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
        ],
      },
      {
        id: "css-architecture",
        title: "CSS Architecture",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88",
        topics: [
          { id: "bem", title: "BEM", description: "A naming convention for scoping CSS classes.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
        ],
      },
      {
        id: "css-preprocessors",
        title: "CSS Preprocessors",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88",
        topics: [
          { id: "sass", title: "Sass", description: "Variables, nesting, and mixins for CSS.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
          { id: "postcss", title: "PostCSS", description: "Transforming CSS with JS plugins.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
        ],
      },
      {
        id: "build-tools",
        title: "Build Tools",
        videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ",
        topics: [
          {
            id: "linters-formatters", title: "Linters and Formatters", description: "Enforcing code style and catching errors automatically.",
            videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ",
            subtopics: [
              { id: "prettier", title: "Prettier", description: "An opinionated code formatter.", videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ" },
              { id: "eslint", title: "ESLint", description: "A configurable JavaScript/TypeScript linter.", videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ" },
            ],
          },
          {
            id: "module-bundlers", title: "Module Bundlers", description: "Combining and optimizing JS modules for the browser.",
            videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ",
            subtopics: [
              { id: "vite", title: "Vite", description: "A fast, modern dev server and bundler.", videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ" },
              { id: "swc", title: "SWC", description: "A Rust-based JS/TS compiler.", videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ" },
              { id: "esbuild", title: "esbuild", description: "An extremely fast Go-based bundler.", videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ" },
              { id: "webpack", title: "Webpack", description: "The long-standing configurable module bundler.", videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ" },
              { id: "rollup", title: "Rollup", description: "A bundler optimized for libraries.", videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ" },
              { id: "parcel", title: "Parcel", description: "A zero-config bundler.", videoUrl: "https://www.youtube.com/watch?v=VAeRhmpcWEQ" },
            ],
          },
        ],
      },
      {
        id: "testing",
        title: "Testing",
        videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/",
        topics: [
          { id: "vitest", title: "Vitest", description: "A Vite-native unit testing framework.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" },
          { id: "jest", title: "Jest", description: "A widely used JS testing framework.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" },
          { id: "playwright", title: "Playwright", description: "Cross-browser end-to-end testing.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" },
          { id: "cypress", title: "Cypress", description: "A popular end-to-end testing tool.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" },
        ],
      },
      {
        id: "web-security-basics",
        title: "Web Security Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/",
        topics: [
          { id: "cors", title: "CORS", description: "Controlling which origins can call your API.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "https-frontend", title: "HTTPS", description: "Encrypting traffic between browser and server.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "csp", title: "Content Security Policy", description: "Restricting what a page is allowed to load and run.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "owasp-risks-frontend", title: "OWASP Security Risks", description: "The most common web vulnerability categories.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
        ],
      },
      {
        id: "auth-strategies",
        title: "Authentication Strategies",
        videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/",
        topics: [
          { id: "auth-methods-frontend", title: "JWT, OAuth, SSO, Basic Auth, Session Auth", description: "The common ways a frontend authenticates a user.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
        ],
      },
      {
        id: "web-components",
        title: "Web Components",
        topics: [
          { id: "html-templates", title: "HTML Templates", description: "Reusable, inert markup fragments." },
          { id: "custom-elements", title: "Custom Elements", description: "Defining your own HTML tags." },
          { id: "shadow-dom", title: "Shadow DOM", description: "Style and DOM encapsulation for a component." },
        ],
      },
      {
        id: "type-checkers",
        title: "Type Checkers",
        videoUrl: "https://www.youtube.com/watch?v=SpwzRDUQ1GI",
        certUrl: "https://www.typescriptlang.org/docs/handbook/intro.html",
        certLabel: "TypeScript Handbook",
        topics: [
          { id: "typescript-frontend", title: "TypeScript", description: "Static types layered on top of JavaScript.", videoUrl: "https://www.youtube.com/watch?v=SpwzRDUQ1GI" },
        ],
      },
      {
        id: "ssr",
        title: "SSR",
        videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V",
        certUrl: "https://nextjs.org/learn",
        certLabel: "Next.js Official Learn Course",
        topics: [
          { id: "nextjs-frontend", title: "Next.js", description: "The most widely used React SSR framework.", videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V" },
          { id: "astro", title: "Astro", description: "A content-focused framework with island architecture.", videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V" },
          { id: "react-router", title: "react-router", description: "Data-loading, SSR-capable routing for React.", videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V" },
          { id: "nuxtjs", title: "Nuxt.js", description: "The Vue equivalent of Next.js.", videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V" },
          { id: "sveltekit", title: "Svelte Kit", description: "The official Svelte application framework.", videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V" },
        ],
      },
      {
        id: "graphql",
        title: "GraphQL",
        videoUrl: "https://www.youtube.com/watch?v=5199E50O7SI",
        topics: [
          { id: "apollo", title: "Apollo", description: "The most widely used GraphQL client/server toolkit.", videoUrl: "https://www.youtube.com/watch?v=5199E50O7SI" },
          { id: "relay-modern", title: "Relay Modern", description: "Facebook's GraphQL client, built for scale.", videoUrl: "https://www.youtube.com/watch?v=5199E50O7SI" },
        ],
      },
      {
        id: "pwas",
        title: "PWAs",
        videoUrl: "https://www.youtube.com/playlist?list=PLmIA3VZysEqQCi5xOJJDb5QIYgHwPhf_D",
        topics: [
          { id: "perf-best-practices-pwa", title: "Performance Best Practices", description: "Making an installable web app feel native.", videoUrl: "https://www.youtube.com/playlist?list=PLmIA3VZysEqQCi5xOJJDb5QIYgHwPhf_D" },
        ],
      },
      {
        id: "static-site-generators",
        title: "Static Site Generators",
        videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V",
        topics: [
          { id: "nextjs-ssg", title: "Next.js", description: "Static generation mode alongside SSR.", videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V" },
          { id: "astro-ssg", title: "Astro", description: "Ships zero JS by default for static content.", videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V" },
          { id: "vuepress", title: "Vuepress", description: "A Vue-powered static site generator.", videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V" },
          { id: "nuxtjs-ssg", title: "Nuxt.js", description: "Static generation mode for Vue.", videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V" },
          { id: "eleventy", title: "Eleventy", description: "A simple, framework-agnostic static site generator.", videoUrl: "https://www.youtube.com/playlist?list=PLYQSCk-qyTW0YOpI5_SwfvZO0LOMlxZ5V" },
        ],
      },
      {
        id: "mobile-apps",
        title: "Mobile Apps",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
        topics: [
          { id: "react-native-frontend", title: "React Native", description: "Building native mobile apps with React.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" },
          { id: "flutter-frontend", title: "Flutter", description: "Google's cross-platform UI toolkit.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" },
          { id: "ionic", title: "Ionic", description: "Web-tech-based cross-platform mobile framework.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" },
        ],
      },
      {
        id: "desktop-apps",
        title: "Desktop Apps",
        topics: [
          { id: "electron", title: "Electron", description: "Building desktop apps with web technologies." },
          { id: "tauri", title: "Tauri", description: "A lighter-weight Rust-based alternative to Electron." },
          { id: "flutter-desktop", title: "Flutter", description: "Flutter's desktop app target." },
        ],
      },
      {
        id: "browser-apis",
        title: "Browser APIs",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [
          {
            id: "measure-improve-perf", title: "Measure & Improve Perf.", description: "Tools and models for diagnosing slow pages.",
            videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
            subtopics: [
              { id: "prpl-pattern", title: "PRPL Pattern", description: "Push, Render, Pre-cache, Lazy-load — a loading strategy.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
              { id: "rail-model", title: "RAIL Model", description: "A user-centric performance model.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
              { id: "performance-metrics-frontend", title: "Performance Metrics", description: "Core Web Vitals and related measurements.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
              { id: "using-lighthouse", title: "Using Lighthouse", description: "Automated auditing for performance and accessibility.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
              { id: "using-devtools", title: "Using DevTools", description: "Profiling and debugging directly in the browser.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
            ],
          },
          { id: "storage-browser", title: "Storage", description: "localStorage, sessionStorage, and IndexedDB.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "web-sockets", title: "Web Sockets", description: "Persistent, bidirectional connections.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "server-sent-events", title: "Server Sent Events", description: "One-way server-to-client streaming.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "service-workers", title: "Service Workers", description: "Background scripts enabling offline support.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "location-api", title: "Location", description: "Reading the user's geographic position.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "notifications-api", title: "Notifications", description: "Sending system-level notifications from the browser.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "device-orientation", title: "Device Orientation", description: "Reading accelerometer/gyroscope data.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "payments-api", title: "Payments", description: "The browser's native payment request flow.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "credentials-api", title: "Credentials", description: "Browser-managed credential storage and autofill.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
        ],
      },
    ],
  },
  backend: {
    id: "backend",
    label: "Backend",
    tagline: "The exact roadmap.sh Backend path — internet basics through building for scale.",
    heroVideoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
    heroVideoLabel: "freeCodeCamp: Node.js and Express.js — Full Course",
    heroCertUrl: "https://www.coursera.org/professional-certificates/meta-back-end-developer",
    heroCertLabel: "Meta Back-End Developer Certificate",
    sections: [
      {
        id: "internet-be",
        title: "Internet",
        videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc",
        topics: [
          { id: "how-internet-works-be", title: "How does the internet work?", description: "Client, server, and the request/response cycle.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
          { id: "what-is-http-be", title: "What is HTTP?", description: "The protocol underlying nearly all web traffic.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
          { id: "what-is-domain-name-be", title: "What is Domain Name?", description: "Human-readable addresses for servers.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
          { id: "what-is-hosting-be", title: "What is hosting?", description: "Where your server's code actually runs.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
          { id: "dns-how-it-works-be", title: "DNS and how it works?", description: "Translating domain names into IP addresses.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
          { id: "browsers-how-they-work-be", title: "Browsers and how they work?", description: "What happens client-side before a request reaches your server.", videoUrl: "https://www.youtube.com/watch?v=zN8YNNHcaZc" },
        ],
      },
      {
        id: "pick-language",
        title: "Pick a Language",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [
          { id: "javascript-be", title: "JavaScript", description: "Node.js runtime and the JS backend ecosystem.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "python-be", title: "Python", description: "Django/FastAPI and the Python backend ecosystem.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/" },
          { id: "java-be", title: "Java", description: "Spring Boot and the JVM backend ecosystem.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "php-be", title: "PHP", description: "Laravel and the PHP backend ecosystem.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "rust-be", title: "Rust", description: "A memory-safe systems language increasingly used for backends.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "go-be", title: "Go", description: "A simple, fast, concurrency-friendly backend language.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "csharp-be", title: "C#", description: "ASP.NET Core and the .NET backend ecosystem.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "ruby-be", title: "Ruby", description: "Ruby on Rails and the Ruby backend ecosystem.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
        ],
      },
      {
        id: "vcs-be",
        title: "Version Control Systems",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [{ id: "git-be", title: "Git", description: "Tracking changes and collaborating on server-side code.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" }],
      },
      {
        id: "repo-hosting-be",
        title: "Repo Hosting Services",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [
          { id: "github-be", title: "GitHub", description: "The most widely used Git hosting platform.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
          { id: "gitlab-be", title: "GitLab", description: "A self-hostable Git platform with built-in CI/CD.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
          { id: "bitbucket-be", title: "Bitbucket", description: "Atlassian's Git hosting, integrated with Jira.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
        ],
      },
      {
        id: "relational-databases",
        title: "Relational Databases",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        certUrl: "https://www.freecodecamp.org/learn/relational-database/",
        certLabel: "freeCodeCamp: Relational Databases",
        topics: [
          { id: "postgresql-be", title: "PostgreSQL", description: "The most widely used open-source relational database.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "mysql-be", title: "MySQL", description: "A widely deployed open-source relational database.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "mariadb-be", title: "MariaDB", description: "A community-driven MySQL fork.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "mssql-be", title: "MS SQL", description: "Microsoft's relational database engine.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "oracle-be", title: "Oracle", description: "Enterprise-grade relational database engine.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "sqlite-be", title: "SQLite", description: "A lightweight, embedded relational database.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
        ],
      },
      {
        id: "caching",
        title: "Caching",
        videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/",
        topics: [
          { id: "server-side-caching", title: "Server Side", description: "Caching responses at the application/server layer.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
          { id: "cdn-caching", title: "CDN", description: "Caching static assets at the network edge.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
          {
            id: "client-side-caching", title: "Client Side", description: "Caching in the browser to avoid repeat requests.",
            videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/",
            subtopics: [
              { id: "redis-be", title: "Redis", description: "An in-memory data store commonly used for caching.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
              { id: "memcached", title: "Memcached", description: "A simple, high-performance distributed memory cache.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
            ],
          },
        ],
      },
      {
        id: "learn-about-apis",
        title: "Learn about APIs",
        videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/",
        topics: [
          { id: "hateoas", title: "HATEOAS", description: "Hypermedia links that let clients navigate an API dynamically.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" },
          { id: "openapi-specs", title: "Open API Specs", description: "A standard format for describing REST APIs.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" },
          { id: "rest-be", title: "REST", description: "The dominant API architectural style.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" },
          { id: "json-apis-be", title: "JSON APIs", description: "A lightweight convention for JSON-based REST APIs.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" },
          { id: "soap-be", title: "SOAP", description: "An older, XML-based API protocol still used in enterprise systems.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" },
          { id: "grpc-be", title: "gRPC", description: "A high-performance RPC framework using protocol buffers.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" },
          { id: "graphql-be", title: "GraphQL", description: "A query language letting clients request exactly the fields they need.", videoUrl: "https://www.youtube.com/watch?v=5199E50O7SI" },
        ],
      },
      {
        id: "web-security-be",
        title: "Web Security",
        videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/",
        topics: [
          {
            id: "hashing-algorithms", title: "Hashing Algorithms", description: "One-way functions used to store passwords and verify integrity.",
            videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/",
            subtopics: [
              { id: "md5", title: "MD5", description: "An outdated, broken hashing algorithm.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
              { id: "sha", title: "SHA", description: "A family of cryptographic hash functions.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
              { id: "scrypt", title: "scrypt", description: "A memory-hard password hashing function.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
              { id: "bcrypt", title: "bcrypt", description: "The standard slow password-hashing function.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
            ],
          },
          { id: "https-be", title: "HTTPS", description: "Encrypting traffic between client and server.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "owasp-risks-be", title: "OWASP Risks", description: "The most common web vulnerability categories.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "cors-be", title: "CORS", description: "Controlling which origins can call your API.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "ssl-tls-be", title: "SSL/TLS", description: "The protocols underlying HTTPS encryption.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "csp-be", title: "CSP", description: "Restricting what content a page can load.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "server-security", title: "Server Security", description: "Hardening the machine your API runs on.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "api-security-best-practices-be", title: "API Security Best Practices", description: "The checklist before exposing an API publicly.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
        ],
      },
      {
        id: "authentication-be",
        title: "Authentication",
        videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/",
        topics: [
          { id: "jwt-be", title: "JWT", description: "Compact, signed tokens for stateless authentication.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "oauth-be", title: "OAuth", description: "Delegated authorization without sharing passwords.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "basic-auth-be", title: "Basic Authentication", description: "Sending credentials directly in the request header.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "token-auth-be", title: "Token Authentication", description: "Authenticating via an opaque bearer token.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "cookie-auth-be", title: "Cookie Based Auth", description: "Session identifiers stored in browser cookies.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "openid-be", title: "OpenID", description: "An identity layer built on top of OAuth.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "saml-be", title: "SAML", description: "An XML-based SSO protocol common in enterprise auth.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
        ],
      },
      {
        id: "testing-be",
        title: "Testing",
        videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/",
        topics: [
          { id: "integration-testing-be", title: "Integration Testing", description: "Testing how components work together.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" },
          { id: "unit-testing-be", title: "Unit Testing", description: "Testing individual functions in isolation.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" },
          { id: "functional-testing-be", title: "Functional Testing", description: "Testing that a feature behaves as specified.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" },
        ],
      },
      {
        id: "cicd-be",
        title: "CI / CD",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
        topics: [
          { id: "cicd-concept-be", title: "Continuous Integration / Continuous Deployment", description: "Automating build, test, and deploy pipelines.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs" },
        ],
      },
      {
        id: "more-about-databases",
        title: "More about Databases",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        topics: [
          { id: "orms", title: "ORMs", description: "Mapping database rows to application objects.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "acid", title: "ACID", description: "The transaction guarantees relational databases provide.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "transactions-be", title: "Transactions", description: "Grouping operations so they succeed or fail together.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "n-plus-one", title: "N+1 Problem", description: "A common ORM performance pitfall.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "normalization-be", title: "Normalization", description: "Structuring tables to reduce redundancy.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "failure-modes", title: "Failure Modes", description: "How databases fail and how to plan for it.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "profiling-performance", title: "Profiling Perfor.", description: "Finding and fixing slow queries.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "migrations-be", title: "Migrations", description: "Versioning and evolving a database schema over time.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
        ],
      },
      {
        id: "scaling-databases",
        title: "Scaling Databases",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        topics: [
          { id: "database-indexes", title: "Database Indexes", description: "Speeding up lookups at the cost of write overhead.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "data-replication", title: "Data Replication", description: "Copying data across nodes for availability and read scaling.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "sharding-strategies-be", title: "Sharding Strategies", description: "Splitting data horizontally across multiple databases.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "cap-theorem", title: "CAP Theorem", description: "The consistency/availability/partition-tolerance trade-off.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
        ],
      },
      {
        id: "software-design-architecture",
        title: "Software Design & Architecture",
        videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/",
        topics: [
          {
            id: "architectural-patterns", title: "Architectural Patterns", description: "High-level ways to structure a whole system.",
            videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/",
            subtopics: [
              { id: "monolithic-apps", title: "Monolithic Apps", description: "A single deployable unit containing all functionality.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
              { id: "microservices-be", title: "Microservices", description: "Independently deployable services communicating over the network.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
              { id: "soa", title: "SOA", description: "Service-oriented architecture, microservices' predecessor.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
              { id: "serverless-be", title: "Serverless", description: "Running code without managing servers directly.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
              { id: "service-mesh-be", title: "Service Mesh", description: "Infrastructure layer handling service-to-service communication.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
              { id: "twelve-factor-apps", title: "Twelve Factor Apps", description: "A methodology for building portable, scalable services.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
            ],
          },
          {
            id: "design-dev-principles", title: "Design and Development Principles", description: "Patterns for structuring code within a service.",
            videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/",
            subtopics: [
              { id: "gof-design-patterns", title: "GOF Design Patterns", description: "The classic Gang of Four object-oriented patterns.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
              { id: "domain-driven-design", title: "Domain Driven Design", description: "Modeling software around the business domain.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
              { id: "tdd-be", title: "Test Driven Development", description: "Writing tests before the implementation.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
              { id: "cqrs", title: "CQRS", description: "Separating read and write models.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
              { id: "event-sourcing", title: "Event Sourcing", description: "Storing state as a sequence of events.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
            ],
          },
        ],
      },
      {
        id: "containerization-virtualization",
        title: "Containerization vs Virtualization",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        topics: [
          { id: "docker-be", title: "Docker", description: "The standard container runtime and image format.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
          { id: "lxc", title: "LXC", description: "Linux Containers — OS-level virtualization.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
          { id: "kubernetes-be", title: "Kubernetes", description: "Orchestrating containers at scale.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
        ],
      },
      {
        id: "web-servers-be",
        title: "Web Servers",
        videoUrl: "https://www.freecodecamp.org/news/nginx/",
        topics: [
          { id: "nginx-be", title: "Nginx", description: "A high-performance web server and reverse proxy.", videoUrl: "https://www.freecodecamp.org/news/nginx/" },
          { id: "apache-be", title: "Apache", description: "A long-standing, widely deployed web server.", videoUrl: "https://www.freecodecamp.org/news/nginx/" },
          { id: "caddy-be", title: "Caddy", description: "A web server with automatic HTTPS.", videoUrl: "https://www.freecodecamp.org/news/nginx/" },
          { id: "ms-iis", title: "MS IIS", description: "Microsoft's web server for Windows/.NET stacks.", videoUrl: "https://www.freecodecamp.org/news/nginx/" },
        ],
      },
      {
        id: "search-engines-be",
        title: "Search Engines",
        topics: [
          { id: "elasticsearch-be", title: "Elasticsearch", description: "A distributed search and analytics engine." },
          { id: "solr", title: "Solr", description: "A Lucene-based enterprise search platform." },
        ],
      },
      {
        id: "message-brokers",
        title: "Message Brokers",
        topics: [
          { id: "rabbitmq-be", title: "RabbitMQ", description: "A widely used general-purpose message broker." },
          { id: "kafka-be", title: "Kafka", description: "A distributed event-streaming platform." },
        ],
      },
      {
        id: "real-time-data",
        title: "Real-Time Data",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [
          { id: "sse-be", title: "Server Sent Events", description: "One-way server-to-client streaming.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "websockets-be", title: "WebSockets", description: "Persistent, bidirectional connections.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "long-polling", title: "Long Polling", description: "Simulating push with held-open HTTP requests.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "short-polling", title: "Short Polling", description: "Repeatedly requesting updates on an interval.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "graphql-realtime", title: "GraphQL", description: "Subscriptions for real-time GraphQL updates.", videoUrl: "https://www.youtube.com/watch?v=5199E50O7SI" },
        ],
      },
      {
        id: "nosql-databases",
        title: "NoSQL Databases",
        videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/",
        topics: [
          {
            id: "document-dbs", title: "Document DBs", description: "Storing flexible, JSON-like documents.",
            videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/",
            subtopics: [
              { id: "mongodb-be", title: "MongoDB", description: "The most widely used document database.", videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/" },
              { id: "couchdb", title: "CouchDB", description: "A document database built around HTTP and replication.", videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/" },
            ],
          },
          {
            id: "key-value-be", title: "Key-Value", description: "Simple, fast key-based lookups.",
            subtopics: [
              { id: "redis-nosql", title: "Redis", description: "An in-memory key-value store.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
              { id: "dynamodb", title: "DynamoDB", description: "AWS's managed key-value/document database.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
            ],
          },
          {
            id: "realtime-dbs", title: "Realtime", description: "Databases built for live-syncing data.",
            subtopics: [
              { id: "firebase-be", title: "Firebase", description: "Google's realtime/document database and backend platform.", videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/" },
              { id: "rethinkdb", title: "RethinkDB", description: "A database built for realtime push updates.", videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/" },
              { id: "sqlite-nosql", title: "SQLite", description: "Also usable as an embedded realtime-friendly store.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
            ],
          },
          {
            id: "time-series-dbs", title: "Time Series", description: "Databases optimized for timestamped data.",
            subtopics: [
              { id: "influxdb", title: "Influx DB", description: "A purpose-built time-series database." },
              { id: "timescaledb", title: "TimeScale", description: "A time-series extension for PostgreSQL.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
            ],
          },
          {
            id: "column-dbs", title: "Column DBs", description: "Databases optimized for wide, sparse tables.",
            subtopics: [
              { id: "cassandra", title: "Cassandra", description: "A distributed wide-column database." },
              { id: "hbase-base", title: "Base", description: "The consistency model column stores typically favor (BASE vs ACID)." },
            ],
          },
          {
            id: "graph-dbs", title: "Graph DBs", description: "Databases optimized for traversing relationships.",
            subtopics: [
              { id: "neo4j", title: "Neo4j", description: "The most widely used graph database." },
              { id: "aws-neptune", title: "AWS Neptune", description: "Amazon's managed graph database." },
            ],
          },
        ],
      },
      {
        id: "building-for-scale",
        title: "Building For Scale",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
        topics: [
          { id: "basic-infra-knowledge", title: "Basic Infrastructure Knowledge", description: "Visit the DevOps Beginner Roadmap.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs" },
          {
            id: "mitigation-strategies", title: "Mitigation Strategies", description: "Techniques for degrading gracefully under load.",
            videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
            subtopics: [
              { id: "graceful-degradation", title: "Graceful Degradation", description: "Keeping core functionality up when parts fail." },
              { id: "throttling", title: "Throttling", description: "Limiting request rate to protect a service." },
              { id: "backpressure", title: "Backpressure", description: "Signaling upstream producers to slow down." },
              { id: "loadshifting", title: "Loadshifting", description: "Moving load to less busy times or regions." },
              { id: "circuit-breaker", title: "Circuit Breaker", description: "Stopping calls to a failing dependency temporarily." },
            ],
          },
          { id: "migration-strategies-be", title: "Migration Strategies", description: "Moving systems to new infrastructure with minimal downtime.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs" },
          { id: "types-of-scaling", title: "Types of Scaling", description: "Horizontal vs vertical scaling trade-offs.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs" },
          {
            id: "observability-be", title: "Observability", description: "Understanding what a running system is actually doing.",
            videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
            subtopics: [
              {
                id: "diff-usage-observability", title: "Difference & Usage", description: "How the three pillars of observability relate.",
                subtopics: [
                  { id: "instrumentation", title: "Instrumentation", description: "Adding code to emit metrics, logs, and traces." },
                  { id: "monitoring-be", title: "Monitoring", description: "Watching known metrics against thresholds." },
                  { id: "telemetry", title: "Telemetry", description: "The raw data collected from a running system." },
                ],
              },
            ],
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
  "full-stack": {
    id: "full-stack",
    label: "Full Stack",
    tagline: "The exact roadmap.sh Full Stack path — HTML through Terraform, checkpoint by checkpoint.",
    heroVideoUrl: "https://www.youtube.com/watch?v=KjY94sAKLlw",
    heroVideoLabel: "freeCodeCamp: Next.js — Build & Deploy a Full Stack App",
    heroCertUrl: "https://www.coursera.org/specializations/meta-full-stack-developer",
    heroCertLabel: "Meta Full-Stack Developer Specialization",
    sections: [
      {
        id: "html-fs",
        title: "HTML",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88",
        certUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
        certLabel: "freeCodeCamp: Responsive Web Design",
        topics: [{ id: "html-topic-fs", title: "HTML Fundamentals", description: "Semantic markup and document structure.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" }],
      },
      {
        id: "css-fs",
        title: "CSS",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88",
        topics: [{ id: "css-topic-fs", title: "CSS Fundamentals", description: "Layout, flexbox, and grid.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" }],
      },
      {
        id: "javascript-fs",
        title: "JavaScript",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        certUrl: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
        certLabel: "freeCodeCamp: JavaScript Algorithms",
        topics: [
          { id: "checkpoint-static-webpages", title: "Checkpoint - Static Webpages", description: "Build a static page using only HTML/CSS/JS.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" },
          { id: "checkpoint-interactivity", title: "Checkpoint - Interactivity", description: "Add DOM-driven interactivity to a page.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
        ],
      },
      {
        id: "npm-fs",
        title: "npm",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [{ id: "checkpoint-external-packages", title: "Checkpoint - External Packages", description: "Install and use a third-party npm package.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" }],
      },
      {
        id: "git-fs",
        title: "Git",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [{ id: "git-topic-fs", title: "Git Fundamentals", description: "Tracking changes to your codebase.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" }],
      },
      {
        id: "github-fs",
        title: "GitHub",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [{ id: "checkpoint-collaborative-work", title: "Checkpoint - Collaborative Work", description: "Push a repo and open a pull request.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" }],
      },
      {
        id: "tailwind-fs",
        title: "Tailwind CSS",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88",
        topics: [{ id: "tailwind-topic-fs", title: "Tailwind Fundamentals", description: "Utility-first styling.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88" }],
      },
      {
        id: "react-fs",
        title: "React",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
        certUrl: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
        certLabel: "Meta Front-End Developer Certificate",
        topics: [{ id: "checkpoint-frontend-apps", title: "Checkpoint - Frontend Apps", description: "Build a component-driven frontend app.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" }],
      },
      {
        id: "nodejs-fs",
        title: "Node.js",
        videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
        topics: [{ id: "checkpoint-cli-apps", title: "Checkpoint — CLI Apps", description: "Build a command-line tool with Node.js.", videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/" }],
      },
      {
        id: "restful-apis-fs",
        title: "RESTful APIs",
        videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/",
        topics: [{ id: "checkpoint-crud-apps", title: "Checkpoint — Simple CRUD Apps", description: "Build a basic create/read/update/delete API.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" }],
      },
      {
        id: "postgresql-fs",
        title: "PostgreSQL",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        certUrl: "https://www.freecodecamp.org/learn/relational-database/",
        certLabel: "freeCodeCamp: Relational Databases",
        topics: [{ id: "postgresql-topic-fs", title: "PostgreSQL Fundamentals", description: "Schema design and SQL querying.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" }],
      },
      {
        id: "jwt-auth-fs",
        title: "JWT Auth",
        videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/",
        topics: [{ id: "jwt-auth-topic-fs", title: "JWT Authentication", description: "Stateless token-based authentication.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" }],
      },
      {
        id: "redis-fs",
        title: "Redis",
        videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/",
        topics: [{ id: "checkpoint-complete-app", title: "Checkpoint — Complete App", description: "Add caching to a working full-stack app.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" }],
      },
      {
        id: "linux-basics-fs",
        title: "Linux Basics",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [{ id: "linux-basics-topic-fs", title: "Linux Fundamentals", description: "The command line and filesystem you'll deploy onto.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" }],
      },
      {
        id: "aws-basic-services",
        title: "Basic AWS Services",
        videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
        topics: [
          { id: "ec2", title: "EC2", description: "Virtual servers in the cloud.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "vpc", title: "VPC", description: "Isolated virtual networks within AWS.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "s3-fs", title: "S3", description: "Object storage for files and static assets.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "route53", title: "Route53", description: "AWS's managed DNS service.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "ses", title: "SES", description: "AWS's transactional email service.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "checkpoint-deployment", title: "Checkpoint — Deployment", description: "Deploy your app to a live AWS server.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
        ],
      },
      {
        id: "monit",
        title: "Monit",
        topics: [{ id: "checkpoint-monitoring", title: "Checkpoint — Monitoring", description: "Set up basic uptime/process monitoring for your server." }],
      },
      {
        id: "github-actions-fs",
        title: "GitHub Actions",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
        topics: [{ id: "checkpoint-cicd", title: "Checkpoint — CI / CD", description: "Automate tests and deploys on every push.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs" }],
      },
      {
        id: "ansible-fs",
        title: "Ansible",
        videoUrl: "https://www.youtube.com/watch?v=klbi1_ponvw",
        topics: [{ id: "checkpoint-automation", title: "Checkpoint — Automation", description: "Automate server configuration with a playbook.", videoUrl: "https://www.youtube.com/watch?v=klbi1_ponvw" }],
      },
      {
        id: "terraform-fs",
        title: "Terraform",
        videoUrl: "https://www.freecodecamp.org/news/learn-terraform-and-aws-by-building-a-dev-environment/",
        topics: [{ id: "checkpoint-infrastructure", title: "Checkpoint — Infrastructure", description: "Define your infrastructure as code.", videoUrl: "https://www.freecodecamp.org/news/learn-terraform-and-aws-by-building-a-dev-environment/" }],
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
    tagline: "The exact roadmap.sh DevOps path — OS fundamentals through cloud design patterns.",
    heroVideoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
    heroVideoLabel: "freeCodeCamp: DevOps Courses Playlist",
    heroCertUrl: "https://www.coursera.org/professional-certificates/sre-devops-engineer-google-cloud",
    heroCertLabel: "Google Cloud: DevOps Engineer Professional Certificate",
    sections: [
      {
        id: "programming-language-devops",
        title: "Learn a Programming Language",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [
          { id: "python-devops", title: "Python", description: "The most common scripting language for automation.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/" },
          { id: "ruby-devops", title: "Ruby", description: "Used by tools like Chef for configuration management.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "go-devops", title: "Go", description: "The language behind Docker, Kubernetes, and Terraform.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "rust-devops", title: "Rust", description: "Increasingly used for performance-critical infra tools.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "nodejs-devops", title: "JavaScript / Node.js", description: "Used for many CLI tools and automation scripts.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
        ],
      },
      {
        id: "operating-system",
        title: "Operating System",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [
          { id: "windows-devops", title: "Windows", description: "Server administration on the Windows platform." },
          {
            id: "unix", title: "Unix", description: "The BSD family of Unix operating systems.",
            subtopics: [
              { id: "freebsd", title: "FreeBSD", description: "A widely used Unix-derived OS." },
              { id: "openbsd", title: "OpenBSD", description: "A security-focused BSD variant." },
              { id: "netbsd", title: "NetBSD", description: "A highly portable BSD variant." },
            ],
          },
          {
            id: "linux-devops", title: "Linux", description: "The dominant OS family for servers.",
            videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
            subtopics: [
              { id: "ubuntu-debian", title: "Ubuntu / Debian", description: "The most widely deployed Linux distro family.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
              { id: "suse-linux", title: "SUSE Linux", description: "An enterprise-focused Linux distribution." },
              { id: "rhel-derivatives", title: "RHEL / Derivatives", description: "Red Hat Enterprise Linux and its derivatives (CentOS, Rocky, Alma)." },
            ],
          },
        ],
      },
      {
        id: "terminal-knowledge",
        title: "Terminal Knowledge",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [
          {
            id: "scripting-devops", title: "Scripting", description: "Automating repetitive shell tasks.",
            videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
            subtopics: [
              { id: "bash", title: "Bash", description: "The default shell on most Linux systems.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
              { id: "powershell", title: "Power Shell", description: "Microsoft's object-oriented shell and scripting language." },
            ],
          },
          {
            id: "editors-devops", title: "Editors", description: "Terminal-based text editors used on remote servers.",
            subtopics: [{ id: "vim-nano-emacs", title: "Vim / Nano / Emacs", description: "The classic terminal editors." }],
          },
          { id: "process-monitoring", title: "Process Monitoring", description: "Watching what's running on a machine." },
          { id: "performance-monitoring-devops", title: "Performance Monitoring", description: "CPU, memory, and disk usage from the terminal." },
          { id: "networking-tools", title: "Networking Tools", description: "curl, dig, netstat, and friends." },
          { id: "text-manipulation", title: "Text Manipulation", description: "grep, sed, awk for processing logs and output." },
        ],
      },
      {
        id: "vcs-devops",
        title: "Version Control Systems",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [{ id: "git-devops", title: "Git", description: "Tracking infrastructure-as-code and scripts.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" }],
      },
      {
        id: "vcs-hosting-devops",
        title: "VCS Hosting",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [
          { id: "github-devops", title: "GitHub", description: "The most widely used Git hosting platform.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
          { id: "gitlab-devops", title: "GitLab", description: "A self-hostable Git platform with built-in CI/CD.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
          { id: "bitbucket-devops", title: "Bitbucket", description: "Atlassian's Git hosting, integrated with Jira.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
        ],
      },
      {
        id: "containers",
        title: "Containers",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        topics: [
          { id: "docker-devops", title: "Docker", description: "The standard container runtime and image format.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
          { id: "lxc-devops", title: "LXC", description: "Linux Containers — OS-level virtualization.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
        ],
      },
      {
        id: "reverse-proxy-setup",
        title: "What is and how to setup X?",
        videoUrl: "https://www.freecodecamp.org/news/nginx/",
        topics: [
          { id: "forward-proxy", title: "Forward Proxy", description: "A proxy acting on behalf of clients.", videoUrl: "https://www.freecodecamp.org/news/nginx/" },
          { id: "reverse-proxy", title: "Reverse Proxy", description: "A proxy acting on behalf of servers.", videoUrl: "https://www.freecodecamp.org/news/nginx/" },
          { id: "caching-server-devops", title: "Caching Server", description: "A dedicated layer for caching responses.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
          { id: "firewall-devops", title: "Firewall", description: "Controlling inbound/outbound traffic to a server." },
          { id: "load-balancer-devops", title: "Load Balancer", description: "Distributing traffic across multiple servers." },
          {
            id: "web-server-devops", title: "Web Server", description: "Serving HTTP traffic to clients.",
            videoUrl: "https://www.freecodecamp.org/news/nginx/",
            subtopics: [
              { id: "nginx-devops", title: "Nginx", description: "A high-performance web server and reverse proxy.", videoUrl: "https://www.freecodecamp.org/news/nginx/" },
              { id: "caddy-devops", title: "Caddy", description: "A web server with automatic HTTPS.", videoUrl: "https://www.freecodecamp.org/news/nginx/" },
              { id: "tomcat", title: "Tomcat", description: "A Java servlet container and web server." },
              { id: "apache-devops", title: "Apache", description: "A long-standing, widely deployed web server.", videoUrl: "https://www.freecodecamp.org/news/nginx/" },
              { id: "iis-devops", title: "IIS", description: "Microsoft's web server for Windows/.NET stacks." },
            ],
          },
        ],
      },
      {
        id: "networking-protocols",
        title: "Networking & Protocols",
        topics: [
          { id: "ftp-sftp", title: "FTP / SFTP", description: "File transfer protocols." },
          { id: "dns-devops", title: "DNS", description: "Resolving domain names to IP addresses." },
          { id: "http-devops", title: "HTTP", description: "The protocol underlying web traffic." },
          { id: "https-devops", title: "HTTPS", description: "Encrypted HTTP." },
          { id: "ssl-tls-devops", title: "SSL / TLS", description: "The encryption protocols behind HTTPS." },
          { id: "ssh-devops", title: "SSH", description: "Secure remote shell access." },
          { id: "osi-model-devops", title: "OSI Model", description: "The seven-layer conceptual networking model." },
          {
            id: "email-protocols", title: "Email Protocols", description: "How mail servers send, receive, and authenticate mail.",
            subtopics: [
              { id: "white-grey-listing", title: "White / Grey Listing", description: "Spam-filtering allow/deny strategies." },
              { id: "smtp", title: "SMTP", description: "The protocol for sending email." },
              { id: "dmarc", title: "DMARC", description: "Email authentication policy enforcement." },
              { id: "imap", title: "IMAP", description: "A protocol for retrieving email, keeping it on the server." },
              { id: "spf", title: "SPF", description: "A DNS record authorizing senders for a domain." },
              { id: "pop3s", title: "POP3S", description: "A secure protocol for downloading email." },
              { id: "domain-keys", title: "Domain Keys", description: "An email signing standard, predecessor to DKIM." },
            ],
          },
        ],
      },
      {
        id: "cloud-providers",
        title: "Cloud Providers",
        videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
        topics: [
          { id: "aws-devops", title: "AWS", description: "The largest public cloud provider.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "azure-devops", title: "Azure", description: "Microsoft's public cloud platform." },
          { id: "google-cloud-devops", title: "Google Cloud", description: "Google's public cloud platform." },
          { id: "digital-ocean", title: "Digital Ocean", description: "A simpler, developer-friendly cloud provider." },
          { id: "alibaba-cloud", title: "Alibaba Cloud", description: "The leading cloud provider in China." },
          { id: "hetzner", title: "Hetzner", description: "A budget-friendly European cloud/dedicated server provider." },
          { id: "contabo", title: "Contabo", description: "A low-cost VPS and dedicated server provider." },
          { id: "heroku", title: "Heroku", description: "A simple PaaS for deploying apps quickly." },
        ],
      },
      {
        id: "serverless-devops",
        title: "Serverless",
        topics: [
          { id: "aws-lambda", title: "AWS Lambda", description: "Amazon's function-as-a-service platform." },
          { id: "cloudflare-devops", title: "Cloudflare", description: "Edge functions and workers." },
          { id: "azure-functions", title: "Azure Functions", description: "Microsoft's function-as-a-service platform." },
          { id: "vercel-devops", title: "Vercel", description: "Serverless functions built into a frontend deploy platform." },
          { id: "netlify", title: "Netlify", description: "Serverless functions built into a static-site deploy platform." },
          { id: "gcp-functions", title: "GCP Functions", description: "Google's function-as-a-service platform." },
        ],
      },
      {
        id: "provisioning",
        title: "Provisioning",
        videoUrl: "https://www.freecodecamp.org/news/learn-terraform-and-aws-by-building-a-dev-environment/",
        topics: [
          { id: "aws-cdk", title: "AWS CDK", description: "Defining AWS infrastructure using real programming languages." },
          { id: "cloudformation", title: "CloudFormation", description: "AWS's native infrastructure-as-code service." },
          { id: "pulumi", title: "Pulumi", description: "Infrastructure as code using general-purpose languages." },
          { id: "terraform-devops", title: "Terraform", description: "The most widely used cloud-agnostic IaC tool.", videoUrl: "https://www.freecodecamp.org/news/learn-terraform-and-aws-by-building-a-dev-environment/" },
        ],
      },
      {
        id: "configuration-management",
        title: "Configuration Management",
        videoUrl: "https://www.youtube.com/watch?v=klbi1_ponvw",
        topics: [
          { id: "ansible-devops", title: "Ansible", description: "Agentless configuration management over SSH.", videoUrl: "https://www.youtube.com/watch?v=klbi1_ponvw" },
          { id: "chef", title: "Chef", description: "Configuration management using a Ruby DSL." },
          { id: "puppet", title: "Puppet", description: "Declarative configuration management at scale." },
        ],
      },
      {
        id: "cicd-tools",
        title: "CI / CD Tools",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
        topics: [
          { id: "teamcity", title: "TeamCity", description: "JetBrains' CI/CD server." },
          { id: "jenkins", title: "Jenkins", description: "The long-standing, highly extensible CI/CD server.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs" },
          { id: "gitlab-ci", title: "GitLab CI", description: "CI/CD built into GitLab.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs" },
          { id: "circle-ci", title: "Circle CI", description: "A cloud-native CI/CD platform." },
          { id: "octopus-deploy", title: "Octopus Deploy", description: "A deployment automation tool for release pipelines." },
          { id: "github-actions-devops", title: "GitHub Actions", description: "CI/CD built into GitHub.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs" },
        ],
      },
      {
        id: "infrastructure-monitoring",
        title: "Infrastructure Monitoring",
        videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo",
        topics: [
          { id: "prometheus-devops", title: "Prometheus", description: "A metrics collection and alerting system.", videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo" },
          { id: "grafana-devops", title: "Grafana", description: "Dashboards for visualizing metrics.", videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo" },
          { id: "zabbix", title: "Zabbix", description: "An open-source infrastructure monitoring platform." },
          { id: "datadog-devops", title: "Datadog", description: "A commercial full-stack observability platform." },
        ],
      },
      {
        id: "secret-management",
        title: "Secret Management",
        topics: [
          { id: "sealed-secrets", title: "Sealed Secrets", description: "Encrypting Kubernetes secrets for safe storage in Git." },
          { id: "vault", title: "Vault", description: "HashiCorp's secrets management tool." },
          { id: "sops", title: "SOPs", description: "Encrypting values inside structured config files." },
          { id: "cloud-specific-secret-tools", title: "Cloud Specific Tools", description: "Native secret managers offered by each cloud provider." },
        ],
      },
      {
        id: "logs-management",
        title: "Logs Management",
        topics: [
          { id: "papertrail", title: "Papertrail", description: "A hosted log aggregation service." },
          { id: "splunk", title: "Splunk", description: "An enterprise log analytics platform." },
          { id: "loki", title: "Loki", description: "Grafana's log aggregation system." },
          { id: "elastic-stack", title: "Elastic Stack", description: "Elasticsearch, Logstash, and Kibana for log search and visualization." },
          { id: "graylog", title: "Graylog", description: "An open-source log management platform." },
        ],
      },
      {
        id: "container-orchestration",
        title: "Container Orchestration",
        videoUrl: "https://www.freecodecamp.org/news/course-on-docker-and-kubernetes/",
        topics: [
          { id: "gke-eks-aks", title: "GKE / EKS / AKS", description: "Managed Kubernetes offerings from GCP, AWS, and Azure.", videoUrl: "https://www.freecodecamp.org/news/course-on-docker-and-kubernetes/" },
          { id: "ecs-fargate", title: "AWS ECS / Fargate", description: "AWS's own container orchestration services." },
          { id: "docker-swarm", title: "Docker Swarm", description: "Docker's built-in orchestration mode." },
          { id: "kubernetes-devops", title: "Kubernetes", description: "The dominant container orchestration platform.", videoUrl: "https://www.freecodecamp.org/news/course-on-docker-and-kubernetes/" },
        ],
      },
      {
        id: "application-monitoring",
        title: "Application Monitoring",
        videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo",
        topics: [
          { id: "jaeger", title: "Jaeger", description: "Distributed tracing for microservices." },
          { id: "new-relic", title: "New Relic", description: "A commercial application performance monitoring platform." },
          { id: "datadog-app", title: "Datadog", description: "Application-level metrics and tracing.", videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo" },
          { id: "prometheus-app", title: "Prometheus", description: "Application metrics collection.", videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo" },
          { id: "opentelemetry", title: "OpenTelemetry", description: "A vendor-neutral observability instrumentation standard." },
        ],
      },
      {
        id: "artifact-management",
        title: "Artifact Management",
        topics: [
          { id: "artifactory", title: "Artifactory", description: "A universal binary/package repository manager." },
          { id: "nexus", title: "Nexus", description: "An alternative artifact repository manager." },
          { id: "cloudsmith", title: "Cloud Smith", description: "A hosted package repository service." },
        ],
      },
      {
        id: "gitops",
        title: "GitOps",
        topics: [
          { id: "argocd", title: "ArgoCD", description: "Declarative GitOps continuous delivery for Kubernetes." },
          { id: "fluxcd", title: "FluxCD", description: "A GitOps toolkit for Kubernetes." },
          {
            id: "service-mesh-devops", title: "Service Mesh", description: "Infrastructure layer for service-to-service traffic.",
            subtopics: [
              { id: "istio", title: "Istio", description: "The most widely used service mesh." },
              { id: "consul", title: "Consul", description: "HashiCorp's service mesh and service discovery tool." },
              { id: "linkerd", title: "Linkerd", description: "A lightweight, simpler service mesh." },
              { id: "envoy", title: "Envoy", description: "The proxy underlying many service mesh implementations." },
            ],
          },
        ],
      },
      {
        id: "cloud-design-patterns",
        title: "Cloud Design Patterns",
        topics: [
          { id: "availability-pattern", title: "Availability", description: "Patterns for keeping systems up despite failures." },
          { id: "data-management-pattern", title: "Data Management", description: "Patterns for consistent, scalable data handling in the cloud." },
          { id: "design-implementation-pattern", title: "Design and Implementation", description: "General cloud application design patterns." },
          { id: "management-monitoring-pattern", title: "Management and Monitoring", description: "Patterns for operating cloud systems reliably." },
        ],
      },
    ],
  },
  "machine-learning": {
    id: "machine-learning",
    label: "Machine Learning",
    tagline: "The exact roadmap.sh Machine Learning path — math foundations through advanced NLP.",
    heroVideoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
    heroVideoLabel: "freeCodeCamp: PyTorch for Deep Learning — Full Course",
    heroCertUrl: "https://www.coursera.org/specializations/machine-learning-introduction",
    heroCertLabel: "Andrew Ng: Machine Learning Specialization",
    sections: [
      {
        id: "introduction-ml",
        title: "Introduction",
        videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/",
        topics: [
          { id: "what-is-ml-engineer", title: "What is an ML Engineer?", description: "Role definition and scope.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "ml-engineer-vs-ai-engineer", title: "ML Engineer vs AI Engineer", description: "How the two roles differ in practice.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
          { id: "ml-skills-responsibilities", title: "Skills and Responsibilities", description: "What an ML engineer is accountable for day to day.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" },
        ],
      },
      {
        id: "math-foundations",
        title: "Mathematical Foundations",
        topics: [
          {
            id: "calculus-ml", title: "Calculus", description: "The math behind gradient-based optimization.",
            videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
            subtopics: [
              { id: "chain-rule", title: "Chain rule of derivation", description: "Differentiating composed functions — the core of backprop.", videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
              { id: "gradient-jacobian-hessian", title: "Gradient, Jacobian, Hessian", description: "Multivariable derivatives used throughout ML.", videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
              { id: "derivatives-partial", title: "Derivatives, Partial Derivatives", description: "The foundation of all gradient-based learning.", videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
            ],
          },
          {
            id: "linear-algebra-ml", title: "Linear Algebra", description: "Vectors, matrices, and the operations models are built from.",
            videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
            subtopics: [
              { id: "scalars-vectors-tensors", title: "Scalars, Vectors, Tensors", description: "The basic data containers in ML math.", videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
              { id: "svd", title: "Singular Value Decomposition", description: "A matrix factorization used in dimensionality reduction.", videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
              { id: "matrix-operations", title: "Matrix & Matrix Operations", description: "Multiplication, transpose, and other core operations.", videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
              { id: "eigenvalues-diagonalization", title: "Eigenvalues, Diagonalization", description: "Used in PCA and understanding transformations.", videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
              { id: "determinants-inverse", title: "Determinants, inverse of Matrix", description: "Core matrix properties used in solving linear systems.", videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
            ],
          },
          { id: "discrete-math", title: "Discrete Mathematics", description: "Logic, combinatorics, and set theory underlying algorithms." },
          {
            id: "statistics-ml", title: "Statistics", description: "The mathematical basis for reasoning about data and uncertainty.",
            videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV",
            subtopics: [
              { id: "basics-probability", title: "Basics of Probability", description: "The foundation for every ML model's uncertainty.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
              {
                id: "descriptive-statistics", title: "Descriptive Statistics", description: "Summarizing data with numbers and charts.",
                videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV",
                subtopics: [
                  { id: "basic-concepts-stats", title: "Basic concepts", description: "Mean, median, mode, and spread.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
                  { id: "graphs-charts", title: "Graphs & Charts", description: "Visualizing distributions.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
                ],
              },
              {
                id: "probability-ml", title: "Probability", description: "Modeling randomness and belief mathematically.",
                videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV",
                subtopics: [
                  { id: "types-of-distribution", title: "Types of Distribution", description: "Normal, binomial, Poisson, and other common distributions.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
                  { id: "random-variances-pdfs", title: "Random Variances, PDFs", description: "Describing outcomes and their probability densities.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
                  { id: "bayes-theorem-ml", title: "Bayes Theorem", description: "Updating beliefs given new evidence.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
                ],
              },
              { id: "inferential-statistics", title: "Inferential Statistics", description: "Drawing conclusions about a population from a sample.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
            ],
          },
        ],
      },
      {
        id: "programming-fundamentals-ml",
        title: "Programming Fundamentals",
        videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/",
        certUrl: "https://www.coursera.org/specializations/python",
        certLabel: "Coursera: Python for Everybody",
        topics: [
          {
            id: "python-ml", title: "Python", description: "The primary language of applied machine learning.",
            videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/",
            subtopics: [
              {
                id: "basic-syntax-ml", title: "Basic Syntax", description: "Core language constructs.",
                subtopics: [
                  { id: "variables-data-types", title: "Variables and Data Types", description: "Python's built-in types." },
                  { id: "conditionals-ml", title: "Conditionals", description: "Branching logic in Python." },
                  { id: "data-structures-ml", title: "Data Structures", description: "Lists, dicts, sets, and tuples." },
                  { id: "exceptions-ml", title: "Exceptions", description: "Handling errors gracefully." },
                  { id: "functions-builtin", title: "Functions, Builtin Functions", description: "Defining and reusing logic." },
                  { id: "loops-ml", title: "Loops", description: "Iterating over data." },
                ],
              },
              { id: "oop-ml", title: "Object Oriented Programming", description: "Structuring larger ML codebases with classes." },
              {
                id: "essential-libraries", title: "Essential libraries", description: "The core scientific Python stack.",
                videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/",
                subtopics: [
                  { id: "numpy-ml", title: "Numpy", description: "Fast numerical arrays and vectorized math.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/" },
                  { id: "pandas-ml", title: "Pandas", description: "Tabular data manipulation.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/" },
                  { id: "matplotlib-ml", title: "Matplotlib", description: "Plotting and visualization.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/" },
                  { id: "seaborn-ml", title: "Seaborn", description: "Statistical visualization built on Matplotlib.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/" },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "data-collection-ml",
        title: "Data Collection",
        topics: [
          {
            id: "data-sources-ml", title: "Data Sources", description: "Where training data actually comes from.",
            subtopics: [
              { id: "databases-ml-source", title: "Databases (SQL, No-SQL)", description: "Structured data already stored in a system." },
              { id: "internet-apis-ml", title: "Internet APIs", description: "Pulling data from public or third-party APIs." },
              { id: "mobile-apps-ml", title: "Mobile Apps", description: "Data generated by app usage." },
              { id: "iot-ml", title: "IoT", description: "Sensor data from connected devices." },
            ],
          },
          {
            id: "data-formats-ml", title: "Data Formats", description: "How raw data is typically stored.",
            subtopics: [
              { id: "json-ml", title: "JSON", description: "A common semi-structured data format." },
              { id: "csv-ml", title: "CSV", description: "A simple tabular text format." },
              { id: "parquet-ml", title: "Parquet", description: "A columnar storage format optimized for analytics." },
              { id: "excel-ml", title: "Excel", description: "Spreadsheet-based data, common in business contexts." },
              { id: "other-data-formats", title: "Other Data Formats", description: "Avro, ORC, and other specialized formats." },
            ],
          },
        ],
      },
      {
        id: "data-cleaning-ml",
        title: "Data Cleaning",
        topics: [
          {
            id: "preprocessing-techniques", title: "Preprocessing Techniques", description: "Getting raw data ready for modeling.",
            subtopics: [
              { id: "data-cleaning-topic", title: "Data Cleaning", description: "Handling missing values, duplicates, and errors." },
              { id: "dimensionality-reduction-ml", title: "Dimensionality Reduction", description: "Reducing feature count while preserving signal." },
              { id: "feature-engineering", title: "Feature Engineering", description: "Creating new, more predictive input features." },
              { id: "feature-selection", title: "Feature Selection", description: "Choosing the most useful subset of features." },
              { id: "feature-scaling-normalization", title: "Feature Scaling & Normalization", description: "Putting features on comparable numeric scales." },
            ],
          },
        ],
      },
      {
        id: "ml-types",
        title: "Machine Learning",
        topics: [
          { id: "what-is-ml", title: "What is Machine Learning?", description: "Learning patterns from data instead of hardcoding rules." },
          {
            id: "types-of-ml", title: "Types of Machine Learning", description: "The major learning paradigms.",
            subtopics: [
              { id: "unsupervised-learning-type", title: "Unsupervised Learning", description: "Finding structure in unlabeled data." },
              { id: "semi-supervised-learning", title: "Semi-supervised Learning", description: "Learning from a mix of labeled and unlabeled data." },
              { id: "supervised-learning-type", title: "Supervised Learning", description: "Learning from labeled input/output pairs.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
              { id: "reinforcement-learning-type", title: "Reinforcement Learning", description: "Learning by trial and error via rewards.", videoUrl: "https://www.freecodecamp.org/news/use-openai-gymnasium-for-reinforcement-learning/" },
              { id: "self-supervised-learning", title: "Self-supervised Learning", description: "Generating labels from the data itself." },
            ],
          },
        ],
      },
      {
        id: "supervised-learning-section",
        title: "Supervised Learning",
        videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A",
        certUrl: "https://www.coursera.org/specializations/machine-learning-introduction",
        certLabel: "Andrew Ng: Machine Learning Specialization",
        topics: [
          { id: "what-is-supervised-learning", title: "What is Supervised Learning?", description: "Mapping inputs to known outputs.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
          {
            id: "classification-ml", title: "Classification", description: "Predicting a discrete category.",
            videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A",
            subtopics: [
              { id: "logistic-regression", title: "Logistic Regression", description: "A linear model for binary classification.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
              { id: "svm", title: "Support Vector Machines", description: "Finding the maximum-margin separating boundary.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
              { id: "knn", title: "K-Nearest Neighbors (KNN)", description: "Classifying by the majority label of nearby points.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
              { id: "gradient-boosting-machines", title: "Gradient Boosting Machines", description: "Ensembles of weak learners trained sequentially.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
              { id: "decision-trees-rf", title: "Decision Trees, Random Forest", description: "Tree-based models and their ensemble.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
            ],
          },
          {
            id: "regression-ml", title: "Regression", description: "Predicting a continuous value.",
            videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A",
            subtopics: [
              { id: "linear-regression", title: "Linear Regression", description: "Fitting a straight-line relationship.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
              { id: "polynomial-regression", title: "Polynomial Regression", description: "Fitting curved relationships.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
              { id: "lasso", title: "Lasso", description: "L1-regularized regression that can zero out features.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
              { id: "ridge", title: "Ridge", description: "L2-regularized regression.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
              { id: "elasticnet", title: "ElasticNet Regularization", description: "Combining L1 and L2 regularization.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
            ],
          },
        ],
      },
      {
        id: "unsupervised-learning-section",
        title: "Unsupervised Learning",
        videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A",
        topics: [
          { id: "what-is-unsupervised-learning", title: "What is Unsupervised Learning?", description: "Finding patterns without labels.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
          {
            id: "dimensionality-reduction-section", title: "Dimensionality Reduction", description: "Compressing features while preserving structure.",
            subtopics: [
              { id: "pca", title: "Principal Component Analysis", description: "Projecting data onto its highest-variance directions." },
              { id: "autoencoders", title: "Autoencoders", description: "Neural networks that learn compressed representations." },
            ],
          },
          {
            id: "clustering-ml", title: "Clustering", description: "Grouping similar data points together.",
            subtopics: [
              { id: "overlapping-clustering", title: "Overlapping", description: "Clusters that can share members." },
              { id: "hierarchical-clustering", title: "Hierarchical", description: "Nested clusters built via merging or splitting." },
              { id: "exclusive-clustering", title: "Exclusive", description: "Each point belongs to exactly one cluster." },
              { id: "probabilistic-clustering", title: "Probabilistic", description: "Soft cluster assignment based on probability." },
            ],
          },
        ],
      },
      {
        id: "reinforcement-learning-section",
        title: "Reinforcement Learning",
        videoUrl: "https://www.freecodecamp.org/news/use-openai-gymnasium-for-reinforcement-learning/",
        topics: [
          { id: "what-is-rl", title: "What is Reinforcement Learning?", description: "Learning a policy through rewards and penalties.", videoUrl: "https://www.freecodecamp.org/news/use-openai-gymnasium-for-reinforcement-learning/" },
          { id: "policy-gradient", title: "Policy Gradient", description: "Directly optimizing the policy function.", videoUrl: "https://www.freecodecamp.org/news/use-openai-gymnasium-for-reinforcement-learning/" },
          { id: "actor-critic", title: "Actor-Critic Methods", description: "Combining value estimation with policy optimization.", videoUrl: "https://www.freecodecamp.org/news/intro-to-advanced-actor-critic-methods-reinforcement-learning-course/" },
          { id: "deep-q-networks", title: "Deep-Q Networks", description: "Combining Q-learning with deep neural networks.", videoUrl: "https://www.freecodecamp.org/news/use-openai-gymnasium-for-reinforcement-learning/" },
          { id: "q-learning", title: "Q-Learning", description: "Learning action values through experience.", videoUrl: "https://www.freecodecamp.org/news/use-openai-gymnasium-for-reinforcement-learning/" },
        ],
      },
      {
        id: "model-evaluation",
        title: "Model Evaluation",
        topics: [
          { id: "what-is-model-evaluation", title: "What is Model Evaluation?", description: "Measuring how well a model actually performs." },
          { id: "why-important-evaluation", title: "Why is it important?", description: "Avoiding models that look good but fail in production." },
          {
            id: "metrics-to-evaluate", title: "Metrics to Evaluate", description: "The standard quantitative measures of model quality.",
            subtopics: [
              { id: "accuracy-metric", title: "Accuracy", description: "Fraction of correct predictions." },
              { id: "precision-metric", title: "Precision", description: "Of predicted positives, how many were correct." },
              { id: "f1-score", title: "F1-Score", description: "The harmonic mean of precision and recall." },
              { id: "recall-metric", title: "Recall", description: "Of actual positives, how many were found." },
              { id: "roc-auc", title: "ROC-AUC", description: "A threshold-independent classification quality measure." },
              { id: "log-loss", title: "Log Loss", description: "Penalizing confident wrong predictions heavily." },
              { id: "confusion-matrix", title: "Confusion Matrix", description: "A breakdown of prediction outcomes by class." },
            ],
          },
          {
            id: "validation-techniques", title: "Validation Techniques", description: "Estimating real-world performance honestly.",
            subtopics: [
              { id: "loocv", title: "LOOCV", description: "Leave-one-out cross-validation." },
              { id: "k-fold-cv", title: "K-Fold Cross Validation", description: "Splitting data into k folds for repeated evaluation." },
            ],
          },
        ],
      },
      {
        id: "scikit-learn-section",
        title: "Scikit-learn",
        videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A",
        topics: [
          { id: "data-loading-sklearn", title: "Data Loading", description: "Getting data into a usable format.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
          { id: "train-test-data", title: "Train - Test Data", description: "Splitting data to evaluate generalization.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
          { id: "data-preparation-sklearn", title: "Data Preparation", description: "Scaling, encoding, and cleaning before training.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
          { id: "model-selection-sklearn", title: "Model Selection", description: "Choosing the right algorithm for the problem.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
          { id: "tuning-sklearn", title: "Tuning", description: "Hyperparameter search and optimization.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
          { id: "prediction-sklearn", title: "Prediction", description: "Generating outputs from a trained model.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
        ],
      },
      {
        id: "deep-learning-section",
        title: "Deep Learning",
        videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
        certUrl: "https://www.deeplearning.ai/courses/deep-learning-specialization/",
        certLabel: "DeepLearning.AI: Deep Learning Specialization",
        topics: [
          {
            id: "nn-basics", title: "Neural Network (NN) Basics", description: "The building blocks of every deep learning model.",
            videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
            subtopics: [
              { id: "forward-propagation", title: "Forward propagation", description: "Computing a network's output from its input.", videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY" },
              { id: "back-propagation", title: "Back Propagation", description: "Computing gradients to update weights.", videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY" },
              { id: "perceptron-mlp", title: "Perceptron, Multi-layer Perceptrons", description: "The simplest neural network building blocks.", videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY" },
              { id: "activation-functions", title: "Activation Functions", description: "Introducing non-linearity into a network.", videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY" },
              { id: "loss-functions", title: "Loss Functions", description: "Measuring how wrong a prediction is.", videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY" },
            ],
          },
          {
            id: "dl-libraries", title: "Deep Learning Libraries", description: "The frameworks used to build and train networks.",
            videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
            subtopics: [
              { id: "tensorflow-ml", title: "TensorFlow", description: "Google's deep learning framework." },
              { id: "keras", title: "Keras", description: "A high-level API for building neural networks." },
              { id: "sklearn-dl", title: "Scikit-learn", description: "Also usable for simpler neural network models.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" },
              { id: "pytorch-ml", title: "PyTorch", description: "The most widely used research-friendly DL framework.", videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY" },
            ],
          },
          {
            id: "dl-architectures", title: "Deep Learning Architectures", description: "The major neural network designs.",
            videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
            subtopics: [
              {
                id: "cnn", title: "Convolutional Neural Network", description: "The standard architecture for image data.",
                videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
                subtopics: [
                  { id: "pooling", title: "Pooling", description: "Downsampling feature maps." },
                  { id: "padding", title: "Padding", description: "Preserving spatial dimensions during convolution." },
                  { id: "convolution", title: "Convolution", description: "Sliding filters across an input." },
                  { id: "strides", title: "Strides", description: "How far a filter moves each step." },
                  {
                    id: "cnn-applications", title: "Applications of CNNs", description: "Where CNNs are actually used.",
                    subtopics: [
                      { id: "image-classification", title: "Image Classification", description: "Assigning a label to an entire image." },
                      { id: "image-segmentation", title: "Image Segmentation", description: "Labeling every pixel of an image." },
                      { id: "image-video-recognition", title: "Image & Video Recognition", description: "Identifying objects across frames." },
                      { id: "recommendation-systems-cnn", title: "Recommendation Systems", description: "Using visual features to recommend items." },
                    ],
                  },
                ],
              },
              {
                id: "rnn", title: "Recurrent Neural Networks", description: "Architectures for sequential data.",
                subtopics: [
                  { id: "rnn-basic", title: "RNN", description: "The base recurrent architecture." },
                  { id: "gru", title: "GRU", description: "A simplified gated recurrent unit." },
                  { id: "lstm", title: "LSMT", description: "Long short-term memory networks for longer sequences." },
                ],
              },
              {
                id: "attention-mechanisms", title: "Attention Mechanisms", description: "How modern models decide what to focus on.",
                videoUrl: "https://www.youtube.com/watch?v=eMlx5fFNoYc",
                subtopics: [
                  { id: "self-attention", title: "Self-Attention", description: "Relating every token to every other token.", videoUrl: "https://www.youtube.com/watch?v=eMlx5fFNoYc" },
                  { id: "transformers-ml", title: "Transformers", description: "The architecture behind modern LLMs.", videoUrl: "https://www.youtube.com/watch?v=eMlx5fFNoYc" },
                  { id: "multihead-attention", title: "Multi-head Attention", description: "Running several attention computations in parallel.", videoUrl: "https://www.youtube.com/watch?v=eMlx5fFNoYc" },
                ],
              },
              { id: "autoencoders-dl", title: "Autoencoders", description: "Networks that learn to compress and reconstruct input." },
              { id: "gans", title: "Generative Adversarial Networks", description: "Two networks competing to generate realistic data." },
            ],
          },
        ],
      },
      {
        id: "advanced-ml-concepts",
        title: "Advanced Concepts in ML",
        topics: [
          {
            id: "nlp-ml", title: "Natural Language Processing", description: "Teaching models to understand and generate human language.",
            videoUrl: "https://www.youtube.com/watch?v=H9yC8Hq0tHk",
            subtopics: [
              { id: "tokenization", title: "Tokenization", description: "Splitting text into model-readable units.", videoUrl: "https://www.youtube.com/watch?v=H9yC8Hq0tHk" },
              { id: "lemmatization", title: "Lemmatization", description: "Reducing words to their dictionary base form.", videoUrl: "https://www.youtube.com/watch?v=H9yC8Hq0tHk" },
              { id: "stemming", title: "Stemming", description: "Crudely trimming words to a root form.", videoUrl: "https://www.youtube.com/watch?v=H9yC8Hq0tHk" },
              { id: "embeddings-nlp", title: "Embeddings", description: "Vector representations of words and text.", videoUrl: "https://www.youtube.com/watch?v=H9yC8Hq0tHk" },
              { id: "attention-models-nlp", title: "Attention Models", description: "The mechanism behind modern language understanding.", videoUrl: "https://www.youtube.com/watch?v=eMlx5fFNoYc" },
            ],
          },
          { id: "explainable-ai", title: "Explainable AI", description: "Understanding why a model made a particular prediction." },
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
    heroCertUrl: "https://www.scholarhat.com/free-course/software-architecture-and-system-design-course",
    heroCertLabel: "ScholarHat: Software Architecture & System Design (Free Certificate)",
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
    heroCertUrl: "https://docs.github.com/en/get-started/showcase-your-expertise-with-github-certifications/about-github-certifications",
    heroCertLabel: "GitHub Foundations Certification",
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
  "data-analyst": {
    id: "data-analyst",
    label: "Data Analyst",
    tagline: "The exact roadmap.sh Data Analyst path — foundations through career development.",
    heroVideoUrl: "https://www.youtube.com/watch?v=e6QD8lP-m6E",
    heroVideoLabel: "freeCodeCamp: Power BI Full Course Tutorial",
    heroCertUrl: "https://www.coursera.org/professional-certificates/google-data-analytics",
    heroCertLabel: "Google Data Analytics Professional Certificate",
    sections: [
      {
        id: "introduction-da",
        title: "Introduction",
        topics: [
          { id: "what-is-data-analytics", title: "What is Data Analytics", description: "Extracting insight from raw data." },
          {
            id: "types-of-data-analytics", title: "Types of Data Analytics", description: "The four levels of analytical maturity.",
            subtopics: ["Descriptive Analytics", "Diagnostic Analytics", "Predictive Analytics", "Prescriptive Analytics"],
          },
          {
            id: "key-concepts-data", title: "Key Concepts of Data", description: "The full analytics pipeline.",
            subtopics: ["Collection", "Cleanup", "Exploration", "Visualisation", "Statistical Analysis", "Machine Learning"],
          },
        ],
      },
      {
        id: "strong-foundation-da",
        title: "Building a Strong Foundation",
        videoUrl: "https://www.freecodecamp.org/news/learn-microsoft-excel/",
        topics: [
          {
            id: "excel-da", title: "Analysis / Reporting with Excel", description: "The most common entry point into data analysis.",
            videoUrl: "https://www.freecodecamp.org/news/learn-microsoft-excel/",
            subtopics: [
              { id: "excel-functions-da", title: "Learn Common Functions", description: "IF, DATEDIF, VLOOKUP/HLOOKUP, and more.", videoUrl: "https://www.freecodecamp.org/news/learn-excel-formulas-and-functions/",
                subtopics: ["IF", "DATEDIF", "VLOOKUP / HLOOKUP", "REPLACE / SUBSTITUTE", "UPPER / LOWER / PROPER", "CONCAT", "TRIM", "AVERAGE", "COUNT", "SUM", "MIN / MAX"] },
              { id: "charting-da", title: "Charting", description: "Visualizing data directly in Excel.", videoUrl: "https://www.freecodecamp.org/news/excel-for-data-visualization/" },
              { id: "pivot-tables", title: "Pivot Tables", description: "Summarizing large datasets interactively.", videoUrl: "https://www.freecodecamp.org/news/learn-microsoft-excel/" },
            ],
          },
          { id: "sql-da", title: "Learn SQL", description: "Querying relational data.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          {
            id: "programming-skills-da", title: "Gain Programming Skills", description: "Scripting analysis instead of doing it by hand.",
            subtopics: [
              { id: "lang-da", title: "Learn a Programming Lang.", description: "Python or R.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/", subtopics: ["Python", "R"] },
              { id: "data-manipulation-libs", title: "Data Manipulation Libraries", description: "Pandas and Dplyr.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/", subtopics: ["Pandas", "Dplyr"] },
              { id: "data-viz-libs-da", title: "Data Visualisation Libraries", description: "Matplotlib and Ggplot2.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/", subtopics: ["Matplotlib", "Ggplot2"] },
            ],
          },
        ],
      },
      {
        id: "data-handling-da",
        title: "Mastering Data Handling",
        topics: [
          { id: "data-collection-da", title: "Data Collection", description: "Where analytical data comes from.", subtopics: ["Databases", "CSV Files", "APIs", "Web Scraping"] },
          { id: "data-cleanup-da", title: "Data Cleanup", description: "Making raw data trustworthy.", subtopics: ["Handling Missing Data", "Removing Duplicates", "Finding Outliers", "Data Transformation", "Using Libraries for Cleanup (Pandas, Dplyr)"] },
        ],
      },
      {
        id: "analysis-techniques-da",
        title: "Data Analysis Techniques",
        videoUrl: "https://www.freecodecamp.org/news/tableau-for-data-science-and-data-visualization-crash-course/",
        topics: [
          { id: "descriptive-analysis-da", title: "Descriptive Analysis", description: "Summarizing what happened.", subtopics: ["Central Tendency (Mean, Median, Mode, Average)", "Dispersion (Range, Variance, STD)", "Distribution Space (Skewness, Kurtosis)", "Generating Statistics", "Visualizing Distributions"] },
          {
            id: "data-visualisation-da", title: "Data Visualisation", description: "Turning numbers into understanding.",
            videoUrl: "https://www.freecodecamp.org/news/tableau-for-data-science-and-data-visualization-crash-course/",
            subtopics: [
              { id: "bi-tools-da", title: "Tools", description: "Tableau and Power BI.", videoUrl: "https://www.youtube.com/watch?v=e6QD8lP-m6E", subtopics: ["Tableau", "Power BI"] },
              { id: "viz-libraries-da", title: "Libraries", description: "Matplotlib, Seaborn, ggplot2.", subtopics: ["Matplotlib", "Seaborn", "ggplot2"] },
              { id: "charting-types-da", title: "Charting", description: "The standard chart types.", subtopics: ["Bar Charts", "Line Chart", "Scatter Plot", "Funnel Charts", "Histograms", "Stacked Charts", "Heatmap", "Pie Charts"] },
            ],
          },
          { id: "statistical-analysis-da", title: "Statistical Analysis", description: "Testing whether patterns are real.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV", subtopics: ["Hypothesis Testing", "Correlation Analysis", "Regression"] },
        ],
      },
      {
        id: "advanced-topics-da",
        title: "Advanced Topics",
        topics: [
          { id: "ml-da", title: "Machine Learning", description: "Predictive modeling beyond descriptive stats.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A", subtopics: ["Reinforcement, Unsupervised, Supervised Learning", "Popular ML Algorithms (Decision Trees, Naive Bayes, K-Means, KNN, Logistic Regression)", "Model Evaluation Techniques"] },
          { id: "big-data-da", title: "Big Data Technologies", description: "Handling data too large for a single machine.", subtopics: ["Big Data Concepts", "Data Storage Solutions", "Data Processing Frameworks (Hadoop, Spark)", "MPI / MapReduce", "Parallel Processing"] },
          { id: "deep-learning-da", title: "Deep Learning (Optional)", description: "Neural approaches to analytics problems.", videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY", subtopics: ["Neural Networks, CNNs, RNN", "TensorFlow, PyTorch", "Image Recognition, NLP practice"] },
        ],
      },
      {
        id: "career-da",
        title: "Career Development",
        topics: [
          { id: "portfolio-da", title: "Build a portfolio of projects", description: "Demonstrable proof of analytical skill." },
          { id: "kaggle-da", title: "Participate in Kaggle Competitions", description: "Benchmark your skills against a real community." },
          { id: "courses-certs-da", title: "Online Courses and Certifications", description: "Structured, credentialed learning.", certUrl: "https://www.coursera.org/professional-certificates/google-data-analytics", certLabel: "Google Data Analytics Professional Certificate" },
          { id: "stay-updated-da", title: "Stay Updated and Network", description: "Data tooling moves fast — community keeps you current." },
        ],
      },
    ],
  },
  "data-engineer": {
    id: "data-engineer",
    label: "Data Engineer",
    tagline: "The exact roadmap.sh Data Engineer path — lifecycle through governance and privacy.",
    heroVideoUrl: "https://www.youtube.com/watch?v=PHsC_t0j1dU",
    heroVideoLabel: "freeCodeCamp: Data Engineering Course for Beginners",
    heroCertUrl: "https://www.freecodecamp.org/news/prepare-for-the-databricks-data-engineer-associate-certification-exam-and-pass/",
    heroCertLabel: "freeCodeCamp: Databricks Data Engineer Associate Prep",
    sections: [
      {
        id: "introduction-de",
        title: "Introduction",
        videoUrl: "https://www.youtube.com/watch?v=PHsC_t0j1dU",
        topics: [
          { id: "what-is-data-engineering", title: "What is Data Engineering?", description: "Building the systems that move and store data.", videoUrl: "https://www.youtube.com/watch?v=PHsC_t0j1dU" },
          { id: "de-vs-ds", title: "Data Engineering vs Data Science", description: "Building pipelines vs extracting insight from them.", videoUrl: "https://www.youtube.com/watch?v=PHsC_t0j1dU" },
          { id: "de-skills-responsibilities", title: "Skills and Responsibilities", description: "What a data engineer actually owns.", videoUrl: "https://www.youtube.com/watch?v=PHsC_t0j1dU" },
          { id: "de-lifecycle-intro", title: "Data Engineering Lifecycle", description: "Generation through serving, end to end.", videoUrl: "https://www.youtube.com/watch?v=PHsC_t0j1dU" },
          { id: "choosing-technologies", title: "Choosing the Right Technologies", description: "Matching tools to actual scale and needs.", videoUrl: "https://www.youtube.com/watch?v=PHsC_t0j1dU" },
        ],
      },
      {
        id: "learn-basics-de",
        title: "Learn the Basics",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [
          { id: "programming-skills-de", title: "Programming Skills", description: "The languages data engineering runs on.", subtopics: ["Python", "Java", "Scala", "Go"], videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/" },
          { id: "dsa-de", title: "Data Structures and Algorithms", description: "Efficient processing at scale.", videoUrl: "https://www.freecodecamp.org/news/learn-data-structures-and-algorithms/" },
          { id: "git-github-de", title: "Git and GitHub", description: "Versioning pipeline code.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
          { id: "linux-basics-de", title: "Linux Basics", description: "The OS most data infrastructure runs on.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
          { id: "networking-fundamentals-de", title: "Networking Fundamentals", description: "How data actually moves between systems." },
          { id: "distributed-systems-basics", title: "Distributed Systems Basics", description: "Why data infrastructure is rarely a single machine." },
        ],
      },
      {
        id: "de-lifecycle",
        title: "Data Engineering Lifecycle",
        topics: [
          { id: "data-generation-lifecycle", title: "Data Generation", description: "Where data originates." },
          { id: "data-storage-lifecycle", title: "Data Storage", description: "Where it's kept." },
          { id: "data-ingestion-lifecycle", title: "Data Ingestion", description: "How it gets moved in." },
          { id: "data-serving-lifecycle", title: "Data Serving", description: "How it's made usable downstream." },
        ],
      },
      {
        id: "data-generation-de",
        title: "Data Generation",
        topics: [
          { id: "understand-steps-de", title: "Understand Different Steps", description: "The generation stage in context." },
          { id: "sources-of-data-de", title: "Sources of Data", description: "Where raw data actually comes from.", subtopics: ["Database", "APIs", "Logs", "Mobile Apps", "IoT"] },
          { id: "data-collection-considerations", title: "Data Collection Considerations", description: "Privacy, volume, and reliability trade-offs." },
        ],
      },
      {
        id: "database-fundamentals-de",
        title: "Database Fundamentals",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        topics: [
          { id: "data-normalization-de", title: "Data Normalization", description: "Reducing redundancy in schema design.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "data-modelling-de", title: "Data Modelling Techniques", description: "Structuring data for its intended use.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "cap-theorem-de", title: "CAP Theorem", description: "Consistency, availability, partition tolerance trade-offs." },
          { id: "oltp-vs-olap", title: "OLTP vs OLAP", description: "Transactional vs analytical workload design." },
          { id: "scd", title: "Slowly Changing Dimension - SCD", description: "Tracking how dimension data changes over time." },
          { id: "horizontal-vertical-scaling-de", title: "Horizontal vs Vertical Scaling", description: "The two ways to add capacity." },
          { id: "star-snowflake-schema", title: "Star vs Snowflake Schema", description: "Two common data warehouse modeling approaches." },
        ],
      },
      {
        id: "relational-databases-de",
        title: "Relational Databases",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        certUrl: "https://www.freecodecamp.org/learn/relational-database/",
        certLabel: "freeCodeCamp: Relational Databases",
        topics: [
          { id: "sql-de", title: "Learn SQL", description: "The query language every data engineer needs.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "indexing-de", title: "Indexing", description: "Speeding up lookups.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "transactions-de", title: "Transactions", description: "Atomic groups of operations.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "rdbms-options-de", title: "MySQL, PostgreSQL, MariaDB, Aurora DB, Oracle, MS SQL", description: "The major relational database engines." },
        ],
      },
      {
        id: "nosql-databases-de",
        title: "NoSQL Databases",
        topics: [
          { id: "document-de", title: "Document", description: "Flexible JSON-like storage.", subtopics: ["MongoDB", "ElasticSearch", "CosmosDB", "CouchDB"] },
          { id: "column-de", title: "Column", description: "Wide-column stores for massive datasets.", subtopics: ["Cassandra", "BigTable", "HBase"] },
          { id: "graph-de", title: "Graph", description: "Relationship-centric storage.", subtopics: ["Neo4j", "Neptune"] },
          { id: "key-value-de", title: "Key-Value", description: "Simple, fast lookups.", subtopics: ["Redis", "Memcached", "DynamoDB"] },
        ],
      },
      {
        id: "data-warehousing-de",
        title: "Data Warehousing",
        topics: [
          { id: "what-is-warehouse", title: "What is Data Warehouse?", description: "A central store optimized for analytics." },
          {
            id: "warehouse-architectures", title: "Data Warehousing Architectures", description: "The major storage patterns.",
            subtopics: [
              { id: "warehouse-tools-de", title: "Data Warehouse", description: "Google BigQuery, Snowflake, Amazon Redshift." },
              { id: "data-mart-de", title: "Data Mart", description: "A subset of a warehouse for one business area." },
              { id: "data-lake-de", title: "Data Lake", description: "Databricks Delta Lake, Snowflake, Onehouse." },
            ],
          },
          { id: "other-data-architectures", title: "Other Data Architectures", description: "Newer architectural patterns.", subtopics: ["Data Mesh", "Data Fabric", "Data Hub", "Metadata-first Architecture", "Serverless Options"] },
        ],
      },
      {
        id: "cloud-computing-de",
        title: "Cloud Computing",
        videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
        topics: [
          { id: "cloud-architectures-de", title: "Cloud Architectures", description: "How cloud data platforms are typically structured.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "aws-de", title: "AWS", description: "EC2, S3, RDS, Glue.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "azure-de", title: "Azure", description: "Virtual Machines, Blob Storage, SQL Database, Data Factory." },
          { id: "gcp-de", title: "Google Cloud", description: "Compute Engine, Cloud Storage, Cloud SQL, Dataflow." },
        ],
      },
      {
        id: "data-ingestion-de",
        title: "Data Ingestion",
        videoUrl: "https://www.freecodecamp.org/news/orchestrate-an-etl-data-pipeline-with-apache-airflow/",
        topics: [
          { id: "ingestion-types-de", title: "Types of Data Ingestion", description: "How data actually flows in.", subtopics: ["Batch", "Hybrid", "Streaming", "Realtime"] },
          {
            id: "data-pipelines-de", title: "Data Pipelines", description: "The tooling for extract/transform/load.",
            videoUrl: "https://www.freecodecamp.org/news/orchestrate-an-etl-data-pipeline-with-apache-airflow/",
            subtopics: [
              { id: "etl-process-de", title: "ETL Process", description: "Extract, Transform, Load.", videoUrl: "https://www.freecodecamp.org/news/orchestrate-an-etl-data-pipeline-with-apache-airflow/" },
              { id: "pipeline-tools-de", title: "Data Pipeline Tools", description: "Apache Airflow, dbt, Luigi, Perfect.", videoUrl: "https://www.freecodecamp.org/news/orchestrate-an-etl-data-pipeline-with-apache-airflow/" },
            ],
          },
        ],
      },
      {
        id: "cluster-computing-de",
        title: "Cluster Computing Basics",
        videoUrl: "https://www.freecodecamp.org/news/course-on-docker-and-kubernetes/",
        topics: [
          { id: "what-is-cluster-computing", title: "What is Cluster Computing", description: "Coordinating many machines as one system." },
          { id: "distributed-file-systems", title: "Distributed File Systems", description: "Storage spread across a cluster." },
          { id: "job-scheduling-de", title: "Job Scheduling", description: "Deciding what runs where and when." },
          { id: "cluster-mgmt-tools", title: "Cluster Management Tools", description: "Kubernetes, Apache Hadoop YARN, HDFS.", videoUrl: "https://www.freecodecamp.org/news/course-on-docker-and-kubernetes/" },
        ],
      },
      {
        id: "big-data-tools-de",
        title: "Big Data Tools",
        topics: [
          { id: "hadoop-ecosystem", title: "Hadoop Ecosystem", description: "HDFS, MapReduce, YARN." },
          { id: "apache-spark-de", title: "Apache Spark", description: "In-memory distributed processing." },
        ],
      },
      {
        id: "containers-orchestration-de",
        title: "Containers & Orchestration",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        topics: [
          { id: "docker-de", title: "Docker", description: "Packaging pipeline code for consistent deployment.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
          { id: "kubernetes-de", title: "Kubernetes", description: "Orchestrating containerized pipelines.", videoUrl: "https://www.freecodecamp.org/news/course-on-docker-and-kubernetes/" },
          { id: "gke-de", title: "Google Cloud GKE", description: "Google's managed Kubernetes." },
          { id: "eks-de", title: "AWS EKS", description: "Amazon's managed Kubernetes." },
        ],
      },
      {
        id: "cicd-de",
        title: "CI/CD",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
        topics: [{ id: "cicd-tools-de", title: "GitLab CI, GitHub Actions, Circle CI", description: "Automating pipeline testing and deployment.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs" }],
      },
      {
        id: "monitoring-de",
        title: "Monitoring",
        videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo",
        topics: [{ id: "monitoring-tools-de", title: "ArgoCD, Prometheus, Datadog, Sentry, New Relic", description: "Watching pipeline health in production.", videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo" }],
      },
      {
        id: "testing-de",
        title: "Testing",
        videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/",
        topics: [
          { id: "testing-types-de", title: "What and why use them?", description: "Why pipelines need testing just like application code." },
          { id: "testing-list-de", title: "Unit, Integration, End-to-End, Functional, A/B, Load, Smoke Testing", description: "The full spectrum of pipeline testing.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" },
        ],
      },
      {
        id: "messaging-systems-de",
        title: "Messaging Systems",
        topics: [
          { id: "async-vs-sync-de", title: "Async vs Sync Communication", description: "Two fundamentally different integration styles." },
          { id: "messages-vs-streams", title: "Messages vs Streams", description: "Discrete events vs continuous flow." },
          { id: "messaging-best-practices", title: "Best Practices", description: "Reliability and ordering guarantees." },
          { id: "messaging-tools-de", title: "Common Tools", description: "Apache Kafka, RabbitMQ, AWS SQS, AWS SNS." },
        ],
      },
      {
        id: "iac-de",
        title: "Infrastructure as Code - IaC",
        videoUrl: "https://www.freecodecamp.org/news/learn-terraform-and-aws-by-building-a-dev-environment/",
        topics: [
          { id: "iac-concepts-de", title: "Declarative vs Imperative, Idempotency, Reusability, Environmental Management", description: "The core IaC principles." },
          { id: "iac-tools-de", title: "Terraform, OpenTofu, AWS CDK, Google Deployment Mgr.", description: "The common IaC tools.", videoUrl: "https://www.freecodecamp.org/news/learn-terraform-and-aws-by-building-a-dev-environment/" },
        ],
      },
      {
        id: "data-serving-de",
        title: "Data Serving",
        topics: [
          { id: "visit-data-analyst", title: "Visit the Data Analyst Roadmap", description: "Where data engineering hands off to analytics." },
          { id: "data-analytics-serving", title: "Data Analytics", description: "Making data usable for analysis." },
          { id: "bi-serving", title: "Business Intelligence", description: "Microsoft Power BI, Streamlit, Tableau, Looker.", videoUrl: "https://www.youtube.com/watch?v=e6QD8lP-m6E" },
          { id: "reverse-etl", title: "Reverse ETL", description: "Pushing warehouse data back into operational tools.", subtopics: ["ETL vs Reverse ETL", "Reverse ETL Usecases", "Tools: Census, Segment, Hightouch"] },
        ],
      },
      {
        id: "security-de",
        title: "Security",
        topics: [{ id: "security-topics-de", title: "Authentication vs Authorization, Encryption, Tokenization, Data Masking, Data Obfuscation", description: "Protecting sensitive data in pipelines." }],
      },
      {
        id: "data-governance-de",
        title: "Data Governance",
        topics: [{ id: "governance-topics-de", title: "Data Quality, Data Lineage, Metadata Management, Data Interoperability", description: "Keeping data trustworthy and traceable." }],
      },
      {
        id: "privacy-de",
        title: "Privacy",
        topics: [{ id: "regulations-de", title: "Data and AI Regulations", description: "GDPR, ECPA, EU AI Act." }],
      },
      {
        id: "de-ml-mlops",
        title: "Machine Learning & MLOps",
        topics: [{ id: "ml-mlops-de", title: "Machine Learning, MLOps", description: "Where data engineering feeds ML production systems." }],
      },
    ],
  },
  "ai-data-scientist": {
    id: "ai-data-scientist",
    label: "AI and Data Scientist",
    tagline: "The exact roadmap.sh AI & Data Scientist path — math through MLOps.",
    heroVideoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A",
    heroVideoLabel: "freeCodeCamp: Machine Learning with Python and Scikit-Learn",
    heroCertUrl: "https://www.coursera.org/specializations/machine-learning-introduction",
    heroCertLabel: "Andrew Ng: Machine Learning Specialization",
    sections: [
      {
        id: "mathematics-ds",
        title: "Mathematics",
        videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
        topics: [
          { id: "linear-algebra-ds", title: "Linear Algebra, Calculus, Mathematical Analysis", description: "The math foundation for every model.", videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
          { id: "differential-calculus-ds", title: "Differential Calculus", description: "The math behind gradient-based optimization.", videoUrl: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
        ],
      },
      {
        id: "statistics-ds",
        title: "Statistics",
        videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV",
        topics: [
          { id: "stats-clt", title: "Statistics, CLT", description: "The central limit theorem and foundational statistics.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
          { id: "hypothesis-testing-ds", title: "Hypothesis Testing", description: "Determining if an observed effect is real.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
          { id: "probability-sampling-ds", title: "Probability and Sampling", description: "How samples relate to populations.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
          { id: "ab-testing-ds", title: "AB Testing", description: "Comparing two variants scientifically." },
          { id: "test-sensitivity-ds", title: "Increasing Test Sensitivity", description: "Detecting smaller true effects reliably." },
          { id: "ratio-metrics-ds", title: "Ratio Metrics", description: "Metrics defined as a ratio of two quantities." },
        ],
      },
      {
        id: "econometrics-ds",
        title: "Econometrics",
        topics: [
          { id: "econometrics-prereqs", title: "Pre-requisites of Econometrics", description: "What you need before studying econometrics." },
          { id: "regression-timeseries", title: "Regression, Timeseries, Fitting Distributions", description: "The core econometric toolkit." },
        ],
      },
      {
        id: "coding-ds",
        title: "Coding",
        videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/",
        topics: [
          { id: "python-ds", title: "Learn Python Programming Language", description: "The primary language of data science.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/" },
          { id: "dsa-python-ds", title: "Data Structures and Algorithms (Python)", description: "Efficient data handling in Python.", videoUrl: "https://www.freecodecamp.org/news/learn-data-structures-and-algorithms/" },
          { id: "sql-ds", title: "Learn SQL", description: "Querying data at the source.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
        ],
      },
      {
        id: "eda-ds",
        title: "Exploratory Data Analysis",
        topics: [{ id: "eda-topic-ds", title: "Data understanding, Data Analysis and Visualization", description: "Getting to know a dataset before modeling it." }],
      },
      {
        id: "ml-ds",
        title: "Machine Learning",
        videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A",
        certUrl: "https://www.coursera.org/specializations/machine-learning-introduction",
        certLabel: "Andrew Ng: Machine Learning Specialization",
        topics: [{ id: "ml-topic-ds", title: "Classic ML (Sup., Unsup.), Advanced ML (Ensembles, NNs)", description: "The core machine learning toolkit.", videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A" }],
      },
      {
        id: "dl-ds",
        title: "Deep Learning",
        videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
        certUrl: "https://www.deeplearning.ai/courses/deep-learning-specialization/",
        certLabel: "DeepLearning.AI: Deep Learning Specialization",
        topics: [{ id: "dl-topic-ds", title: "Fully Connected, CNN, RNN, LSTM, Transformers, TL", description: "The major deep learning architectures.", videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY" }],
      },
      {
        id: "mlops-ds",
        title: "MLOps",
        topics: [{ id: "mlops-topic-ds", title: "Deployment Models, CI/CD", description: "Getting models into and staying in production." }],
      },
    ],
  },
  "bi-analyst": {
    id: "bi-analyst",
    label: "BI Analyst",
    tagline: "The exact roadmap.sh BI Analyst path — business fundamentals through career development.",
    heroVideoUrl: "https://www.youtube.com/watch?v=e6QD8lP-m6E",
    heroVideoLabel: "freeCodeCamp: Power BI Full Course Tutorial",
    heroCertUrl: "https://www.coursera.org/professional-certificates/google-data-analytics",
    heroCertLabel: "Google Data Analytics Professional Certificate",
    sections: [
      {
        id: "introduction-bi",
        title: "Introduction",
        topics: [
          { id: "what-is-bi", title: "What is BI?", description: "Turning organizational data into decisions." },
          { id: "why-bi-matters", title: "Why BI Matters?", description: "The business case for investing in analytics." },
          { id: "bi-skills", title: "Skills", description: "What a BI analyst needs to know." },
          { id: "bi-responsibilities", title: "Responsibilities", description: "What a BI analyst actually owns." },
          { id: "bi-vs-other-roles", title: "BI Analyst vs Other Roles", description: "How BI differs from data analyst/scientist roles." },
        ],
      },
      {
        id: "business-functions-bi",
        title: "Key Business Functions",
        topics: [
          { id: "metrics-kpis-bi", title: "Metrics and KPIs", description: "The numbers a business actually tracks." },
          { id: "stakeholder-identification", title: "Stakeholder Identification", description: "Knowing who consumes your analysis." },
          { id: "bi-operations-types", title: "Types of BI Operations", description: "Operational, tactical, and strategic BI.", subtopics: ["Operational BI", "Tactical BI", "Strategic BI"] },
        ],
      },
      {
        id: "data-analysis-types-bi",
        title: "Types of Data Analysis",
        topics: [{ id: "analysis-types-bi", title: "Descriptive, Diagnostic, Predictive, Prescriptive Analysis", description: "The four levels of analytical depth." }],
      },
      {
        id: "descriptive-stats-bi",
        title: "Descriptive Statistics",
        videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV",
        topics: [
          { id: "central-tendency-bi", title: "Mean Median Mode", description: "The basic center-of-data measures.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
          { id: "dispersion-bi", title: "Dispersion", description: "Range, variance, STD, IQR.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
          { id: "distribution-bi", title: "Distribution", description: "Skewness and kurtosis.", videoUrl: "https://www.youtube.com/playlist?list=PL3Sk77w7CQs-CBf7uzt6_kL0q0163GDhV" },
        ],
      },
      {
        id: "correlation-regression-bi",
        title: "Correlation & Regression Analysis",
        topics: [
          { id: "correlation-causation", title: "Correlation vs Causation", description: "The most important distinction in analytics." },
          { id: "linear-regression-bi", title: "Linear Regression", description: "Modeling a straight-line relationship." },
        ],
      },
      {
        id: "inferential-stats-bi",
        title: "Inferential Statistics",
        topics: [{ id: "inferential-topics-bi", title: "Confidence Intervals, Population & Sample, p-value, Hypothesis Testing", description: "Drawing conclusions beyond the sample." }],
      },
      {
        id: "what-is-data-bi",
        title: "What is Data?",
        topics: [{ id: "data-types-bi", title: "Types of data", description: "Structured, semistructured, unstructured, analog vs digital." }],
      },
      {
        id: "data-sources-bi",
        title: "Data Sources",
        topics: [{ id: "sources-list-bi", title: "Databases, Web, Mobile Apps, Cloud, APIs, IoT", description: "Where BI data comes from." }],
      },
      {
        id: "sql-fundamentals-bi",
        title: "SQL Fundamentals",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        topics: [{ id: "sql-bi-topic", title: "Basic & Advanced Queries, Window Functions, Performance", description: "The SQL skills a BI analyst needs daily.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" }],
      },
      {
        id: "data-cleaning-bi",
        title: "Data Cleaning",
        topics: [{ id: "eda-cleaning-bi", title: "Exploratory Data Analysis (Duplicates, Missing Values, Outliers)", description: "Preparing raw data for reporting." }],
      },
      {
        id: "visualizing-data-bi",
        title: "Visualizing Data",
        videoUrl: "https://www.freecodecamp.org/news/tableau-for-data-science-and-data-visualization-crash-course/",
        topics: [
          { id: "viz-fundamentals-bi", title: "Visualization Fundamentals", description: "Color theory, accessibility, design principles." },
          { id: "chart-categories-bi", title: "Chart Categories", description: "Choosing the right chart, avoiding misleading ones." },
          { id: "popular-plots-bi", title: "Popular Plots", description: "Barplot, Lineplot, Histogram, Scatterplot, Boxplot, Map, Heatmap.", videoUrl: "https://www.freecodecamp.org/news/tableau-for-data-science-and-data-visualization-crash-course/" },
        ],
      },
      {
        id: "bi-tools-section",
        title: "BI Tools",
        videoUrl: "https://www.youtube.com/watch?v=e6QD8lP-m6E",
        topics: [{ id: "platforms-bi", title: "Power BI, Tableau, Qlik, Looker, Excel", description: "The dominant BI platforms.", videoUrl: "https://www.youtube.com/watch?v=e6QD8lP-m6E" }],
      },
      {
        id: "cloud-computing-bi",
        title: "Cloud Computing",
        topics: [{ id: "cloud-bi-topic", title: "Cloud data warehouses; AWS, GCP, Azure", description: "Where enterprise BI data actually lives." }],
      },
      {
        id: "programming-languages-bi",
        title: "Programming Languages",
        videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/",
        topics: [{ id: "python-r-bi", title: "Python, R", description: "Scripting analysis beyond spreadsheet limits.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/" }],
      },
      {
        id: "business-applications-bi",
        title: "Business Applications",
        topics: [
          { id: "finance-bi", title: "Finance", description: "Risk analytics, compliance, fraud detection, CLV." },
          { id: "retail-ecommerce-bi", title: "Retail & E-commerce", description: "Sales performance, inventory, marketing, supply chain." },
          { id: "healthcare-bi", title: "Healthcare", description: "Patient management, hospital efficiency, compliance, public health." },
          { id: "manufacturing-bi", title: "Manufacturing", description: "Production efficiency, predictive maintenance, quality control." },
        ],
      },
      {
        id: "bi-techniques",
        title: "BI Techniques",
        topics: [{ id: "techniques-list-bi", title: "A/B Testing, Cohort Analysis, Forecasting, Basic Machine Learning", description: "The applied analytical techniques BI relies on." }],
      },
      {
        id: "communication-bi",
        title: "Communication & Storytelling",
        topics: [{ id: "storytelling-bi", title: "Storytelling Framework, Dashboard Design, Presentation Design, Executive Summaries", description: "Turning analysis into decisions people act on." }],
      },
      {
        id: "soft-skills-bi",
        title: "Soft Skills",
        topics: [{ id: "soft-skills-list-bi", title: "Stakeholder Management, Change Management, Critical Thinking, Business Acumen", description: "The non-technical skills that make BI actually land." }],
      },
      {
        id: "data-quality-bi",
        title: "Data Quality",
        topics: [{ id: "quality-dims-bi", title: "Relevance, Timeliness, Accessibility, Interpretability, Accuracy, Coherence", description: "The dimensions that define trustworthy data." }],
      },
      {
        id: "governance-ethics-bi",
        title: "Data Governance & Ethics",
        topics: [{ id: "governance-list-bi", title: "Data Lineage, Privacy, Ethical Data Use, Bias Recognition, GDPR/CCPA", description: "Using data responsibly." }],
      },
      {
        id: "data-architectures-bi",
        title: "Data Architectures",
        topics: [
          { id: "cloud-bi-ecosystem", title: "Cloud BI Ecosystem", description: "Data Warehouse, Data Lake, Data Mart." },
          { id: "data-modeling-bi", title: "Data Modeling for BI", description: "Star vs Snowflake Schema, Fact vs Dimension Tables." },
          { id: "etl-tools-bi", title: "ETL Tools", description: "Airflow, dbt.", videoUrl: "https://www.freecodecamp.org/news/orchestrate-an-etl-data-pipeline-with-apache-airflow/" },
        ],
      },
      {
        id: "career-development-bi",
        title: "Career Development",
        topics: [
          { id: "portfolio-bi", title: "Building Your Portfolio", description: "End-to-end analytics projects and dashboards." },
          { id: "prof-development-bi", title: "Professional Development", description: "Communities, open-source, competitions, conferences, certifications.", certUrl: "https://www.coursera.org/professional-certificates/google-data-analytics", certLabel: "Google Data Analytics Professional Certificate" },
          { id: "job-prep-bi", title: "Job Preparation", description: "Resume, interview prep, portfolio presentation, salary negotiation." },
        ],
      },
    ],
  },
  android: {
    id: "android",
    label: "Android",
    tagline: "The exact roadmap.sh Android path — Kotlin fundamentals through distribution.",
    heroVideoUrl: "https://www.freecodecamp.org/news/master-kotlin-and-android-60-hour-course/",
    heroVideoLabel: "freeCodeCamp: Master Kotlin & Android — 60-Hour Course",
    heroCertUrl: "https://developer.android.com/courses",
    heroCertLabel: "Android Developers: Courses & Certification",
    sections: [
      {
        id: "pick-language-android",
        title: "Pick a Language",
        videoUrl: "https://www.freecodecamp.org/news/master-kotlin-and-android-60-hour-course/",
        topics: [
          { id: "kotlin-android", title: "Kotlin", description: "The modern, recommended Android language.", videoUrl: "https://www.freecodecamp.org/news/master-kotlin-and-android-60-hour-course/" },
          { id: "java-android", title: "Java", description: "The original Android development language." },
        ],
      },
      {
        id: "fundamentals-android",
        title: "The Fundamentals",
        videoUrl: "https://www.freecodecamp.org/news/master-kotlin-and-android-60-hour-course/",
        topics: [
          { id: "dev-ide-android", title: "Development IDE", description: "Android Studio setup and workflow.", videoUrl: "https://www.freecodecamp.org/news/master-kotlin-and-android-60-hour-course/" },
          { id: "kotlin-basics-android", title: "Basics of Kotlin", description: "Syntax and language fundamentals.", videoUrl: "https://www.freecodecamp.org/news/master-kotlin-and-android-60-hour-course/" },
          { id: "oop-basics-android", title: "Basics of OOP", description: "Classes and objects in Kotlin." },
          { id: "dsa-android", title: "Data Structures and Algorithms", description: "Efficient data handling on mobile." },
          { id: "gradle", title: "What is and how to use Gradle?", description: "Android's build system." },
          { id: "hello-world-android", title: "Create a Basic Hello World App", description: "Your first running Android app." },
        ],
      },
      {
        id: "version-control-android",
        title: "Version Control",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [
          { id: "git-android", title: "Git", description: "Tracking changes to your app's code.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
          { id: "vcs-hosting-android", title: "VCS Hosting", description: "GitHub, Bitbucket, GitLab.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
        ],
      },
      {
        id: "app-components-android",
        title: "App Components",
        topics: [
          { id: "services-android", title: "Services", description: "Content Provider, Broadcast Receiver." },
          { id: "intent-android", title: "Intent", description: "Implicit, Explicit, Intent Filters." },
          { id: "activity-android", title: "Activity", description: "Lifecycle, State Changes, Tasks & Backstack." },
        ],
      },
      {
        id: "interface-navigation-android",
        title: "Interface & Navigation",
        topics: [
          { id: "layouts-android", title: "Layouts", description: "Frame, Linear, Relative, Constraint, RecycleView." },
          { id: "elements-android", title: "Elements", description: "TextView, Fragments, EditText, Dialogs, Buttons, and more." },
          { id: "jetpack-compose", title: "Jetpack Compose", description: "Android's modern declarative UI toolkit.", videoUrl: "https://www.freecodecamp.org/news/master-kotlin-and-android-60-hour-course/" },
          { id: "app-shortcuts", title: "App Shortcuts", description: "Quick actions from the launcher icon." },
          { id: "navigation-components", title: "Navigation Components", description: "Managing in-app navigation declaratively." },
        ],
      },
      {
        id: "design-architecture-android",
        title: "Design & Architecture",
        topics: [
          { id: "architectural-patterns-android", title: "Architectural Patterns", description: "MVI, MVVM, MVP, MVC." },
          { id: "design-patterns-android", title: "Design Patterns", description: "Repository, Builder, Factory, Observer, Flow." },
          { id: "di-android", title: "Dependency Injection", description: "Dagger, Hilt, Koin, Kodein." },
        ],
      },
      {
        id: "storage-android",
        title: "Storage",
        topics: [{ id: "storage-topics-android", title: "Shared Preferences, DataStore, Room Database, File System", description: "The local persistence options on Android." }],
      },
      {
        id: "network-android",
        title: "Network",
        topics: [{ id: "network-libs-android", title: "Retrofit, OkHttp, Apollo-Android", description: "The standard networking libraries." }],
      },
      {
        id: "asynchronism-android",
        title: "Asynchronism",
        topics: [{ id: "async-android", title: "Coroutines, Threads, RxJava, RxKotlin, WorkManager", description: "Managing background work on Android." }],
      },
      {
        id: "common-services-android",
        title: "Common Services",
        topics: [
          { id: "firebase-android", title: "Firebase", description: "Authentication, Crashlytics, Remote Config, Cloud Messaging, Firestore." },
          { id: "google-admob", title: "Google Admob", description: "Mobile ad monetization." },
          { id: "google-play-services", title: "Google Play Services", description: "Core Google APIs on Android." },
          { id: "google-maps-android", title: "Google Maps", description: "Embedding maps and location features." },
        ],
      },
      {
        id: "linting-android",
        title: "Linting",
        topics: [{ id: "linting-tools-android", title: "Ktlint, Detekt", description: "Enforcing Kotlin code style." }],
      },
      {
        id: "debugging-android",
        title: "Debugging",
        topics: [{ id: "debugging-tools-android", title: "Timber, Leak Canary, Chucker, Jetpack Benchmark", description: "Diagnosing bugs and performance issues." }],
      },
      {
        id: "testing-android",
        title: "Testing",
        videoUrl: "https://www.freecodecamp.org/news/learn-java-testing-with-selenium",
        topics: [{ id: "testing-tools-android", title: "Espresso, JUnit", description: "The standard Android testing frameworks." }],
      },
      {
        id: "distribution-android",
        title: "Distribution",
        topics: [{ id: "distribution-ways-android", title: "Signed APK, Firebase Distribution, Google Playstore", description: "Getting your app into users' hands." }],
      },
    ],
  },
  ios: {
    id: "ios",
    label: "iOS",
    tagline: "The exact roadmap.sh iOS path — Swift fundamentals through continuous learning.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-the-swift-programming-language/",
    heroVideoLabel: "freeCodeCamp: Learn the Swift Programming Language",
    heroCertUrl: "https://www.mygreatlearning.com/academy/learn-for-free/courses/swift-tutorial",
    heroCertLabel: "Great Learning: Free Swift Course with Certificate",
    sections: [
      {
        id: "pick-language-ios",
        title: "Pick a Language",
        videoUrl: "https://www.freecodecamp.org/news/learn-the-swift-programming-language/",
        topics: [
          { id: "objective-c", title: "Objective-C", description: "The original iOS development language.", subtopics: ["Objective-C Basics", "Interoperability with Swift"] },
          { id: "swift-ios", title: "Swift (Recommended)", description: "Apple's modern, safe programming language.", videoUrl: "https://www.freecodecamp.org/news/learn-the-swift-programming-language/", subtopics: ["History and Why Swift?", "Benefits over Objective-C", "Swift Basics"] },
        ],
      },
      {
        id: "fundamentals-ios",
        title: "The Fundamentals",
        topics: [
          { id: "ios-architecture", title: "iOS Architecture", description: "Core OS, Core Services, Media, Cocoa Touch.", subtopics: ["Core OS", "Core Services", "Media (Core Graphics, Core Animation, AVFoundation, Core Image, Core Audio, Metal)", "Cocoa Touch"] },
          { id: "core-programming-ios", title: "Core Programming Concepts", description: "OOP, functional programming, memory management, lifecycle, error handling, concurrency." },
        ],
      },
      {
        id: "version-control-ios",
        title: "Version Control",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [{ id: "git-github-ios", title: "Git, GitHub", description: "Tracking and collaborating on iOS codebases.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" }],
      },
      {
        id: "xcode-ios",
        title: "Xcode",
        topics: [
          { id: "setting-up-xcode", title: "Setting Up", description: "Installing, preferences, new project." },
          { id: "navigating-xcode", title: "Navigating", description: "Interface, toolbar, navigators, editors." },
          { id: "debugger-xcode", title: "Debugger", description: "Breakpoints, debug navigator, stepping." },
          { id: "interface-builder", title: "Interface Builder", description: "IBOutlets, IBActions, Auto Layout." },
        ],
      },
      {
        id: "app-components-ios",
        title: "App Components",
        topics: [
          { id: "uikit-ios", title: "UIKit", description: "The imperative UI framework — Views, View Controllers, Storyboards." },
          { id: "swiftui-ios", title: "SwiftUI", description: "Apple's modern declarative UI framework — declarative syntax, state, data binding." },
        ],
      },
      {
        id: "interfaces-navigation-ios",
        title: "Interfaces and Navigation",
        topics: [{ id: "navigation-ios", title: "HIG UI Design, UIKit & SwiftUI Navigation", description: "Navigation stacks, segues, and view transitions in both UI frameworks." }],
      },
      {
        id: "design-architecture-ios",
        title: "Design Architecture",
        topics: [
          { id: "core-animation-ios", title: "Core Animation", description: "Lottie basics and creating animations." },
          { id: "architectural-patterns-ios", title: "Architectural Patterns", description: "MVC, MVP, MVVM, MVVM-C, TCA, VIPER." },
          { id: "reactive-programming-ios", title: "Reactive Programming", description: "Combine and RxSwift." },
        ],
      },
      {
        id: "patterns-techniques-ios",
        title: "Patterns and Techniques",
        topics: [
          { id: "delegate-pattern", title: "Delegate Pattern", description: "A core iOS design pattern for communication between objects." },
          { id: "closures-ios", title: "Closures", description: "Capturing values and avoiding callback hell." },
          { id: "concurrency-ios", title: "Concurrency", description: "Async/await in Swift." },
        ],
      },
      {
        id: "storage-ios",
        title: "Storage",
        topics: [
          { id: "data-persistence-ios", title: "Data Persistence", description: "Core Data, User Defaults, Keychain, File System, SQLite." },
          { id: "json-xml-ios", title: "JSON / XML", description: "Parsing and serializing." },
          { id: "networking-ios", title: "Networking", description: "HTTP/HTTPS, REST, GraphQL, URLSession, Alamofire." },
          { id: "asynchronism-ios", title: "Asynchronism", description: "GCD and Operation Queues." },
        ],
      },
      {
        id: "dependency-manager-ios",
        title: "Dependency Manager",
        topics: [{ id: "dep-mgr-tools-ios", title: "CocoaPods, Carthage, Swift Package Manager", description: "Managing third-party iOS libraries." }],
      },
      {
        id: "frameworks-library-ios",
        title: "Frameworks & Library",
        topics: [{ id: "framework-types-ios", title: "XCFramework, Static Library, Dynamic Library", description: "Ways to package reusable iOS code." }],
      },
      {
        id: "accessibility-ios",
        title: "Accessibility",
        topics: [{ id: "accessibility-tools-ios", title: "Accessibility Inspector, Voice Over, Dynamic Type", description: "Making an iOS app usable by everyone." }],
      },
      {
        id: "common-services-ios",
        title: "Common Services",
        topics: [{ id: "frameworks-ios", title: "ARKit, HealthKit, GameKit, MapKit, Core ML", description: "Apple's higher-level device capability frameworks." }],
      },
      {
        id: "code-quality-ios",
        title: "Code Quality Tools",
        topics: [{ id: "linting-ios", title: "SwiftLint, Tailor, SwiftFormat", description: "Enforcing Swift code style." }],
      },
      {
        id: "debugging-ios",
        title: "Debugging",
        topics: [{ id: "debugging-techniques-ios", title: "Xcode Debugger, Profiling Instruments", description: "Diagnosing bugs and performance issues." }],
      },
      {
        id: "testing-ios",
        title: "Testing",
        topics: [{ id: "testing-ios-topic", title: "XCTest, XCUITest, Test Plan & Coverage", description: "Unit and UI testing on iOS." }],
      },
      {
        id: "app-distribution-ios",
        title: "App Distribution",
        topics: [{ id: "distribution-ios-topic", title: "FastLane, TestFlight, App Store Distribution, CI/CD", description: "Shipping an iOS app to users." }],
      },
      {
        id: "continuous-learning-ios",
        title: "Continuous Learning",
        topics: [{ id: "wwdc-ios", title: "Keeping Updated with WWDC", description: "Tracking the latest Swift version and iOS SDK." }],
      },
    ],
  },
  "api-design": {
    id: "api-design",
    label: "API Design",
    tagline: "The exact roadmap.sh API Design path — HTTP basics through standards & compliance.",
    heroVideoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/",
    heroVideoLabel: "freeCodeCamp: APIs for Beginners — Full Course",
    heroCertUrl: "https://academy.postman.com/",
    heroCertLabel: "Postman Academy",
    sections: [
      {
        id: "learn-basics-api",
        title: "Learn the Basics",
        videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/",
        topics: [
          { id: "what-are-apis", title: "What are APIs", description: "The contract between two pieces of software.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" },
          { id: "http-api", title: "HTTP", description: "The protocol underlying most APIs.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/", subtopics: ["HTTP Versions", "HTTP Methods", "HTTP Status Codes", "HTTP Headers", "Cookies", "CORS", "HTTP Caching"] },
          { id: "url-query-path-params", title: "URL, Query & Path Parameters", description: "The parts of a request URL." },
          { id: "content-negotiation", title: "Content Negotiation", description: "Letting client and server agree on a response format." },
          { id: "tcp-ip-api", title: "Understand TCP / IP", description: "The transport layer underneath HTTP." },
          { id: "dns-basics-api", title: "Basics of DNS", description: "Resolving API hostnames." },
        ],
      },
      {
        id: "api-styles",
        title: "Different API Styles",
        topics: [{ id: "api-styles-list", title: "RESTful, Simple JSON, SOAP, GraphQL, gRPC APIs", description: "The major architectural styles for building APIs." }],
      },
      {
        id: "building-rest-apis",
        title: "Building JSON / RESTful APIs",
        videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/",
        topics: [
          { id: "rest-principles", title: "REST Principles", description: "Resources, statelessness, and uniform interfaces.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" },
          { id: "uri-design", title: "URI Design", description: "Naming resources predictably." },
          { id: "versioning-strategies-api", title: "Versioning Strategies", description: "Evolving an API without breaking clients." },
          { id: "crud-operations", title: "Handling CRUD Operations", description: "Create, read, update, delete via HTTP verbs." },
          { id: "pagination-api", title: "Pagination", description: "Returning large result sets in pages." },
          { id: "rate-limiting-api", title: "Rate Limiting", description: "Protecting an API from overuse." },
          { id: "idempotency-api", title: "Idempotency", description: "Making repeated requests safe." },
          { id: "hateoas-api", title: "HATEOAS", description: "Hypermedia-driven API navigation." },
          { id: "error-handling-api", title: "Error Handling", description: "Communicating failures clearly.", subtopics: ["RFC 7807 - Problem Details for APIs"] },
        ],
      },
      {
        id: "authentication-methods-api",
        title: "Authentication Methods",
        videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/",
        topics: [{ id: "auth-methods-api-topic", title: "Basic Auth, Token Based Auth, JWT, OAuth 2.0, Session Based Auth", description: "The standard ways APIs verify identity.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" }],
      },
      {
        id: "authorization-methods-api",
        title: "Authorization Methods",
        topics: [{ id: "authz-methods-api", title: "Role Based Access Control (RBAC), Attribute Based Access Control (ABAC)", description: "Deciding what an authenticated user can do." }],
      },
      {
        id: "api-keys-mgmt",
        title: "API Keys & Management",
        topics: [{ id: "api-keys-topic", title: "Issuing, rotating, and scoping API keys", description: "Managing programmatic access safely." }],
      },
      {
        id: "api-docs-tools",
        title: "API Documentation Tools",
        topics: [{ id: "docs-tools-api", title: "Swagger / OpenAPI, Readme.com, Stoplight, Postman", description: "Documenting an API so others can actually use it." }],
      },
      {
        id: "api-security-section",
        title: "API Security",
        videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/",
        topics: [{ id: "security-vulns-api", title: "Common Vulnerabilities, Best Practices", description: "Protecting an API from the OWASP API Top 10.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" }],
      },
      {
        id: "api-performance",
        title: "API Performance",
        topics: [{ id: "performance-list-api", title: "Metrics, Caching, Load Balancing, Rate Limiting, Profiling, Testing", description: "Keeping an API fast under real load." }],
      },
      {
        id: "api-integration-patterns",
        title: "API Integration Patterns",
        topics: [
          { id: "sync-vs-async-api", title: "Synchronous vs Asynchronous APIs", description: "Blocking vs non-blocking integration styles." },
          { id: "event-driven-api", title: "Event Driven Architecture", description: "Reacting to events instead of polling." },
          { id: "api-gateways", title: "API Gateways", description: "A single entry point in front of many services." },
          { id: "microservices-api", title: "Microservices Architecture", description: "APIs as the contract between independent services." },
          { id: "webhooks-vs-polling", title: "Webhooks vs Polling", description: "Push vs pull integration." },
          { id: "messaging-queues-api", title: "Messaging Queues", description: "RabbitMQ, Kafka." },
          { id: "batch-processing-api", title: "Batch Processing", description: "Processing many records together instead of one at a time." },
        ],
      },
      {
        id: "api-testing-section",
        title: "API Testing",
        videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/",
        topics: [{ id: "testing-types-api", title: "Unit, Integration, Functional, Load Testing, Mocking, Contract Testing", description: "Verifying an API behaves correctly.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" }],
      },
      {
        id: "realtime-apis",
        title: "Real-time APIs",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [{ id: "realtime-api-topic", title: "Web Sockets, Server Sent Events", description: "Pushing updates to clients as they happen.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" }],
      },
      {
        id: "api-lifecycle",
        title: "API Lifecycle Management",
        topics: [{ id: "lifecycle-mgmt-api", title: "Design, build, test, deploy, deprecate", description: "Managing an API from creation to retirement." }],
      },
      {
        id: "standards-compliance-api",
        title: "Standards and Compliance",
        topics: [{ id: "compliance-list-api", title: "GDPR, CCPA, PCI DSS, HIPAA, PII", description: "The regulatory frameworks APIs often need to satisfy." }],
      },
    ],
  },
  qa: {
    id: "qa",
    label: "QA",
    tagline: "The exact roadmap.sh QA path — fundamentals through headless testing.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-java-testing-with-selenium",
    heroVideoLabel: "freeCodeCamp: Learn Java Testing with Selenium",
    heroCertUrl: "https://www.freecodecamp.org/learn/quality-assurance/",
    heroCertLabel: "freeCodeCamp: Quality Assurance Certification",
    sections: [
      {
        id: "fundamentals-qa",
        title: "Learn the Fundamentals",
        topics: [
          { id: "what-is-qa", title: "What is Quality Assurance?", description: "Preventing defects, not just finding them." },
          { id: "qa-mindset", title: "QA Mindset", description: "Thinking adversarially about your own product." },
          { id: "testing-approaches-qa", title: "Testing Approaches", description: "White Box, Gray Box, Black Box Testing." },
          { id: "test-oracles", title: "Test Oracles", description: "How you decide whether a result is correct." },
          { id: "test-prioritization", title: "Test Prioritization", description: "Deciding what to test first given limited time." },
        ],
      },
      {
        id: "project-mgmt-qa",
        title: "Project Management",
        topics: [{ id: "pm-tools-qa", title: "Atlassian, Assembla, YouTrack, Trello", description: "Tools for tracking QA work." }],
      },
      {
        id: "manage-testing-qa",
        title: "Manage your Testing",
        topics: [{ id: "test-mgmt-tools-qa", title: "qTest, TestRail, TestLink, Zephyr", description: "Tools for organizing test cases and runs." }],
      },
      {
        id: "sdlc-qa",
        title: "SDLC Delivery Model",
        topics: [{ id: "sdlc-models-qa", title: "V Model, Waterfall, Agile (Kanban, Scrum, XP, SAFe)", description: "How testing fits into different delivery models." }],
      },
      {
        id: "manual-testing-qa",
        title: "Manual Testing",
        topics: [{ id: "manual-testing-topics-qa", title: "TDD, Test Planning, Test Cases, Compatibility, Verification & Validation", description: "The core discipline before any automation." }],
      },
      {
        id: "testing-techniques-qa",
        title: "Testing Techniques",
        topics: [
          { id: "non-functional-testing-qa", title: "Non-Functional Testing", description: "Load, Performance, Stress, Security, Accessibility Testing." },
          { id: "functional-testing-qa", title: "Functional Testing", description: "UAT, Exploratory, Sanity, Regression, Smoke, Unit, Integration Testing." },
        ],
      },
      {
        id: "automated-testing-qa",
        title: "Automated Testing",
        videoUrl: "https://www.freecodecamp.org/news/learn-java-testing-with-selenium",
        topics: [
          { id: "frontend-automation-qa", title: "Frontend Automation", description: "Selenium, Playwright, Cypress, Jest, Puppeteer, and more.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" },
          { id: "backend-automation-qa", title: "Backend Automation", description: "Cypress, Playwright, SoapUI, Karate, Postman/Newman, REST Assured.", videoUrl: "https://www.freecodecamp.org/news/software-testing-with-playwright/" },
          { id: "mobile-automation-qa", title: "Mobile Automation", description: "Espresso, Detox, Appium, XCUITest." },
        ],
      },
      {
        id: "non-functional-testing-section",
        title: "Non-Functional Testing",
        topics: [
          { id: "accessibility-tests-qa", title: "Accessibility Tests", description: "Wave, AXE, Chrome DevTools." },
          { id: "load-perf-testing-qa", title: "Load & Performance Testing", description: "Lighthouse, Locust, K6, JMeter, Gatling." },
          { id: "security-testing-qa", title: "Security Testing", description: "Auth testing, secrets management, OWASP Top 10, vulnerability scanning.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "email-testing-qa", title: "Email Testing", description: "Mailinator, Gmail Tester." },
        ],
      },
      {
        id: "reporting-qa",
        title: "Reporting",
        topics: [{ id: "reporting-tools-qa", title: "TestRail, Allure, jUnit", description: "Communicating test results clearly." }],
      },
      {
        id: "monitoring-logs-qa",
        title: "Monitoring & Logs",
        topics: [{ id: "monitoring-tools-qa", title: "New Relic, RunScope, Kibana, Datadog, Grafana, Sentry", description: "Watching production for issues tests didn't catch." }],
      },
      {
        id: "vcs-qa",
        title: "Version Control System",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [{ id: "git-qa", title: "Git", description: "Versioning your test code.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" }],
      },
      {
        id: "repo-hosting-qa",
        title: "Repo Hosting Services",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [{ id: "hosting-services-qa", title: "GitHub, Bitbucket, GitLab", description: "Where your test suite lives.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" }],
      },
      {
        id: "cicd-qa",
        title: "CI / CD",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs",
        topics: [{ id: "cicd-tools-qa", title: "Jenkins, Drone, GitLab CI, Bamboo, Circle CI, Travis CI", description: "Running your test suite automatically.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkzvvpY12KkfiIGso9A_Ixs" }],
      },
      {
        id: "headless-testing",
        title: "Headless Testing",
        topics: [{ id: "headless-tools-qa", title: "Puppeteer, Zombie.js, Playwright, Cypress, Headless Chrome/Fox", description: "Running browser tests without a visible UI." }],
      },
    ],
  },
  blockchain: {
    id: "blockchain",
    label: "Blockchain",
    tagline: "The exact roadmap.sh Blockchain path — fundamentals through scaling.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-solidity-blockchain-and-smart-contracts-in-a-free",
    heroVideoLabel: "freeCodeCamp: Learn Solidity, Blockchain, and Smart Contracts",
    heroCertUrl: "https://web3.freecodecamp.org/web3",
    heroCertLabel: "freeCodeCamp: Web3 Curriculum",
    sections: [
      {
        id: "basic-blockchain-knowledge",
        title: "Basic Blockchain Knowledge",
        videoUrl: "https://www.freecodecamp.org/news/learn-solidity-blockchain-and-smart-contracts-in-a-free",
        topics: [{ id: "blockchain-basics-topic", title: "What is Blockchain, Decentralization, Structure, Operations, Applications, Storage", description: "The core concepts every blockchain path starts with.", videoUrl: "https://www.freecodecamp.org/news/learn-solidity-blockchain-and-smart-contracts-in-a-free" }],
      },
      {
        id: "general-blockchain-knowledge",
        title: "General Blockchain Knowledge",
        topics: [{ id: "general-blockchain-topic", title: "Mining, Forking, Cryptocurrencies, Wallets, Cryptography, Consensus, Interoperability", description: "The wider concepts around how blockchains actually operate." }],
      },
      {
        id: "blockchains-list",
        title: "Blockchains",
        topics: [
          { id: "solana", title: "Solana", description: "A high-throughput, low-fee blockchain." },
          { id: "ton-blockchain", title: "TON", description: "The Open Network blockchain." },
          { id: "evm-based", title: "EVM-Based", description: "Ethereum, Polygon, BSC, Gnosis Chain, Avalanche, and other EVM-compatible chains." },
          { id: "l2-blockchains", title: "L2 Blockchains", description: "Arbitrum and other Ethereum layer-2 scaling chains." },
        ],
      },
      {
        id: "oracles-blockchain",
        title: "Oracles",
        topics: [{ id: "oracles-topic", title: "Hybrid Smart Contracts, Chainlink, Oracle Networks", description: "Bringing off-chain data on-chain." }],
      },
      {
        id: "smart-contracts",
        title: "Smart Contracts",
        topics: [
          { id: "smart-contract-languages", title: "Programming Languages", description: "Solidity, Vyper, Rust." },
          { id: "smart-contract-tooling", title: "IDEs, Deployment, Monitoring, Upgrades", description: "The full smart-contract dev lifecycle." },
          { id: "erc-tokens", title: "ERC Tokens", description: "Standard token interfaces on Ethereum." },
          { id: "crypto-wallets-blockchain", title: "Crypto Wallets", description: "Managing keys and signing transactions." },
        ],
      },
      {
        id: "smart-contract-frameworks",
        title: "Smart Contract Frameworks",
        topics: [{ id: "framework-list-blockchain", title: "Hardhat, Truffle, Brownie, Foundry", description: "Tooling for building, testing, and deploying contracts.", subtopics: ["Unit Tests", "Integration Tests", "Code Coverage"] }],
      },
      {
        id: "blockchain-security",
        title: "Security",
        videoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/",
        topics: [
          { id: "security-tools-blockchain", title: "Tools", description: "Slither, Manticore, MythX, Echidna." },
          { id: "security-practices-blockchain", title: "Practices", description: "Fuzz testing, static analysis, common threat vectors.", videoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/" },
        ],
      },
      {
        id: "dapps",
        title: "dApps - Decentralized Applications",
        topics: [
          { id: "dapp-languages", title: "Supporting Languages", description: "JavaScript, Go, Python." },
          { id: "dapp-client-libs", title: "Client Libraries", description: "ethers.js, web3.js, Moralis." },
          { id: "dapp-applicability", title: "Applicability", description: "DeFi, DAOs, NFTs, Payments, Insurance." },
        ],
      },
      {
        id: "building-for-scale-blockchain",
        title: "Building for Scale",
        topics: [{ id: "scaling-blockchain-topic", title: "State Channels, Optimistic/Zk Rollups, Validium, Plasma, Sidechains, Ethereum 2.0", description: "The major approaches to blockchain scalability." }],
      },
    ],
  },
  "cyber-security": {
    id: "cyber-security",
    label: "Cyber Security",
    tagline: "The exact roadmap.sh Cyber Security path — IT fundamentals through advanced attack knowledge.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/",
    heroVideoLabel: "freeCodeCamp: Cybersecurity and Ethical Hacking with Kali Linux",
    heroCertUrl: "https://www.coursera.org/professional-certificates/google-cybersecurity",
    heroCertLabel: "Google Cybersecurity Professional Certificate",
    sections: [
      {
        id: "fundamental-it-skills",
        title: "Fundamental IT Skills",
        videoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/",
        topics: [
          { id: "hardware-components-cs", title: "Computer Hardware Components", description: "The physical building blocks of a machine." },
          { id: "connection-types-cs", title: "Connection Types", description: "NFC, WiFi, Bluetooth, Infrared." },
          { id: "os-troubleshooting-cs", title: "OS-Independent Troubleshooting", description: "Diagnostic skills that transfer across operating systems." },
          { id: "ctfs", title: "CTFs (Capture the Flag)", description: "HackTheBox, TryHackMe, VulnHub, picoCTF, SANS Holiday Hack." },
          { id: "certifications-cs", title: "Certifications", description: "CompTIA A+/Network+/Security+, CCNA, CEH, CISSP, OSCP, and more.", certUrl: "https://www.comptia.org/certifications/security", certLabel: "CompTIA Security+" },
        ],
      },
      {
        id: "operating-systems-cs",
        title: "Operating Systems",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [{ id: "os-list-cs", title: "Windows, Linux, MacOS", description: "Installation, permissions, CLI, and troubleshooting across each OS.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" }],
      },
      {
        id: "networking-knowledge-cs",
        title: "Networking Knowledge",
        videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/",
        topics: [
          { id: "osi-model-cs", title: "OSI Model", description: "The seven-layer conceptual networking model.", videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/" },
          { id: "protocols-ports-cs", title: "Common Protocols and Ports", description: "The services that run on well-known ports.", videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/" },
          { id: "ssl-tls-basics-cs", title: "SSL and TLS Basics", description: "How encrypted connections are established." },
          { id: "subnetting-cs", title: "Basics of Subnetting", description: "Dividing networks into smaller segments." },
          { id: "virtualization-basics-cs", title: "Basics of Virtualization", description: "VMWare, VirtualBox, ESXi, Proxmox." },
          { id: "troubleshooting-tools-cs", title: "Troubleshooting Tools", description: "nmap, tcpdump, ping, dig, and more." },
          { id: "auth-methodologies-cs", title: "Authentication Methodologies", description: "Kerberos, RADIUS, LDAP, SSO." },
        ],
      },
      {
        id: "security-skills-knowledge",
        title: "Security Skills and Knowledge",
        videoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/",
        topics: [
          { id: "hacking-tools-cs", title: "Hacking Tools & Exploit Frameworks", description: "The core toolkit used in offensive security.", videoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/" },
          { id: "defense-in-depth", title: "Defense in Depth", description: "Layering multiple security controls." },
          { id: "threat-hunting-cs", title: "Threat Hunting & Vulnerability Management", description: "Proactively finding weaknesses before attackers do." },
          { id: "zero-trust-cs", title: "Zero Trust", description: "Never trust, always verify." },
          { id: "cia-triad", title: "CIA Triad", description: "Confidentiality, Integrity, Availability." },
          { id: "cryptography-basics-cs", title: "Basics of Cryptography", description: "Hashing, key exchange, PKI.", videoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/" },
          { id: "attack-types-cs", title: "Attack Types", description: "Phishing, social engineering, DoS/DDoS, MITM, SQL injection, XSS, and more.", videoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/" },
        ],
      },
      {
        id: "cloud-skills-cs",
        title: "Cloud Skills and Knowledge",
        videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
        topics: [{ id: "cloud-security-cs", title: "Security in the Cloud, SaaS/PaaS/IaaS, AWS/GCP/Azure", description: "How security changes once workloads move to the cloud.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" }],
      },
      {
        id: "programming-skills-cs",
        title: "Programming Skills",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [{ id: "prog-langs-cs", title: "Python, Go, JavaScript, C++, Bash, PowerShell", description: "Scripting for automation and tool building.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" }],
      },
    ],
  },
  "network-engineer": {
    id: "network-engineer",
    label: "Network Engineer",
    tagline: "The exact roadmap.sh Network Engineer path — internet fundamentals through observability.",
    heroVideoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/",
    heroVideoLabel: "freeCodeCamp: Computer Networking Fundamentals",
    heroCertUrl: "https://www.netacad.com/",
    heroCertLabel: "Cisco Networking Academy",
    sections: [
      {
        id: "introduction-ne",
        title: "Introduction",
        videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/",
        topics: [{ id: "internet-basics-ne", title: "How does the Internet Work?, Basic Terminology", description: "Client, server, bandwidth, latency, and core vocabulary.", videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/" }],
      },
      {
        id: "what-are-networks",
        title: "What are Networks?",
        topics: [{ id: "network-types-ne", title: "Network Types", description: "LAN, WAN, MAN, WLAN, PAN, SAN, VPN, Cloud." }],
      },
      {
        id: "network-devices",
        title: "Network Devices",
        topics: [{ id: "devices-list-ne", title: "Routers, Switches, Hub, Modems, Access Points", description: "The physical hardware networks are built from." }],
      },
      {
        id: "osi-model-ne",
        title: "OSI Model",
        videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/",
        topics: [{ id: "osi-layers-ne", title: "7 Layers", description: "Physical, Data Link, Network, Transport, Session, Presentation, Application.", videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/" }],
      },
      {
        id: "tcpip-model",
        title: "TCP/IP Model",
        topics: [{ id: "tcpip-layers", title: "Network Access, Internet, Transport, Application", description: "The practical 4-layer model networks actually run on." }],
      },
      {
        id: "ip-addressing-ne",
        title: "IP Addressing",
        topics: [{ id: "ip-topics-ne", title: "IPv4 vs IPv6, Public vs Private, IP vs MAC vs ARP", description: "How devices are identified on a network." }],
      },
      {
        id: "subnetting-ne",
        title: "Subnetting",
        topics: [{ id: "subnetting-topics-ne", title: "Subnet Masks, CIDR, VLSM, Supernetting", description: "Dividing and combining address space." }],
      },
      {
        id: "routing-ne",
        title: "Routing",
        topics: [{ id: "routing-topics-ne", title: "Static vs Dynamic, Default Gateway, BGP, OSPF, RIP, EIGRP, MPLS", description: "How traffic finds its way across networks." }],
      },
      {
        id: "switching-ne",
        title: "Switching",
        topics: [{ id: "switching-topics-ne", title: "VLANs, STP, Link Aggregation, MAC Address Tables", description: "Managing traffic within a local network." }],
      },
      {
        id: "dns-ne",
        title: "DNS",
        topics: [{ id: "dns-servers-ne", title: "Cloudflare, Google, OpenDNS, Quad9", description: "Public DNS resolvers." }],
      },
      {
        id: "core-protocols-ne",
        title: "Core Protocols",
        topics: [{ id: "protocols-list-ne", title: "HTTP/HTTPS, SSL/TLS, FTP/SFTP, SSH, NTP, SMTP/IMAP, DHCP", description: "The protocols that make a network usable." }],
      },
      {
        id: "wireless-networking",
        title: "Wireless Networking",
        topics: [{ id: "wireless-topics-ne", title: "WiFi Standards, Bluetooth, Mobile Networks, Wireless Security", description: "Networking without a cable." }],
      },
      {
        id: "load-balancer-ne",
        title: "Load Balancer",
        topics: [{ id: "lb-algorithms-ne", title: "Round Robin, Least Connections, Failover", description: "Distributing traffic across multiple servers." }],
      },
      {
        id: "qos",
        title: "QoS (Quality of Service)",
        topics: [{ id: "qos-topics", title: "Traffic shaping, Packet prioritization", description: "Ensuring critical traffic gets priority." }],
      },
      {
        id: "network-security-ne",
        title: "Network Security",
        videoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/",
        topics: [
          { id: "firewalls-ne", title: "Firewalls", description: "Packet filtering, stateful inspection, next-gen, proxy firewalls." },
          { id: "vpns-ne", title: "VPNs", description: "IPSec vs SSL VPN, site-to-site vs remote access." },
          { id: "network-attacks-ne", title: "Network Attacks", description: "DoS, DDoS, and other common attack types.", videoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/" },
          { id: "ids-ips-ne", title: "IDS / IPS", description: "Detecting and preventing intrusions." },
          { id: "zero-trust-ne", title: "Zero Trust Architecture", description: "Never trust, always verify." },
        ],
      },
      {
        id: "observability-ne",
        title: "Observability",
        videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo",
        topics: [{ id: "observability-tools-ne", title: "Wireshark, Nmap, NetFlow/sFlow, SNMP", description: "Watching what's actually happening on the wire.", videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo" }],
      },
    ],
  },
  "postgresql-dba": {
    id: "postgresql-dba",
    label: "PostgreSQL",
    tagline: "The exact roadmap.sh PostgreSQL path — RDBMS concepts through advanced tuning.",
    heroVideoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
    heroVideoLabel: "freeCodeCamp: Learn PostgreSQL — Full Course",
    heroCertUrl: "https://www.freecodecamp.org/learn/relational-database/",
    heroCertLabel: "freeCodeCamp: Relational Databases",
    sections: [
      {
        id: "introduction-pg",
        title: "Introduction",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        topics: [{ id: "rdbms-intro-pg", title: "What are Relational Databases?, PostgreSQL vs Other RDBMS/NoSQL", description: "Where PostgreSQL fits among database options.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" }],
      },
      {
        id: "basic-rdbms-concepts",
        title: "Basic RDBMS Concepts",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        topics: [
          { id: "object-model-pg", title: "Object Model", description: "Queries, Data Types, Rows, Columns, Tables, Schemas, Databases.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "relational-model-pg", title: "Relational Model", description: "Domains, Attributes, Tuples, Relations, Constraints, NULL." },
          { id: "high-level-db-concepts", title: "High Level Database Concepts", description: "ACID, MVCC, Transactions, Write-ahead Log, Query Processing." },
        ],
      },
      {
        id: "installation-setup-pg",
        title: "Installation and Setup",
        topics: [{ id: "install-topics-pg", title: "Using Docker, Package Managers, psql, Cloud Deployment", description: "Getting a Postgres instance running." }],
      },
      {
        id: "learn-sql-pg",
        title: "Learn SQL",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        topics: [
          { id: "ddl-queries-pg", title: "DDL Queries", description: "Creating schemas, tables, and data types.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "dml-queries-pg", title: "DML Queries", description: "Querying, filtering, modifying, and joining data.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
          { id: "advanced-sql-topics-pg", title: "Advanced Topics", description: "Transactions, subqueries, grouping, CTEs, lateral joins.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" },
        ],
      },
      {
        id: "configuring-pg",
        title: "Configuring",
        topics: [{ id: "config-topics-pg", title: "Resource Usage, WAL, Vacuums, Replication, Query Planner, Extensions", description: "Tuning postgresql.conf for your workload." }],
      },
      {
        id: "security-pg",
        title: "Security",
        topics: [{ id: "security-topics-pg", title: "Object Privileges, Row-Level Security, Roles, pg_hba.conf, SSL", description: "Controlling who can access what." }],
      },
      {
        id: "infrastructure-skills-pg",
        title: "Infrastructure Skills",
        topics: [{ id: "infra-topics-pg", title: "Upgrades, Cluster Management, Replication, Connection Pooling, Backup & Recovery", description: "Running Postgres reliably in production." }],
      },
      {
        id: "learn-automate-pg",
        title: "Learn to Automate",
        topics: [{ id: "automation-topics-pg", title: "Shell Scripts, Ansible, Salt, Puppet, Chef", description: "Automating routine DBA tasks." }],
      },
      {
        id: "application-skills-pg",
        title: "Application Skills",
        topics: [{ id: "app-skills-pg", title: "Migrations, Bulk Loading, Partitioning, Sharding, Normalization, Queues", description: "Data-layer concerns that touch application design." }],
      },
      {
        id: "advanced-topics-pg",
        title: "Advanced Topics",
        topics: [{ id: "advanced-pg-topics", title: "Low Level Internals, Fine-grained Tuning, Advanced SQL (PL/pgSQL, Triggers)", description: "Deep internals for high-scale Postgres operation." }],
      },
      {
        id: "troubleshooting-pg",
        title: "Troubleshooting Techniques",
        topics: [{ id: "troubleshooting-topics-pg", title: "System Views, Query Analysis (EXPLAIN), Profiling Tools, Log Analysis", description: "Diagnosing what's actually slow or broken." }],
      },
      {
        id: "sql-optimization-pg",
        title: "SQL Optimization Techniques",
        topics: [{ id: "optimization-topics-pg", title: "Query Patterns, Schema Design, Indexes (B-Tree, GiST, Hash, GIN, BRIN)", description: "Making queries fast at scale." }],
      },
      {
        id: "get-involved-pg",
        title: "Get Involved in Development",
        topics: [{ id: "contribute-pg", title: "Mailing Lists, Reviewing Patches, Writing Patches", description: "Contributing back to PostgreSQL itself." }],
      },
    ],
  },
  "software-architect": {
    id: "software-architect",
    label: "Software Architect",
    tagline: "The exact roadmap.sh Software Architect path — fundamentals through enterprise software.",
    heroVideoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/",
    heroVideoLabel: "freeCodeCamp: Microservices and Software System Design Course",
    heroCertUrl: "https://www.scholarhat.com/free-course/software-architecture-and-system-design-course",
    heroCertLabel: "ScholarHat: Software Architecture & System Design (Free Certificate)",
    sections: [
      {
        id: "basics-sa",
        title: "Understand the Basics",
        topics: [{ id: "architecture-levels-sa", title: "Application, Solution, and Enterprise Architecture", description: "The three altitudes a software architect operates at." }],
      },
      {
        id: "responsibilities-sa",
        title: "Responsibilities",
        topics: [{ id: "responsibilities-list-sa", title: "Tech Decisions, Design, Requirements, Documentation, Standards, Coaching", description: "What a software architect is actually accountable for." }],
      },
      {
        id: "important-skills-sa",
        title: "Important Skills to Learn",
        topics: [{ id: "skills-list-sa", title: "Design, Decision Making, Simplifying, Coding, Documentation, Communication", description: "The cross-cutting skills that separate great architects." }],
      },
      {
        id: "technical-skills-sa",
        title: "Technical Skills",
        videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/",
        topics: [
          { id: "languages-sa", title: "Programming Languages", description: "Java/Kotlin, Python, Go, JS/TS, .NET, and more." },
          {
            id: "patterns-principles-sa", title: "Patterns & Design Principles", description: "The foundational design vocabulary.",
            videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/",
            subtopics: ["OOP", "MVC, MVP, MVVM", "CQRS, Eventual Consistency", "ACID, CAP Theorem", "SOLID", "TDD", "DDD"],
          },
          { id: "architecture-styles-sa", title: "Architecture", description: "Microservices, Serverless, Client/Server, Layered, Distributed, SOA.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
          { id: "security-sa", title: "Security", description: "Hashing, PKI, OWASP, auth strategies.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "working-with-data-sa", title: "Working with Data", description: "Hadoop, Spark, ETL, SQL/NoSQL, analytics." },
          { id: "apis-integrations-sa", title: "APIs & Integrations", description: "gRPC, SOAP, REST, GraphQL, messaging queues.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" },
          { id: "web-mobile-sa", title: "Web, Mobile", description: "React/Vue/Angular, SPA/SSR/SSG, microfrontends." },
          { id: "networks-sa", title: "Networks", description: "OSI, TCP/IP, HTTP/HTTPS, proxies, firewalls.", videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/" },
          { id: "operations-knowledge-sa", title: "Operations Knowledge", description: "IaC, cloud, Linux, service mesh, CI/CD, containers.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
          { id: "enterprise-software-sa", title: "Enterprise Software", description: "MS Dynamics, SAP, IBM BPM, Salesforce." },
        ],
      },
    ],
  },
  "technical-writer": {
    id: "technical-writer",
    label: "Technical Writer",
    tagline: "The exact roadmap.sh Technical Writer path — foundations through content distribution.",
    heroVideoUrl: "https://www.freecodecamp.org/news/improve-your-technical-writing-skills-to-advance-your-career/",
    heroVideoLabel: "freeCodeCamp: Improve Your Technical Writing Skills",
    heroCertUrl: "https://www.coursera.org/learn/technical-writing-introduction",
    heroCertLabel: "Coursera: Introduction to Technical Writing",
    sections: [
      {
        id: "introduction-tw",
        title: "Introduction",
        videoUrl: "https://www.freecodecamp.org/news/improve-your-technical-writing-skills-to-advance-your-career/",
        topics: [{ id: "what-is-tech-writing", title: "Who is a Technical Writer?, What is Technical Writing?", description: "The role and its place inside an organization.", videoUrl: "https://www.freecodecamp.org/news/improve-your-technical-writing-skills-to-advance-your-career/" }],
      },
      {
        id: "required-skills-tw",
        title: "Required Skills",
        topics: [{ id: "skills-list-tw", title: "Technology Expertise, Language Proficiency, Written Communication", description: "The core competencies of a technical writer." }],
      },
      {
        id: "tooling-tw",
        title: "Tooling",
        topics: [{ id: "tools-list-tw", title: "Research Tools, Blogging Platforms, Publishing, SEO, Markdown, Git", description: "The tools technical writers use daily." }],
      },
      {
        id: "best-practices-tw",
        title: "Best Practices",
        topics: [{ id: "practices-list-tw", title: "Story Telling, Content Structure, Titles, Style Guides", description: "Writing that's actually read and understood." }],
      },
      {
        id: "content-research-tw",
        title: "Content Research",
        topics: [{ id: "research-list-tw", title: "Topic Score, Keyword Volume, Communities, Search Trends", description: "Finding out what to write about." }],
      },
      {
        id: "content-types-tw",
        title: "Types of Technical Content",
        topics: [
          { id: "product-content-tw", title: "Product Content", description: "General prose and how-to guides." },
          { id: "developer-docs-tw", title: "Developer Docs", description: "User goals, docs structure, API reference." },
          { id: "help-content-tw", title: "Help Content", description: "Troubleshooting and support docs." },
        ],
      },
      {
        id: "content-marketing-tw",
        title: "Technical Content Marketing",
        topics: [{ id: "marketing-topics-tw", title: "ICP & Buyer Persona, Buyer Journey & Content Funnel", description: "Aligning content with the buying process." }],
      },
      {
        id: "content-seo-tw",
        title: "Content SEO",
        topics: [{ id: "seo-topics-tw", title: "Backlinking, Short-tail & Long-tail Keywords", description: "Making content discoverable via search." }],
      },
      {
        id: "funnel-content-tw",
        title: "Funnel Content",
        topics: [{ id: "funnel-content-list", title: "Top, Mid, and Bottom-funnel Content", description: "Pillar posts, white-papers, and comparative/tutorial content." }],
      },
      {
        id: "content-analysis-tw",
        title: "Content Analysis",
        topics: [{ id: "analysis-list-tw", title: "Optimization, Link Tracking, Platform Metrics, Conversion Tracking", description: "Measuring whether content is actually working." }],
      },
      {
        id: "content-distribution-tw",
        title: "Content Distribution",
        topics: [{ id: "distribution-list-tw", title: "Canonical Link, OpenGraph, Distribution Channels", description: "Getting finished content in front of readers." }],
      },
    ],
  },
  devrel: {
    id: "devrel",
    label: "Developer Relations",
    tagline: "The exact roadmap.sh DevRel path — communication skills through career development.",
    heroVideoUrl: "https://www.youtube.com/watch?v=poLzjLt2yqU",
    heroVideoLabel: "freeCodeCamp: The Business of Building Apps",
    heroCertUrl: "https://learn.developermarketing.io/course/developer-relations-certified-masters",
    heroCertLabel: "Developer Relations: Certified Masters",
    sections: [
      {
        id: "what-is-devrel",
        title: "What is DevRel?",
        topics: [{ id: "devrel-intro-topic", title: "History, Key Concepts (Developer Experience, Journey, Marketing), Responsibilities", description: "Advocacy, education, community, and feedback in one role." }],
      },
      {
        id: "communication-skills-devrel",
        title: "Communication Skills",
        topics: [
          { id: "public-speaking-devrel", title: "Public Speaking", description: "Presentation technique, engaging an audience, handling Q&A." },
          { id: "writing-skills-devrel", title: "Writing Skills", description: "Social media, technical documentation, blog posts." },
          { id: "community-engagement-devrel", title: "Community Engagement", description: "Networking, online communities, event participation." },
        ],
      },
      {
        id: "technical-skills-devrel",
        title: "Technical Skills",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [
          { id: "basic-programming-devrel", title: "Basic Programming Skills", description: "JavaScript, Node.js, Go, Rust, Python.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" },
          { id: "apis-sdks-devrel", title: "APIs & SDKs", description: "Understanding APIs, building SDKs, writing docs.", videoUrl: "https://www.freecodecamp.org/news/apis-for-beginners/" },
          { id: "version-control-devrel", title: "Version Control", description: "Git, GitHub, managing issues and PRs.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
        ],
      },
      {
        id: "building-community-devrel",
        title: "Building a Community",
        topics: [{ id: "community-building-topics", title: "Identifying Audience, Platform Selection, Guidelines, Management, Events", description: "Growing and sustaining a developer community." }],
      },
      {
        id: "content-creation-devrel",
        title: "Content Creation",
        topics: [
          { id: "blogging-devrel", title: "Blogging", description: "Topic selection, writing process, SEO basics." },
          { id: "video-production-devrel", title: "Video Production", description: "Editing, recording, scripting." },
          { id: "live-streaming-devrel", title: "Live Streaming", description: "Platform selection and technical setup." },
          { id: "social-media-devrel", title: "Social Media", description: "Platform selection, content strategy, analytics." },
        ],
      },
      {
        id: "developer-onboarding-devrel",
        title: "Developer Onboarding",
        topics: [{ id: "onboarding-topics-devrel", title: "Documentation, Sample Projects, Support (Forums, Office Hours)", description: "Getting a new developer to their first success quickly." }],
      },
      {
        id: "metrics-analytics-devrel",
        title: "Metrics & Analytics",
        topics: [{ id: "metrics-topics-devrel", title: "Community Growth, Engagement, Content Performance, Reporting", description: "Proving DevRel's impact with numbers." }],
      },
      {
        id: "career-development-devrel",
        title: "Career Development",
        topics: [{ id: "career-topics-devrel", title: "Thought Leadership, Personal Brand, Networking, Continuous Learning", description: "Growing as a DevRel professional over time." }],
      },
    ],
  },
  devsecops: {
    id: "devsecops",
    label: "DevSecOps",
    tagline: "The exact roadmap.sh DevSecOps path — foundations through governance.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-cybersecurity-and-ethical-hacking-using-kali-linux/",
    heroVideoLabel: "freeCodeCamp: Cybersecurity and Ethical Hacking with Kali Linux",
    heroCertUrl: "https://www.comptia.org/certifications/security",
    heroCertLabel: "CompTIA Security+",
    sections: [
      {
        id: "introduction-dso",
        title: "Introduction",
        topics: [{ id: "devsecops-vs-devops", title: "DevSecOps vs DevOps", description: "Building security into the pipeline instead of bolting it on after." }],
      },
      {
        id: "programming-language-dso",
        title: "Learn a Programming Language",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [{ id: "languages-dso", title: "Ruby, Python, Rust, Go, JavaScript/Node.js", description: "Scripting security automation.", videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe" }],
      },
      {
        id: "scripting-knowledge-dso",
        title: "Scripting Knowledge",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [{ id: "scripting-tools-dso", title: "Bash, PowerShell, Vim/Nano/Emacs", description: "Automating security tasks from the terminal.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" }],
      },
      {
        id: "foundations-dso",
        title: "Learn the Foundations",
        videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/",
        topics: [
          { id: "cia-triad-dso", title: "CIA Triad, Authentication, Authorization", description: "The core security principles.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "owasp-top10-dso", title: "OWASP Top 10", description: "The most common web application vulnerabilities.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
          { id: "encryption-dso", title: "Encryption", description: "Symmetric and asymmetric encryption." },
          { id: "networking-basics-dso", title: "Networking Basics", description: "Firewalls, VLANs, ACLs, segmentation, DNS, HTTP, TLS.", videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/" },
          { id: "secure-coding-dso", title: "Secure Coding", description: "SQL injection prevention, XSS prevention, input validation.", videoUrl: "https://www.freecodecamp.org/news/learn-the-basics-of-api-security/" },
        ],
      },
      {
        id: "identity-basics-dso",
        title: "Identity Basics",
        topics: [{ id: "identity-topics-dso", title: "IAM, Least Privilege, Role Based Access", description: "Controlling who can do what." }],
      },
      {
        id: "monitoring-dso",
        title: "Monitoring",
        videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo",
        topics: [{ id: "monitoring-topics-dso", title: "SIEM, Alert Types, Log Analysis, Burp Suite, Nmap, Wireshark", description: "Watching for security events in real time.", videoUrl: "https://www.youtube.com/watch?v=hePmCMmekmo" }],
      },
      {
        id: "threats-risks-dso",
        title: "Managing Threats & Risks",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        topics: [
          { id: "threat-modeling-dso", title: "Threat Modeling", description: "STRIDE, PASTA, attack surface mapping." },
          { id: "cloud-security-dso", title: "Cloud Security", description: "CSPM, IAM, Key Management Service." },
          { id: "container-security-dso", title: "Container Security", description: "Docker, Kubernetes, image scanning, automated patching.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
        ],
      },
      {
        id: "secure-architecture-dso",
        title: "Secure Architecture",
        topics: [{ id: "secure-arch-topics", title: "Defense in Depth, Zero Trust, Secure API Design, IDS/IPS, Supply Chain Security", description: "Designing systems that are hard to compromise." }],
      },
      {
        id: "incident-response-dso",
        title: "Incident Response",
        topics: [{ id: "ir-topics-dso", title: "IR Lifecycle, Forensics, Containment, Root Cause Analysis", description: "What happens after something goes wrong." }],
      },
      {
        id: "enterprise-operations-dso",
        title: "Enterprise Operations",
        topics: [{ id: "enterprise-ops-topics", title: "EDR Strategy, SOAR Automation, Endpoint Detection", description: "Security operations at organizational scale." }],
      },
      {
        id: "governance-dso",
        title: "Governance",
        topics: [{ id: "governance-topics-dso", title: "Audit & Compliance, SOC 2, ISO 27001, NIST", description: "Proving your security posture to auditors and regulators.", certUrl: "https://www.comptia.org/certifications/security", certLabel: "CompTIA Security+" }],
      },
    ],
  },
  "engineering-manager": {
    id: "engineering-manager",
    label: "Engineering Manager",
    tagline: "The exact roadmap.sh Engineering Manager path — technical leadership through change management.",
    heroVideoUrl: "https://www.youtube.com/watch?v=poLzjLt2yqU",
    heroVideoLabel: "freeCodeCamp: The Business of Building Apps",
    heroCertUrl: "https://www.coursera.org/specializations/leadership-development-engineers",
    heroCertLabel: "Coursera: Leadership Development for Engineers (Rice University)",
    sections: [
      {
        id: "what-is-em",
        title: "What is Engineering Management?",
        topics: [{ id: "em-vs-tl-vs-ic", title: "EM vs Tech Lead vs IC, Key Focus Areas (People, Product, Process)", description: "How the EM role differs from adjacent ones." }],
      },
      {
        id: "technical-leadership-em",
        title: "Technical Leadership",
        videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/",
        topics: [
          { id: "foundational-knowledge-em", title: "Foundational Knowledge", description: "Software engineering background, system design, technical debt.", videoUrl: "https://www.freecodecamp.org/news/microservices-and-software-system-design-course/" },
          { id: "technical-strategy-em", title: "Technical Strategy", description: "Roadmapping, architectural decisions, build vs buy." },
          { id: "quality-process-em", title: "Quality and Process", description: "Monitoring, CI/CD, testing strategy, incident management." },
        ],
      },
      {
        id: "people-management-em",
        title: "People Management",
        topics: [
          { id: "team-development-em", title: "Team Development", description: "Hiring, team structure, performance evaluations, mentoring." },
          { id: "leadership-skills-em", title: "Leadership Skills", description: "Delegation, conflict resolution, feedback, motivation." },
          { id: "communication-em", title: "Communication", description: "1:1s, team meetings, status reporting, stakeholder management." },
        ],
      },
      {
        id: "project-management-em",
        title: "Project Management",
        topics: [
          { id: "project-planning-em", title: "Project Planning", description: "Agile methodologies, resource allocation, sprint planning." },
          { id: "execution-em", title: "Execution", description: "Project tracking, milestone management, scope management." },
          { id: "measurement-em", title: "Measurement", description: "KPI definition, velocity tracking, quality metrics." },
        ],
      },
      {
        id: "business-acumen-em",
        title: "Business Acumen",
        topics: [
          { id: "strategic-thinking-em", title: "Strategic Thinking", description: "Product strategy alignment, business case development, ROI." },
          { id: "financial-management-em", title: "Financial Management", description: "Budget planning, resource forecasting, cost optimization." },
          { id: "organizational-awareness-em", title: "Organizational Awareness", description: "Company culture, change management, politics navigation." },
        ],
      },
      {
        id: "culture-building-em",
        title: "Culture Building",
        topics: [
          { id: "team-culture-em", title: "Team Culture", description: "Values, inclusive environments, recognition programs." },
          { id: "engineering-culture-em", title: "Engineering Culture", description: "Innovation, learning culture, blameless post-mortems." },
        ],
      },
      {
        id: "crisis-management-em",
        title: "Crisis Management",
        topics: [
          { id: "incident-response-em", title: "Incident Response", description: "Emergency protocols, war room management, post-incident analysis." },
          { id: "risk-mitigation-em", title: "Risk Mitigation", description: "Contingency planning, disaster recovery, business continuity." },
        ],
      },
      {
        id: "stakeholder-management-em",
        title: "Stakeholder Management",
        topics: [
          { id: "executive-comm-em", title: "Executive Communication", description: "Board presentations, executive summaries, budget requests." },
          { id: "customer-relations-em", title: "Customer Relations", description: "Feedback integration, technical support, feature prioritization." },
          { id: "partner-management-em", title: "Partner Management", description: "Vendor relationships, technology partnerships." },
        ],
      },
      {
        id: "knowledge-management-em",
        title: "Knowledge Management",
        topics: [{ id: "knowledge-topics-em", title: "Documentation, Knowledge Transfer, Mentoring Programs, Tech Talks", description: "Making expertise durable beyond one person." }],
      },
      {
        id: "change-management-em",
        title: "Change Management",
        topics: [{ id: "change-topics-em", title: "Technical Change, Organizational Change, Team Change", description: "Leading a team through transitions." }],
      },
    ],
  },
  "forward-deployed-engineer": {
    id: "forward-deployed-engineer",
    label: "Forward Deployed Engineer",
    tagline: "The exact roadmap.sh Forward Deployed Engineer path — full-stack skills plus customer delivery.",
    heroVideoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/",
    heroVideoLabel: "freeCodeCamp: AI Engineering Roadmap",
    heroCertUrl: "https://adasci.org/courses/adasci-certified-forward-deployed-engineer",
    heroCertLabel: "ADaSci: Certified Forward Deployed Engineer",
    sections: [
      {
        id: "introduction-fde",
        title: "Introduction",
        topics: [{ id: "from-x-to-fde", title: "From X to FDE, Roles & Responsibilities", description: "How engineers from different backgrounds transition into this hybrid role." }],
      },
      {
        id: "frontend-skills-fde",
        title: "Frontend Skills",
        videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC",
        topics: [{ id: "frontend-fde-topic", title: "Building customer-facing UI quickly and reliably", description: "React/Next.js fluency for rapid client-site work.", videoUrl: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC" }],
      },
      {
        id: "backend-skills-fde",
        title: "Backend Skills",
        videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
        topics: [{ id: "backend-fde-topic", title: "APIs, databases, and integration work at a customer site", description: "Backend fluency for connecting to client systems.", videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/" }],
      },
      {
        id: "linux-skills-fde",
        title: "Linux Skills",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [{ id: "linux-fde-topic", title: "Operating comfortably in a client's infrastructure", description: "Command-line fluency for on-site debugging.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" }],
      },
      {
        id: "dsa-system-design-fde",
        title: "DSA & System Design",
        videoUrl: "https://www.freecodecamp.org/news/learn-software-system-design/",
        topics: [{ id: "dsa-sd-fde-topic", title: "Designing solutions that fit a specific customer's scale", description: "Applied system design under real constraints.", videoUrl: "https://www.freecodecamp.org/news/learn-software-system-design/" }],
      },
      {
        id: "ai-engineering-skills-fde",
        title: "AI Engineering Skills",
        videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/",
        topics: [{ id: "ai-fde-topic", title: "Integrating LLM-powered features into client deployments", description: "Practical AI integration skills.", videoUrl: "https://www.freecodecamp.org/news/ai-engineering-roadmap/" }],
      },
      {
        id: "devops-skills-fde",
        title: "DevOps Skills",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        topics: [{ id: "devops-fde-topic", title: "Deploying into a customer's own environment", description: "Containerization and CI/CD in unfamiliar infrastructure.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" }],
      },
      {
        id: "customer-delivery-fde",
        title: "Customer Delivery & Field Skills",
        topics: [
          { id: "discovery-scoping-fde", title: "Discovery & Scoping", description: "Requirements gathering, technical scoping, scope/speed/quality trade-offs." },
          { id: "business-acumen-fde", title: "Business Acumen", description: "Enterprise workflow, ROI & AI impact, stakeholder management." },
          { id: "communication-fde", title: "Communication", description: "Technical writing for non-technical stakeholders." },
        ],
      },
    ],
  },
  mlops: {
    id: "mlops",
    label: "MLOps",
    tagline: "The exact roadmap.sh MLOps path — programming fundamentals through observability.",
    heroVideoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
    heroVideoLabel: "freeCodeCamp: Docker Full Course",
    heroCertUrl: "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops",
    heroCertLabel: "DeepLearning.AI: MLOps Specialization",
    sections: [
      {
        id: "programming-fundamentals-mlops",
        title: "Programming Fundamentals",
        videoUrl: "https://www.youtube.com/playlist?list=PLRvbt2kZiDZSKMYNgP75_uoU4HcXgOhBe",
        topics: [{ id: "languages-mlops", title: "Python, Go, Bash", description: "The scripting languages MLOps runs on.", videoUrl: "https://www.freecodecamp.org/news/python-data-science-course-matplotlib-pandas-numpy/" }],
      },
      {
        id: "vcs-mlops",
        title: "Version Control Systems",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [{ id: "git-github-mlops", title: "Git, GitHub", description: "Versioning models, code, and configs.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" }],
      },
      {
        id: "cloud-computing-mlops",
        title: "Cloud Computing",
        videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
        topics: [{ id: "cloud-native-ml-mlops", title: "AWS / Azure / GCP, Cloud-native ML Services", description: "Managed infrastructure for training and serving models.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" }],
      },
      {
        id: "containerization-mlops",
        title: "Containerization",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        topics: [{ id: "docker-k8s-mlops", title: "Docker, Kubernetes", description: "Packaging and orchestrating ML workloads.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" }],
      },
      {
        id: "ml-fundamentals-mlops",
        title: "Machine Learning Fundamentals",
        videoUrl: "https://www.youtube.com/watch?v=hDKCxebp88A",
        topics: [{ id: "airflow-ml-mlops", title: "Airflow", description: "Orchestrating ML training and inference pipelines.", videoUrl: "https://www.freecodecamp.org/news/orchestrate-an-etl-data-pipeline-with-apache-airflow/" }],
      },
      {
        id: "data-engineering-fundamentals-mlops",
        title: "Data Engineering Fundamentals",
        videoUrl: "https://www.freecodecamp.org/news/orchestrate-an-etl-data-pipeline-with-apache-airflow/",
        topics: [{ id: "data-pipelines-mlops", title: "Data Pipelines, Data Lakes & Warehouses, Spark, Kafka, Flink", description: "The data infrastructure feeding ML systems.", videoUrl: "https://www.freecodecamp.org/news/orchestrate-an-etl-data-pipeline-with-apache-airflow/" }],
      },
      {
        id: "mlops-principles",
        title: "MLOps Principles",
        topics: [{ id: "mlops-principles-topic", title: "Reproducibility, automation, and monitoring for ML systems", description: "The core philosophy behind treating ML like production software." }],
      },
      {
        id: "mlops-components",
        title: "MLOps Components",
        topics: [{ id: "components-list-mlops", title: "Version Control, CI/CD, Orchestration, Experiment Tracking, Model Registry, Monitoring", description: "The building blocks of an MLOps platform." }],
      },
      {
        id: "iac-mlops",
        title: "Infrastructure as Code",
        videoUrl: "https://www.freecodecamp.org/news/learn-terraform-and-aws-by-building-a-dev-environment/",
        topics: [{ id: "iac-mlops-topic", title: "Terraform and equivalent tools for reproducible ML infrastructure", description: "Defining ML infrastructure declaratively.", videoUrl: "https://www.freecodecamp.org/news/learn-terraform-and-aws-by-building-a-dev-environment/" }],
      },
    ],
  },
  "product-manager": {
    id: "product-manager",
    label: "Product Manager",
    tagline: "The exact roadmap.sh Product Manager path — introduction through leadership.",
    heroVideoUrl: "https://www.youtube.com/watch?v=poLzjLt2yqU",
    heroVideoLabel: "freeCodeCamp: The Business of Building Apps",
    heroCertUrl: "https://www.coursera.org/specializations/product-management-certification",
    heroCertLabel: "Coursera: Product Management Certification",
    sections: [
      {
        id: "introduction-pm",
        title: "Introduction",
        videoUrl: "https://www.youtube.com/watch?v=poLzjLt2yqU",
        topics: [{ id: "what-is-pm", title: "What is Product Management?, Product vs Project Management, Key Skills", description: "Defining the role and how it differs from adjacent ones.", videoUrl: "https://www.youtube.com/watch?v=poLzjLt2yqU" }],
      },
      {
        id: "product-identification-pm",
        title: "Product Identification",
        topics: [{ id: "idea-generation-pm", title: "Idea Generation, Discovery Selection, Problem Framing", description: "Finding and validating what to build." }],
      },
      {
        id: "market-analysis-pm",
        title: "Market Analysis",
        topics: [{ id: "market-analysis-topics", title: "Identifying Market Needs, Competitive Analysis, Trends", description: "Understanding the landscape you're building into." }],
      },
      {
        id: "user-research-pm",
        title: "User Research",
        topics: [{ id: "user-research-topics", title: "User Personas, Interviews, Surveys, Ethnographic Research", description: "Understanding who you're actually building for." }],
      },
      {
        id: "positioning-pm",
        title: "Positioning",
        topics: [{ id: "positioning-topics", title: "USP, Market Segmentation, Case Studies", description: "Defining how your product stands apart." }],
      },
      {
        id: "vision-mission-pm",
        title: "Vision & Mission",
        topics: [{ id: "vision-topics-pm", title: "Statement, Proposition, Capabilities, Narrative", description: "Articulating why the product exists." }],
      },
      {
        id: "value-proposition-pm",
        title: "Value Proposition",
        topics: [{ id: "value-prop-topics", title: "Value Proposition Canvas, Value vs Features, Feature Creep", description: "Defining what makes the product worth using." }],
      },
      {
        id: "product-requirements-pm",
        title: "Product Requirements",
        topics: [{ id: "requirements-topics-pm", title: "Writing PRDs, User Stories, Job Stories", description: "Turning ideas into buildable specs." }],
      },
      {
        id: "product-roadmap-pm",
        title: "Product Roadmap",
        topics: [{ id: "roadmap-topics-pm", title: "Creating a Roadmap, Prioritising Features, Communicating the Roadmap", description: "Sequencing what gets built when." }],
      },
      {
        id: "agile-pm",
        title: "Agile Methodology",
        topics: [{ id: "agile-topics-pm", title: "Scrum, Kanban, Sprint Planning, MVP", description: "Working with engineering teams day to day." }],
      },
      {
        id: "go-to-market-pm",
        title: "Go-to-Market Strategy",
        topics: [{ id: "gtm-topics-pm", title: "Launch Planning, Marketing Strategies, Growth Hacking", description: "Getting the product in front of users." }],
      },
      {
        id: "key-metrics-pm",
        title: "Key Product Metrics",
        topics: [{ id: "metrics-topics-pm", title: "DAU/MAU, Conversion Rate, Retention, Churn, LTV, CAC, North Star Metric", description: "The numbers that tell you if the product is working." }],
      },
      {
        id: "data-driven-pm",
        title: "Data-Driven Decision Making",
        topics: [{ id: "data-driven-topics-pm", title: "A/B Testing, Cohort Analysis, Predictive Analytics", description: "Letting evidence guide product decisions." }],
      },
      {
        id: "communication-skills-pm",
        title: "Communication Skills",
        topics: [{ id: "comm-skills-topics-pm", title: "Business Communication, Difficult Conversations, Active Listening", description: "The interpersonal core of the PM role." }],
      },
      {
        id: "managing-stakeholders-pm",
        title: "Managing Stakeholders",
        topics: [{ id: "stakeholder-topics-pm", title: "Identifying, Mapping, and Engaging Stakeholders", description: "Keeping everyone aligned on priorities." }],
      },
      {
        id: "pm-tools-section",
        title: "Product Management Tools",
        topics: [{ id: "pm-tools-list", title: "Roadmapping (ProductBoard, Aha), PM (Jira, Linear), Analytics (Amplitude)", description: "The software a PM uses daily." }],
      },
      {
        id: "risk-management-pm",
        title: "Risk Management",
        topics: [{ id: "risk-topics-pm", title: "Identification, Assessment, Mitigation, Monitoring", description: "Managing what could go wrong." }],
      },
      {
        id: "advanced-topics-pm",
        title: "Advanced Topics",
        topics: [{ id: "advanced-pm-topics", title: "Scaling Products, Predictive/ML/AI Analysis, Portfolio Management", description: "Where the PM role goes at senior levels." }],
      },
      {
        id: "leadership-influence-pm",
        title: "Leadership and Influence",
        topics: [{ id: "leadership-topics-pm", title: "Building and Leading Teams, Influencing without Authority", description: "Leading without direct authority over engineering." }],
      },
    ],
  },
  "ux-design": {
    id: "ux-design",
    label: "UX Design",
    tagline: "The exact roadmap.sh UX Design path — human decision making through measuring impact.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-figma-for-ui-ux-design/",
    heroVideoLabel: "freeCodeCamp: Learn Figma for UI/UX Design",
    heroCertUrl: "https://www.coursera.org/professional-certificates/google-ux-design",
    heroCertLabel: "Google UX Design Professional Certificate",
    sections: [
      {
        id: "human-decision-making",
        title: "Human Decision Making",
        topics: [{ id: "decision-frameworks-ux", title: "Nudge Theory, Behavior Design, BJ Fogg's Behavior Model, Dual Process Theory", description: "The psychology underlying user behavior." }],
      },
      {
        id: "behavior-change-strategies",
        title: "Behavior Change Strategies",
        topics: [{ id: "behavior-change-list", title: "BJ Fogg's Behavior Grid, Nir Eyal's Hook Model, Cue Routine Reward", description: "Frameworks for designing habit-forming products." }],
      },
      {
        id: "classifying-behavior-ux",
        title: "Classifying Behavior",
        topics: [{ id: "behavior-classification", title: "Existing vs New Behavior, Cheating (Defaulting, Automation)", description: "Different strategies for different kinds of user behavior." }],
      },
      {
        id: "understanding-product-ux",
        title: "Understanding the Product",
        topics: [{ id: "clarify-product-ux", title: "Clarify Product (Target Outcome, Actor, Action), Define Target Users", description: "Getting precise about who and what before designing." }],
      },
      {
        id: "business-model-ux",
        title: "Business Model",
        topics: [{ id: "business-model-topics", title: "Business Model Canvas, Lean Canvas, Competitor Analysis (SWOT)", description: "Understanding the business the design serves." }],
      },
      {
        id: "conceptual-design-ux",
        title: "Conceptual Design",
        topics: [{ id: "conceptual-design-topics", title: "Product Backlog, User Stories, Flowcharts, BPMN", description: "Turning a concept into a structured plan." }],
      },
      {
        id: "prototyping-ux",
        title: "Prototyping",
        videoUrl: "https://www.freecodecamp.org/news/learn-figma-for-ui-ux-design/",
        topics: [{ id: "wireframing-ux", title: "Wireframing", description: "Figma, Adobe XD, Sketch, Balsamiq.", videoUrl: "https://www.freecodecamp.org/news/learn-figma-for-ui-ux-design/" }],
      },
      {
        id: "ux-best-practices",
        title: "UX Best Practices",
        topics: [{ id: "best-practices-list-ux", title: "Getting Attention, Positive Reaction, Favorable Evaluation, Urgency, Ease of Action", description: "The persuasion principles behind good UX." }],
      },
      {
        id: "measuring-impact-ux",
        title: "Measuring the Impact",
        topics: [{ id: "measuring-topics-ux", title: "Multivariate Testing, Incremental A/B Testing", description: "Validating whether a design change actually worked." }],
      },
    ],
  },
  "game-developer": {
    id: "game-developer",
    label: "Game Developer",
    tagline: "The exact roadmap.sh Game Developer path — math and physics through advanced rendering.",
    heroVideoUrl: "https://www.youtube.com/watch?v=gB1F9G0JXOo",
    heroVideoLabel: "freeCodeCamp: Learn Unity — Beginner's Game Development Tutorial",
    heroCertUrl: "https://unity.com/products/unity-certifications/associate-game-developer",
    heroCertLabel: "Unity Certified Associate: Game Developer",
    sections: [
      {
        id: "game-mathematics",
        title: "Game Mathematics",
        topics: [{ id: "math-topics-gd", title: "Linear Algebra, Geometry, Orientation, Curves, Projection", description: "The math underlying every game engine." }],
      },
      {
        id: "game-physics",
        title: "Game Physics",
        topics: [
          { id: "dynamics-gd", title: "Dynamics", description: "Center of mass, force, velocity, friction, restitution." },
          { id: "collision-detection-gd", title: "Collision Detection", description: "Narrow/broad phase, convexity, bounding volumes." },
        ],
      },
      {
        id: "game-engine-section",
        title: "Game Engine",
        videoUrl: "https://www.youtube.com/watch?v=gB1F9G0JXOo",
        topics: [{ id: "engines-list-gd", title: "Godot, Unreal Engine, Native, Unity 3D", description: "The major engines used to build games.", videoUrl: "https://www.youtube.com/watch?v=gB1F9G0JXOo" }],
      },
      {
        id: "programming-languages-gd",
        title: "Programming Languages",
        topics: [{ id: "languages-gd", title: "C#, C/C++, Rust, Python, GDScript", description: "The languages game engines are scripted in." }],
      },
      {
        id: "computer-graphics-gd",
        title: "Computer Graphics",
        topics: [{ id: "graphics-topics-gd", title: "Ray Tracing, Rasterization, Shaders, Lighting, Shadows, Texturing", description: "How a scene actually gets turned into pixels." }],
      },
      {
        id: "graphics-api-gd",
        title: "Graphics API",
        topics: [{ id: "graphics-apis-list", title: "DirectX, OpenGL, WebGL, Vulkan, Metal", description: "The low-level APIs graphics engines are built on." }],
      },
      {
        id: "game-ai",
        title: "Game AI",
        topics: [{ id: "game-ai-topics", title: "Decision Trees, State Machines, Behavior Trees, Pathfinding (Minimax, MCTS)", description: "Making non-player characters behave intelligently." }],
      },
      {
        id: "advanced-rendering-gd",
        title: "Advanced Rendering",
        topics: [{ id: "advanced-rendering-topics", title: "Physically-Based Rendering, Real-time Ray Tracing", description: "State-of-the-art rendering techniques." }],
      },
    ],
  },
  "server-side-game-developer": {
    id: "server-side-game-developer",
    label: "Server Side Game Developer",
    tagline: "The exact roadmap.sh Server-Side Game Developer path — networking protocols through AI.",
    heroVideoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/",
    heroVideoLabel: "freeCodeCamp: Computer Networking Fundamentals",
    heroCertUrl: "https://aws.amazon.com/training/learn-about/game-tech/",
    heroCertLabel: "AWS for Games: Digital Training",
    sections: [
      {
        id: "tcp-section",
        title: "TCP",
        videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/",
        topics: [{ id: "tcp-topics-ssgd", title: "Checksum, Segment Structure, Congestion Control, Reliable Transmission, Flow Control", description: "The reliable, ordered transport protocol most game servers build on.", videoUrl: "https://www.freecodecamp.org/news/free-computer-networking-course/" }],
      },
      {
        id: "udp-section",
        title: "UDP",
        topics: [{ id: "udp-topics-ssgd", title: "Reliability, Datagram, Congestion Control, Checksum, Packet Structure", description: "The low-latency, unreliable protocol used for real-time gameplay." }],
      },
      {
        id: "tcp-vs-udp",
        title: "TCP vs UDP",
        topics: [{ id: "tcp-udp-comparison", title: "Ordered vs Unordered, Reliable vs Unreliable, Streaming vs Broadcast", description: "Choosing the right transport for the right game system." }],
      },
      {
        id: "ip-section",
        title: "IP",
        topics: [{ id: "ip-topics-ssgd", title: "Addressing, Routing, IPv4, IPv6, ARP, DNS, DHCP, TLS", description: "The addressing layer underneath game networking." }],
      },
      {
        id: "programming-languages-ssgd",
        title: "Programming Languages",
        topics: [{ id: "languages-ssgd", title: "Java, C#, C/C++, Erlang, JavaScript, Go", description: "The languages used to build game servers." }],
      },
      {
        id: "socket-programming",
        title: "Socket Programming",
        topics: [{ id: "socket-topics-ssgd", title: "Byte Manipulation, Address Conversion, BSD Socket, Winsock", description: "The low-level networking API game servers are built on." }],
      },
      {
        id: "serialization-ssgd",
        title: "Serialization",
        topics: [{ id: "serialization-formats-ssgd", title: "JSON, TOML, XML, YAML, Protobuf", description: "Encoding game state to send over the network." }],
      },
      {
        id: "multithreading-ssgd",
        title: "Multithreading",
        topics: [{ id: "multithreading-topics-ssgd", title: "Sharding, Fiber, Thread Local Storage", description: "Scaling a game server across CPU cores." }],
      },
      {
        id: "synchronization-ssgd",
        title: "Synchronization",
        topics: [{ id: "sync-primitives-ssgd", title: "Mutex, Semaphore, Channel, Coroutine, Futures & Promises", description: "Coordinating concurrent access to shared game state." }],
      },
      {
        id: "databases-ssgd",
        title: "Databases",
        videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4",
        topics: [{ id: "db-types-ssgd", title: "RDBMS, NoSQL, Key-Value, ORM, DAL", description: "Persisting player and world state.", videoUrl: "https://www.youtube.com/watch?v=qw--VYLpxG4" }],
      },
      {
        id: "rpc-rest-ssgd",
        title: "RPC / REST",
        topics: [{ id: "rpc-rest-topics", title: "REST, gRPC", description: "How game services talk to each other." }],
      },
      {
        id: "message-queues-ssgd",
        title: "Message Queues",
        topics: [{ id: "mq-topics-ssgd", title: "Apache Kafka, RabbitMQ", description: "Decoupling game services with async messaging." }],
      },
      {
        id: "cloud-ssgd",
        title: "Cloud",
        videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
        topics: [{ id: "cloud-providers-ssgd", title: "Serverless, Azure, GCP, AWS", description: "Hosting game servers at scale.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" }],
      },
      {
        id: "containerization-ssgd",
        title: "Containerization",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        topics: [{ id: "container-tools-ssgd", title: "Docker, Docker Compose, Kubernetes", description: "Packaging and orchestrating game server instances.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" }],
      },
      {
        id: "ai-ssgd",
        title: "AI",
        videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY",
        topics: [{ id: "ai-topics-ssgd", title: "Cloud ML (Amazon ML, Azure ML), Deep Learning (TensorFlow, PyTorch)", description: "Server-side AI for matchmaking, anti-cheat, and NPC behavior.", videoUrl: "https://www.youtube.com/watch?v=GIsg-ZUy0MY" }],
      },
    ],
  },
  "html": {
    id: "html",
    label: "HTML",
    tagline: "The exact roadmap.sh HTML path — how the web works through accessibility and SEO basics.",
    heroVideoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/",
    heroVideoLabel: "freeCodeCamp: HTML Full Course for Beginners",
    heroCertUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
    heroCertLabel: "freeCodeCamp: Responsive Web Design Certification",
    sections: [
      {
        id: "how-the-web-works",
        title: "Introduction",
        videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/",
        topics: [
          { id: "html-markup-languages", title: "What are markup languages?", description: "HTML as a markup language, not a programming language.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "html-how-web-works", title: "How the web works", description: "HTTP, DNS, domain names, browsers, and hosting — the pieces behind every page load.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "html-seo-what-is", title: "What is SEO?", description: "Why markup choices affect how search engines read your page.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
        ],
      },
      {
        id: "html-basic-tags",
        title: "Basic Tags & Document Structure",
        videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/",
        certUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
        certLabel: "freeCodeCamp: Responsive Web Design",
        topics: [
          { id: "html-doctype-structure", title: "!DOCTYPE, html, head, body, meta", description: "The document skeleton every HTML page starts from.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "html-headings-text", title: "Headings & Text Tags", description: "h1–h6, p, strong/b, em/i, mark, and other basic text tags.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "html-links-lists", title: "Links & Lists", description: "Anchor tags, ordered/unordered/nested/definition lists.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "html-div-span", title: "div, span, class, id", description: "Grouping and identifying elements for styling and scripting.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "html-tables", title: "Tables", description: "table, tr, td, th for tabular data.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
        ],
      },
      {
        id: "html-forms",
        title: "Forms",
        videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/",
        topics: [
          { id: "html-forms-inputs", title: "Labels & Inputs", description: "Form controls and their accessible labels.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "html-form-validation", title: "Form Validation", description: "Built-in HTML validation attributes and their limitations.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "html-file-uploads", title: "File Uploads", description: "The file input type and upload constraints.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
        ],
      },
      {
        id: "html-semantic-a11y",
        title: "Semantic HTML & Accessibility",
        videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/",
        certUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
        certLabel: "freeCodeCamp: Responsive Web Design",
        topics: [
          { id: "html-semantic-tags", title: "Semantic Markup", description: "header, nav, main, article, section, aside, footer.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "html-accessibility-basics", title: "Accessibility", description: "Writing markup that works with assistive technology.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
        ],
      },
      {
        id: "html-media",
        title: "Media & Embedding",
        videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/",
        topics: [
          { id: "html-img-figure", title: "Images, Video, Audio", description: "img, video, audio tags and img vs figure.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "html-iframe", title: "iframe & Embedding", description: "Embedding other pages or media inline.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
        ],
      },
    ],
  },
  "css": {
    id: "css",
    label: "CSS",
    tagline: "The exact roadmap.sh CSS path — syntax basics through animations and responsive design.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/",
    heroVideoLabel: "freeCodeCamp: Learn CSS in this free 6-hour video course",
    heroCertUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
    heroCertLabel: "freeCodeCamp: Responsive Web Design Certification",
    sections: [
      {
        id: "css-syntax-basics",
        title: "Syntax Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/",
        topics: [
          { id: "css-inline-external-internal", title: "Inline, External & Internal CSS", description: "The three ways to attach styles to HTML, and cascading order.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
          { id: "css-selectors-declarations", title: "Selectors & Declarations", description: "Element, class, id, universal, grouping, and combinator selectors.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
          { id: "css-specificity", title: "CSS Specificity", description: "How the browser decides which conflicting rule wins.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
          { id: "css-units", title: "Units & Functions", description: "Absolute vs relative units, and CSS functions/variables.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
        ],
      },
      {
        id: "css-properties-values",
        title: "Properties & Values",
        videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/",
        topics: [
          { id: "css-fonts-text", title: "Fonts & Text Styling", description: "Font family, size, style, shorthand, and text alignment/decoration.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
          { id: "css-colors-backgrounds", title: "Colors & Backgrounds", description: "rgb/hsl/hex color, background color, image, gradient, and position.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
          { id: "css-box-model", title: "Box Model", description: "Padding, border, margin, width/height, and box-sizing.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
        ],
      },
      {
        id: "css-layouts",
        title: "Layouts",
        videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/",
        certUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
        certLabel: "freeCodeCamp: Responsive Web Design",
        topics: [
          { id: "css-display-position", title: "Display & Position", description: "block/inline/inline-block, position (relative, absolute, fixed, sticky).", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
          { id: "css-flexbox", title: "Flexbox", description: "One-dimensional layout for rows and columns.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
          { id: "css-grid", title: "Grid", description: "Two-dimensional layout for full page structures.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
        ],
      },
      {
        id: "css-responsiveness",
        title: "Responsiveness",
        videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/",
        topics: [
          { id: "css-media-queries", title: "Media & Container Queries", description: "Adapting layout based on viewport or container size.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
          { id: "css-responsive-typography", title: "Responsive Typography", description: "Fluid font sizing across screen sizes.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
        ],
      },
      {
        id: "css-methodologies",
        title: "Methodologies & Animations",
        videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/",
        topics: [
          { id: "css-bem-sass", title: "BEM, Sass, PostCSS, CSS Modules", description: "Naming conventions and preprocessing/tooling approaches for scaling CSS.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
          { id: "css-transitions-animations", title: "Transitions & Keyframe Animations", description: "Animating property changes over time.", videoUrl: "https://www.freecodecamp.org/news/learn-css-in-this-free-6-hour-video-course/" },
        ],
      },
    ],
  },
  "sql": {
    id: "sql",
    label: "SQL",
    tagline: "The exact roadmap.sh SQL path — relational database basics through advanced query techniques.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/",
    heroVideoLabel: "freeCodeCamp: Learn SQL — Full Course",
    heroCertUrl: "https://www.freecodecamp.org/learn/relational-database/",
    heroCertLabel: "freeCodeCamp: Relational Database Certification",
    sections: [
      {
        id: "sql-rdbms-basics",
        title: "Relational Databases",
        videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/",
        topics: [
          { id: "sql-what-is-rdbms", title: "What are Relational Databases?", description: "Tables, rows, columns, and how RDBMS differs from NoSQL.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
          { id: "sql-basic-syntax", title: "Basic SQL Syntax", description: "Keywords, data types, and operators.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
        ],
      },
      {
        id: "sql-ddl-dml",
        title: "DDL & DML",
        videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/",
        certUrl: "https://www.freecodecamp.org/learn/relational-database/",
        certLabel: "freeCodeCamp: Relational Database",
        topics: [
          { id: "sql-ddl", title: "Data Definition Language", description: "CREATE, ALTER, DROP, and TRUNCATE TABLE.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
          { id: "sql-dml", title: "Data Manipulation Language", description: "SELECT, INSERT, UPDATE, DELETE, WHERE, ORDER BY, GROUP BY, HAVING.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
          { id: "sql-constraints", title: "Data Constraints", description: "Primary key, foreign key, unique, NOT NULL, and CHECK.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
        ],
      },
      {
        id: "sql-joins-subqueries",
        title: "Joins & Subqueries",
        videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/",
        topics: [
          { id: "sql-join-types", title: "JOIN Types", description: "INNER, LEFT, RIGHT, FULL OUTER, self, and cross joins.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
          { id: "sql-subqueries", title: "Subqueries", description: "Scalar, nested, and correlated subqueries.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
          { id: "sql-aggregate-functions", title: "Aggregate Functions", description: "SUM, COUNT, AVG, MIN, MAX with GROUP BY and HAVING.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
        ],
      },
      {
        id: "sql-views-transactions",
        title: "Views, Indexes & Transactions",
        videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/",
        topics: [
          { id: "sql-views-indexes", title: "Views & Indexes", description: "Creating/modifying views, and managing indexes for query speed.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
          { id: "sql-transactions", title: "Transactions & ACID", description: "BEGIN, COMMIT, ROLLBACK, SAVEPOINT, and isolation levels.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
          { id: "sql-security", title: "Data Integrity & Security", description: "Constraints, GRANT/REVOKE, and database security best practices.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
        ],
      },
      {
        id: "sql-advanced",
        title: "Advanced SQL",
        videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/",
        topics: [
          { id: "sql-window-functions", title: "Window Functions", description: "ROW_NUMBER, RANK, DENSE_RANK, LEAD, LAG.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
          { id: "sql-cte-recursive", title: "CTEs & Recursive Queries", description: "Common table expressions and recursive query patterns.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
          { id: "sql-query-optimization", title: "Query Optimization", description: "Using indexes, optimizing joins, and reducing subqueries.", videoUrl: "https://www.freecodecamp.org/news/learn-sql-full-course/" },
        ],
      },
    ],
  },
  "java": {
    id: "java",
    label: "Java",
    tagline: "Core Java syntax through collections, exceptions, and modern concurrency.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-java-programming/",
    heroVideoLabel: "freeCodeCamp: Learn Java Programming (Version 17)",
    heroCertUrl: "https://learn.oracle.com/ols/learning-path/oracle-java-foundations/88323/79726",
    heroCertLabel: "Oracle Java Foundations (Free)",
    sections: [
      {
        id: "java-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/",
        certUrl: "https://learn.oracle.com/ols/learning-path/oracle-java-foundations/88323/79726",
        certLabel: "Oracle Java Foundations",
        topics: [
          { id: "java-syntax-vars", title: "Syntax, Variables & Data Types", description: "Primitives, variables, and Java's static typing.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
          { id: "java-control-flow", title: "Control Flow", description: "if/else, switch, loops, and operators.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
          { id: "java-methods", title: "Methods & Arrays", description: "Defining methods, overloading, and working with arrays.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
        ],
      },
      {
        id: "java-oop",
        title: "Object-Oriented Programming",
        videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/",
        topics: [
          { id: "java-classes-objects", title: "Classes & Objects", description: "Constructors, fields, and instance vs static members.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
          { id: "java-inheritance-poly", title: "Inheritance & Polymorphism", description: "Extending classes, overriding methods, and interfaces.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
          { id: "java-abstraction-encap", title: "Abstraction & Encapsulation", description: "Abstract classes, access modifiers, and interfaces vs abstract classes.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
        ],
      },
      {
        id: "java-collections",
        title: "Collections & Generics",
        videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/",
        topics: [
          { id: "java-collections-framework", title: "Collections Framework", description: "List, Set, Map, and choosing the right collection.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
          { id: "java-generics", title: "Generics", description: "Type-safe reusable classes and methods.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
        ],
      },
      {
        id: "java-exceptions",
        title: "Exception Handling",
        videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/",
        topics: [
          { id: "java-try-catch", title: "try/catch/finally", description: "Checked vs unchecked exceptions, and custom exception types.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
        ],
      },
      {
        id: "java-modern",
        title: "Streams & Concurrency",
        videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/",
        topics: [
          { id: "java-streams-lambdas", title: "Streams & Lambdas", description: "Functional-style operations over collections.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
          { id: "java-threads", title: "Threads & Concurrency", description: "Thread basics, synchronization, and the java.util.concurrent package.", videoUrl: "https://www.freecodecamp.org/news/learn-java-programming/" },
        ],
      },
    ],
  },
  "cpp": {
    id: "cpp",
    label: "C++",
    tagline: "From syntax and memory management through the STL and modern C++.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/",
    heroVideoLabel: "freeCodeCamp: Learn C++ Programming — 31-Hour Course",
    heroCertUrl: "https://cppinstitute.org/cpa",
    heroCertLabel: "C++ Institute: CPA — C++ Certified Associate Programmer",
    sections: [
      {
        id: "cpp-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/",
        certUrl: "https://cppinstitute.org/cpa",
        certLabel: "C++ Institute: CPA",
        topics: [
          { id: "cpp-syntax-types", title: "Syntax & Data Types", description: "Variables, primitive types, and compilation basics.", videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/" },
          { id: "cpp-control-functions", title: "Control Flow & Functions", description: "Loops, conditionals, and function overloading.", videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/" },
        ],
      },
      {
        id: "cpp-memory",
        title: "Memory & Pointers",
        videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/",
        topics: [
          { id: "cpp-pointers-refs", title: "Pointers & References", description: "Manual memory management and reference semantics.", videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/" },
          { id: "cpp-smart-pointers", title: "Smart Pointers", description: "unique_ptr, shared_ptr, and RAII for automatic cleanup.", videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/" },
        ],
      },
      {
        id: "cpp-oop",
        title: "Object-Oriented Programming",
        videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/",
        topics: [
          { id: "cpp-classes", title: "Classes & Inheritance", description: "Constructors, destructors, and virtual functions.", videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/" },
        ],
      },
      {
        id: "cpp-stl-templates",
        title: "STL & Templates",
        videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/",
        topics: [
          { id: "cpp-stl-containers", title: "STL Containers & Algorithms", description: "vector, map, set, and the <algorithm> header.", videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/" },
          { id: "cpp-templates", title: "Templates", description: "Generic functions and classes.", videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/" },
        ],
      },
      {
        id: "cpp-modern",
        title: "Modern C++",
        videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/",
        topics: [
          { id: "cpp-move-semantics", title: "Move Semantics", description: "Rvalue references and avoiding unnecessary copies.", videoUrl: "https://www.freecodecamp.org/news/learn-c-with-free-31-hour-course/" },
        ],
      },
    ],
  },
  "c-programming": {
    id: "c-programming",
    label: "C",
    tagline: "Low-level fundamentals — pointers, memory, and the standard library.",
    heroVideoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/",
    heroVideoLabel: "freeCodeCamp: Complete C Programming Course from Dr. Chuck",
    heroCertUrl: "https://cppinstitute.org/cla",
    heroCertLabel: "C++ Institute: CLA — C Certified Associate Programmer",
    sections: [
      {
        id: "c-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/",
        certUrl: "https://cppinstitute.org/cla",
        certLabel: "C++ Institute: CLA",
        topics: [
          { id: "c-syntax-vars", title: "Syntax & Variables", description: "Compilation, primitive types, and operators.", videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/" },
          { id: "c-control-flow", title: "Control Flow & Functions", description: "Loops, conditionals, and function declarations.", videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/" },
        ],
      },
      {
        id: "c-pointers-memory",
        title: "Pointers & Memory",
        videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/",
        topics: [
          { id: "c-pointers", title: "Pointers", description: "Pointer arithmetic and passing by reference.", videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/" },
          { id: "c-malloc-free", title: "Dynamic Memory (malloc/free)", description: "Manual heap allocation and avoiding memory leaks.", videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/" },
        ],
      },
      {
        id: "c-arrays-strings",
        title: "Arrays & Strings",
        videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/",
        topics: [
          { id: "c-arrays", title: "Arrays", description: "Fixed-size arrays and their relationship to pointers.", videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/" },
          { id: "c-strings", title: "C Strings", description: "Null-terminated char arrays and the string.h functions.", videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/" },
        ],
      },
      {
        id: "c-structs-files",
        title: "Structs & File I/O",
        videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/",
        topics: [
          { id: "c-structs", title: "Structs", description: "Grouping related data into custom types.", videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/" },
          { id: "c-file-io", title: "File I/O", description: "Reading and writing files with fopen/fread/fwrite.", videoUrl: "https://www.freecodecamp.org/news/complete-c-programming-course-from-dr-chuck/" },
        ],
      },
    ],
  },
  golang: {
    id: "golang",
    label: "Go",
    tagline: "Go's syntax, concurrency model, and standard library.",
    heroVideoUrl: "https://www.freecodecamp.org/news/go-golang-course/",
    heroVideoLabel: "freeCodeCamp: Learn Go (Golang) in 7 Hours",
    heroCertUrl: "https://coddy.tech/certification/go",
    heroCertLabel: "Coddy: Free Verified Go Certification",
    sections: [
      {
        id: "go-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/go-golang-course/",
        certUrl: "https://coddy.tech/certification/go",
        certLabel: "Coddy: Go Certification",
        topics: [
          { id: "go-syntax-types", title: "Syntax & Types", description: "Variables, static typing, and Go's minimal syntax.", videoUrl: "https://www.freecodecamp.org/news/go-golang-course/" },
          { id: "go-functions-structs", title: "Functions & Structs", description: "Multiple return values, structs, and methods.", videoUrl: "https://www.freecodecamp.org/news/go-golang-course/" },
        ],
      },
      {
        id: "go-concurrency",
        title: "Concurrency",
        videoUrl: "https://www.freecodecamp.org/news/go-golang-course/",
        topics: [
          { id: "go-goroutines", title: "Goroutines", description: "Lightweight concurrent functions.", videoUrl: "https://www.freecodecamp.org/news/go-golang-course/" },
          { id: "go-channels", title: "Channels", description: "Communicating between goroutines safely.", videoUrl: "https://www.freecodecamp.org/news/go-golang-course/" },
        ],
      },
      {
        id: "go-errors",
        title: "Error Handling",
        videoUrl: "https://www.freecodecamp.org/news/go-golang-course/",
        topics: [
          { id: "go-error-interface", title: "The error Interface", description: "Go's explicit, value-based error handling.", videoUrl: "https://www.freecodecamp.org/news/go-golang-course/" },
        ],
      },
      {
        id: "go-stdlib",
        title: "Standard Library & Modules",
        videoUrl: "https://www.freecodecamp.org/news/go-golang-course/",
        topics: [
          { id: "go-packages-modules", title: "Packages & Modules", description: "go.mod, imports, and organizing a Go project.", videoUrl: "https://www.freecodecamp.org/news/go-golang-course/" },
          { id: "go-net-http", title: "net/http", description: "Building HTTP servers with the standard library.", videoUrl: "https://www.freecodecamp.org/news/go-golang-course/" },
        ],
      },
    ],
  },
  "rust": {
    id: "rust",
    label: "Rust",
    tagline: "Ownership, borrowing, and safe systems programming.",
    heroVideoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/",
    heroVideoLabel: "freeCodeCamp: Rust Programming Course for Beginners",
    heroCertUrl: "https://coddy.tech/certification/rust",
    heroCertLabel: "Coddy: Free Verified Rust Certification",
    sections: [
      {
        id: "rust-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/",
        certUrl: "https://coddy.tech/certification/rust",
        certLabel: "Coddy: Rust Certification",
        topics: [
          { id: "rust-syntax-vars", title: "Syntax & Variables", description: "Immutability by default, and Rust's type system.", videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/" },
        ],
      },
      {
        id: "rust-ownership",
        title: "Ownership & Borrowing",
        videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/",
        topics: [
          { id: "rust-ownership-rules", title: "Ownership Rules", description: "How Rust manages memory without a garbage collector.", videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/" },
          { id: "rust-borrowing-refs", title: "Borrowing & References", description: "Shared and mutable references, and the borrow checker.", videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/" },
        ],
      },
      {
        id: "rust-types",
        title: "Structs & Enums",
        videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/",
        topics: [
          { id: "rust-structs", title: "Structs", description: "Custom data types and methods via impl blocks.", videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/" },
          { id: "rust-enums-match", title: "Enums & Pattern Matching", description: "Option, Result, and exhaustive match expressions.", videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/" },
        ],
      },
      {
        id: "rust-error-handling",
        title: "Error Handling",
        videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/",
        topics: [
          { id: "rust-result-option", title: "Result & Option", description: "Rust's alternative to exceptions and null.", videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/" },
        ],
      },
      {
        id: "rust-traits",
        title: "Traits & Generics",
        videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/",
        topics: [
          { id: "rust-traits-topic", title: "Traits", description: "Shared behavior across types, similar to interfaces.", videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/" },
          { id: "rust-generics-topic", title: "Generics", description: "Writing code that works over multiple types.", videoUrl: "https://www.freecodecamp.org/news/rust-programming-course-for-beginners/" },
        ],
      },
    ],
  },
  "php": {
    id: "php",
    label: "PHP",
    tagline: "Server-side scripting fundamentals through OOP and database access.",
    heroVideoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/",
    heroVideoLabel: "freeCodeCamp: PHP & WordPress — Build a Website from Start to Finish",
    heroCertUrl: "https://www.zend.com/training/php-certification-exam",
    heroCertLabel: "Zend: PHP Certified Engineer",
    sections: [
      {
        id: "php-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/",
        certUrl: "https://www.zend.com/training/php-certification-exam",
        certLabel: "Zend: PHP Certified Engineer",
        topics: [
          { id: "php-syntax-vars", title: "Syntax & Variables", description: "Embedding PHP in HTML, variables, and loose typing.", videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/" },
          { id: "php-functions-arrays", title: "Functions & Arrays", description: "Indexed and associative arrays, and array functions.", videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/" },
        ],
      },
      {
        id: "php-oop",
        title: "Object-Oriented PHP",
        videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/",
        topics: [
          { id: "php-classes-objects", title: "Classes & Objects", description: "Constructors, visibility, and inheritance in PHP.", videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/" },
        ],
      },
      {
        id: "php-forms-sessions",
        title: "Forms & Sessions",
        videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/",
        topics: [
          { id: "php-get-post", title: "GET/POST & Form Handling", description: "Processing form submissions and sanitizing input.", videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/" },
          { id: "php-sessions-cookies", title: "Sessions & Cookies", description: "Maintaining state across requests.", videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/" },
        ],
      },
      {
        id: "php-databases",
        title: "Working with Databases",
        videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/",
        topics: [
          { id: "php-pdo-mysqli", title: "PDO & MySQLi", description: "Connecting to MySQL and preventing SQL injection with prepared statements.", videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/" },
        ],
      },
      {
        id: "php-ecosystem",
        title: "Ecosystem",
        videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/",
        topics: [
          { id: "php-composer", title: "Composer & Packages", description: "PHP's dependency manager and the Packagist registry.", videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/" },
          { id: "php-frameworks-intro", title: "Frameworks (Laravel, Symfony)", description: "How modern PHP frameworks structure applications.", videoUrl: "https://www.freecodecamp.org/news/build-a-website-from-start-to-finish-using-wordpress-and-php/" },
        ],
      },
    ],
  },
  docker: {
    id: "docker",
    label: "Docker",
    tagline: "Containerizing applications — images, volumes, networking, and orchestration basics.",
    heroVideoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
    heroVideoLabel: "freeCodeCamp: Docker Full Course",
    heroCertUrl: "https://training.mirantis.com/certification/dca-certification-exam/",
    heroCertLabel: "Docker Certified Associate (DCA)",
    sections: [
      {
        id: "docker-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        certUrl: "https://training.mirantis.com/certification/dca-certification-exam/",
        certLabel: "Docker Certified Associate",
        topics: [
          { id: "docker-images-containers", title: "Images & Containers", description: "The difference between an image and a running container.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
          { id: "docker-dockerfile", title: "Dockerfile", description: "Building custom images layer by layer.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
        ],
      },
      {
        id: "docker-storage-network",
        title: "Volumes & Networking",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        topics: [
          { id: "docker-volumes", title: "Volumes & Bind Mounts", description: "Persisting data outside the container's writable layer.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
          { id: "docker-networking", title: "Container Networking", description: "Bridge networks and connecting containers to each other.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
        ],
      },
      {
        id: "docker-compose",
        title: "Docker Compose",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        topics: [
          { id: "docker-compose-topic", title: "Multi-Container Apps", description: "Defining and running multi-service applications with docker-compose.yml.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
        ],
      },
      {
        id: "docker-orchestration",
        title: "Orchestration Basics",
        videoUrl: "https://www.freecodecamp.org/news/docker-full-course/",
        topics: [
          { id: "docker-swarm-k8s-intro", title: "Docker Swarm & Kubernetes (Intro)", description: "Why you'd move from single-host Docker to an orchestrator.", videoUrl: "https://www.freecodecamp.org/news/docker-full-course/" },
        ],
      },
    ],
  },
  kubernetes: {
    id: "kubernetes",
    label: "Kubernetes",
    tagline: "Cluster architecture, workloads, and scheduling — through CKA-level topics.",
    heroVideoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/",
    heroVideoLabel: "freeCodeCamp: Certified Kubernetes Administrator (CKA) Course",
    heroCertUrl: "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/",
    heroCertLabel: "Linux Foundation: Certified Kubernetes Administrator (CKA)",
    sections: [
      {
        id: "k8s-architecture",
        title: "Cluster Architecture",
        videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/",
        certUrl: "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/",
        certLabel: "Linux Foundation: CKA",
        topics: [
          { id: "k8s-control-plane", title: "Control Plane & Nodes", description: "API server, etcd, scheduler, controller manager, and kubelet.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/" },
          { id: "k8s-pods", title: "Pods", description: "The smallest deployable unit in Kubernetes.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/" },
        ],
      },
      {
        id: "k8s-workloads",
        title: "Workloads & Scheduling",
        videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/",
        topics: [
          { id: "k8s-deployments", title: "Deployments & ReplicaSets", description: "Declarative updates and self-healing pod management.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/" },
          { id: "k8s-services", title: "Services & Ingress", description: "Exposing pods internally and externally.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/" },
        ],
      },
      {
        id: "k8s-config",
        title: "Configuration",
        videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/",
        topics: [
          { id: "k8s-configmaps-secrets", title: "ConfigMaps & Secrets", description: "Externalizing configuration and sensitive values.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/" },
          { id: "k8s-rbac", title: "RBAC", description: "Role-based access control for cluster resources.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/" },
        ],
      },
      {
        id: "k8s-troubleshooting",
        title: "Helm & Troubleshooting",
        videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/",
        topics: [
          { id: "k8s-helm", title: "Helm", description: "Package manager for templating and installing Kubernetes apps.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/" },
          { id: "k8s-debugging", title: "Debugging a Cluster", description: "Reading logs, describe/events, and diagnosing failing pods.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-the-kubernetes-administrator-certification-and-pass-2026-update/" },
        ],
      },
    ],
  },
  aws: {
    id: "aws",
    label: "AWS",
    tagline: "Core AWS services and cloud concepts — through Cloud Practitioner-level topics.",
    heroVideoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
    heroVideoLabel: "freeCodeCamp: AWS Certified Cloud Practitioner Course",
    heroCertUrl: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
    heroCertLabel: "AWS Certified Cloud Practitioner",
    sections: [
      {
        id: "aws-concepts",
        title: "Cloud Concepts",
        videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
        certUrl: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
        certLabel: "AWS Certified Cloud Practitioner",
        topics: [
          { id: "aws-global-infra", title: "AWS Global Infrastructure", description: "Regions, Availability Zones, and edge locations.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "aws-iam", title: "IAM", description: "Users, roles, policies, and the principle of least privilege.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
        ],
      },
      {
        id: "aws-compute",
        title: "Compute & Storage",
        videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
        topics: [
          { id: "aws-ec2", title: "EC2", description: "Virtual servers, instance types, and pricing models.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "aws-s3", title: "S3", description: "Object storage, buckets, and storage classes.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
        ],
      },
      {
        id: "aws-databases",
        title: "Databases & Networking",
        videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
        topics: [
          { id: "aws-rds-dynamo", title: "RDS & DynamoDB", description: "Managed relational databases vs. managed NoSQL.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "aws-vpc", title: "VPC", description: "Isolated virtual networks, subnets, and routing.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
        ],
      },
      {
        id: "aws-serverless",
        title: "Containers & Serverless",
        videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/",
        topics: [
          { id: "aws-lambda", title: "Lambda", description: "Running code without managing servers.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
          { id: "aws-ecs-eks", title: "ECS & EKS", description: "Running containers on AWS, managed and via Kubernetes.", videoUrl: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam-with-this-free-13-hour-course/" },
        ],
      },
    ],
  },
  terraform: {
    id: "terraform",
    label: "Terraform",
    tagline: "Infrastructure as Code — providers, state, and modules — through Terraform Associate topics.",
    heroVideoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/",
    heroVideoLabel: "freeCodeCamp: HashiCorp Terraform Associate Certification Course",
    heroCertUrl: "https://www.hashicorp.com/en/certification/terraform-associate",
    heroCertLabel: "HashiCorp Certified: Terraform Associate",
    sections: [
      {
        id: "terraform-basics",
        title: "IaC Basics",
        videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/",
        certUrl: "https://www.hashicorp.com/en/certification/terraform-associate",
        certLabel: "HashiCorp: Terraform Associate",
        topics: [
          { id: "terraform-hcl", title: "HCL Syntax", description: "Resources, providers, and Terraform's declarative language.", videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/" },
          { id: "terraform-providers", title: "Providers", description: "Connecting Terraform to AWS, Azure, GCP, and other platforms.", videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/" },
        ],
      },
      {
        id: "terraform-state",
        title: "State Management",
        videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/",
        topics: [
          { id: "terraform-state-topic", title: "Terraform State", description: "Tracking real infrastructure against your configuration.", videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/" },
          { id: "terraform-remote-backends", title: "Remote Backends", description: "Sharing state safely across a team.", videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/" },
        ],
      },
      {
        id: "terraform-variables",
        title: "Variables & Expressions",
        videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/",
        topics: [
          { id: "terraform-vars-outputs", title: "Variables & Outputs", description: "Parameterizing configuration and exposing values.", videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/" },
        ],
      },
      {
        id: "terraform-modules",
        title: "Modules & Workflow",
        videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/",
        topics: [
          { id: "terraform-modules-topic", title: "Modules", description: "Reusable, composable infrastructure definitions.", videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/" },
          { id: "terraform-plan-apply", title: "plan, apply, destroy", description: "The core Terraform workflow loop.", videoUrl: "https://www.freecodecamp.org/news/hashicorp-terraform-associate-certification-study-course-pass-the-exam-with-this-free-12-hour-course/" },
        ],
      },
    ],
  },
  linux: {
    id: "linux",
    label: "Linux",
    tagline: "The command line, file system, permissions, and system administration basics.",
    heroVideoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
    heroVideoLabel: "freeCodeCamp: Introduction to Linux (LFS101x)",
    heroCertUrl: "https://training.linuxfoundation.org/training/introduction-to-linux/",
    heroCertLabel: "Linux Foundation: Introduction to Linux (LFS101x)",
    sections: [
      {
        id: "linux-basics",
        title: "Command Line Basics",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        certUrl: "https://training.linuxfoundation.org/training/introduction-to-linux/",
        certLabel: "Linux Foundation: Introduction to Linux",
        topics: [
          { id: "linux-shell-basics", title: "The Shell", description: "Navigating the filesystem and running commands.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
          { id: "linux-file-system", title: "File System Hierarchy", description: "How Linux organizes directories like /etc, /var, and /home.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
        ],
      },
      {
        id: "linux-permissions",
        title: "Permissions & Users",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [
          { id: "linux-permissions-topic", title: "File Permissions", description: "chmod, chown, and the rwx permission model.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
          { id: "linux-users-groups", title: "Users & Groups", description: "Managing accounts and access.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
        ],
      },
      {
        id: "linux-processes",
        title: "Processes & Services",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [
          { id: "linux-processes-topic", title: "Processes", description: "ps, top, kill, and managing running processes.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
          { id: "linux-systemd", title: "systemd & Services", description: "Managing background services and startup.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
        ],
      },
      {
        id: "linux-scripting",
        title: "Shell Scripting",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [
          { id: "linux-bash-scripting", title: "Bash Scripting", description: "Automating tasks with shell scripts.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
        ],
      },
    ],
  },
  vue: {
    id: "vue",
    label: "Vue",
    tagline: "The progressive JavaScript framework — reactivity, components, and the Composition API.",
    heroVideoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/",
    heroVideoLabel: "freeCodeCamp: Vue 3 Full Course",
    heroCertUrl: "https://certificates.dev/vuejs",
    heroCertLabel: "Official Vue.js Developer Certification",
    sections: [
      {
        id: "vue-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/",
        certUrl: "https://certificates.dev/vuejs",
        certLabel: "Official Vue.js Certification",
        topics: [
          { id: "vue-templates-directives", title: "Templates & Directives", description: "v-bind, v-if, v-for, and Vue's template syntax.", videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/" },
          { id: "vue-reactivity", title: "Reactivity", description: "ref, reactive, and how Vue tracks state changes.", videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/" },
        ],
      },
      {
        id: "vue-components",
        title: "Components",
        videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/",
        topics: [
          { id: "vue-props-events", title: "Props & Events", description: "Passing data down and emitting events up.", videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/" },
          { id: "vue-composition-api", title: "Composition API", description: "setup(), composables, and organizing logic by feature.", videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/" },
        ],
      },
      {
        id: "vue-routing-state",
        title: "Routing & State",
        videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/",
        topics: [
          { id: "vue-router", title: "Vue Router", description: "Client-side routing for single-page apps.", videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/" },
          { id: "vue-pinia", title: "Pinia", description: "Vue's official state management library.", videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/" },
        ],
      },
      {
        id: "vue-ecosystem",
        title: "Ecosystem",
        videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/",
        topics: [
          { id: "vue-nuxt", title: "Nuxt", description: "The full-stack framework built on top of Vue.", videoUrl: "https://www.freecodecamp.org/news/vue-3-full-course/" },
        ],
      },
    ],
  },
  angular: {
    id: "angular",
    label: "Angular",
    tagline: "Components, dependency injection, and RxJS-powered reactive apps.",
    heroVideoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/",
    heroVideoLabel: "freeCodeCamp: Angular for Beginners Course",
    heroCertUrl: "https://certificates.dev/angular",
    heroCertLabel: "Official Angular Certification",
    sections: [
      {
        id: "angular-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/",
        certUrl: "https://certificates.dev/angular",
        certLabel: "Official Angular Certification",
        topics: [
          { id: "angular-components-templates", title: "Components & Templates", description: "Angular's component model and template syntax.", videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/" },
          { id: "angular-data-binding", title: "Data Binding", description: "Interpolation, property binding, and event binding.", videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/" },
        ],
      },
      {
        id: "angular-services-di",
        title: "Services & Dependency Injection",
        videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/",
        topics: [
          { id: "angular-services", title: "Services", description: "Sharing logic and state across components.", videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/" },
          { id: "angular-di", title: "Dependency Injection", description: "Angular's built-in DI system.", videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/" },
        ],
      },
      {
        id: "angular-rxjs",
        title: "RxJS & HTTP",
        videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/",
        topics: [
          { id: "angular-observables", title: "Observables", description: "RxJS streams and how Angular uses them for async data.", videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/" },
          { id: "angular-httpclient", title: "HttpClient", description: "Making API requests from an Angular app.", videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/" },
        ],
      },
      {
        id: "angular-routing",
        title: "Routing & Forms",
        videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/",
        topics: [
          { id: "angular-router", title: "Angular Router", description: "Navigation, route guards, and lazy loading.", videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/" },
          { id: "angular-forms", title: "Reactive Forms", description: "Form validation and reactive form controls.", videoUrl: "https://www.freecodecamp.org/news/angular-for-beginners-course/" },
        ],
      },
    ],
  },
  nextjs: {
    id: "nextjs",
    label: "Next.js",
    tagline: "The React framework for production — routing, rendering, and full-stack apps.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/",
    heroVideoLabel: "freeCodeCamp: Learn Next.js Tutorial",
    heroCertUrl: "https://scrimba.com/learn-nextjs-c02moisq6a",
    heroCertLabel: "Scrimba: Learn Next.js (Free, with Certificate)",
    sections: [
      {
        id: "nextjs-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/",
        certUrl: "https://scrimba.com/learn-nextjs-c02moisq6a",
        certLabel: "Scrimba: Learn Next.js",
        topics: [
          { id: "nextjs-app-router", title: "App Router", description: "File-based routing with the app/ directory.", videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/" },
          { id: "nextjs-layouts", title: "Layouts & Pages", description: "Shared layouts, nested routes, and page components.", videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/" },
        ],
      },
      {
        id: "nextjs-rendering",
        title: "Rendering Strategies",
        videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/",
        topics: [
          { id: "nextjs-ssr-ssg", title: "SSR, SSG & ISR", description: "Server-side rendering, static generation, and incremental static regeneration.", videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/" },
          { id: "nextjs-server-components", title: "Server Components", description: "React Server Components and the client/server boundary.", videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/" },
        ],
      },
      {
        id: "nextjs-data",
        title: "Data & API Routes",
        videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/",
        topics: [
          { id: "nextjs-data-fetching", title: "Data Fetching", description: "Fetching data in server components and route handlers.", videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/" },
          { id: "nextjs-api-routes", title: "API Routes", description: "Building backend endpoints inside a Next.js app.", videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/" },
        ],
      },
      {
        id: "nextjs-deployment",
        title: "Deployment",
        videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/",
        topics: [
          { id: "nextjs-vercel-deploy", title: "Deploying to Vercel", description: "Zero-config deployment and preview URLs.", videoUrl: "https://www.freecodecamp.org/news/learn-next-js-tutorial/" },
        ],
      },
    ],
  },
  kotlin: {
    id: "kotlin",
    label: "Kotlin",
    tagline: "Modern, concise JVM language basics through coroutines.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/",
    heroVideoLabel: "freeCodeCamp: Learn Kotlin — Complete Course",
    heroCertUrl: "https://hyperskill.org/tracks/18",
    heroCertLabel: "JetBrains Academy: Kotlin Core",
    sections: [
      {
        id: "kotlin-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/",
        certUrl: "https://hyperskill.org/tracks/18",
        certLabel: "JetBrains Academy: Kotlin Core",
        topics: [
          { id: "kotlin-syntax-vars", title: "Syntax & Null Safety", description: "Variables, type inference, and Kotlin's null-safety operators.", videoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/" },
          { id: "kotlin-functions", title: "Functions", description: "Default arguments, extension functions, and lambdas.", videoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/" },
        ],
      },
      {
        id: "kotlin-oop",
        title: "Classes & Objects",
        videoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/",
        topics: [
          { id: "kotlin-classes", title: "Classes & Data Classes", description: "Regular classes, data classes, and object declarations.", videoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/" },
          { id: "kotlin-sealed-classes", title: "Sealed Classes & Enums", description: "Modeling restricted class hierarchies.", videoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/" },
        ],
      },
      {
        id: "kotlin-collections",
        title: "Collections & Functional Style",
        videoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/",
        topics: [
          { id: "kotlin-collections-topic", title: "Collections", description: "List, Map, Set, and Kotlin's functional collection operators.", videoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/" },
        ],
      },
      {
        id: "kotlin-coroutines",
        title: "Coroutines",
        videoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/",
        topics: [
          { id: "kotlin-coroutines-topic", title: "Coroutines Basics", description: "Structured concurrency with suspend functions and launch/async.", videoUrl: "https://www.freecodecamp.org/news/learn-kotlin-complete-course/" },
        ],
      },
    ],
  },
  flutter: {
    id: "flutter",
    label: "Flutter",
    tagline: "Dart fundamentals through building cross-platform apps with widgets.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/",
    heroVideoLabel: "freeCodeCamp: Flutter Course for Beginners — 37 Hours",
    heroCertUrl: "https://www.mygreatlearning.com/academy/learn-for-free/courses/flutter-for-beginners",
    heroCertLabel: "Great Learning: Free Flutter Course with Certificate",
    sections: [
      {
        id: "flutter-dart",
        title: "Dart Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/",
        certUrl: "https://www.mygreatlearning.com/academy/learn-for-free/courses/flutter-for-beginners",
        certLabel: "Great Learning: Flutter for Beginners",
        topics: [
          { id: "flutter-dart-syntax", title: "Dart Syntax", description: "Variables, types, and null safety in Dart.", videoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/" },
        ],
      },
      {
        id: "flutter-widgets",
        title: "Widgets",
        videoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/",
        topics: [
          { id: "flutter-stateless-stateful", title: "Stateless & Stateful Widgets", description: "The two core widget types and when to use each.", videoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/" },
          { id: "flutter-layout-widgets", title: "Layout Widgets", description: "Row, Column, Stack, and building responsive layouts.", videoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/" },
        ],
      },
      {
        id: "flutter-navigation-state",
        title: "Navigation & State Management",
        videoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/",
        topics: [
          { id: "flutter-navigation", title: "Navigation & Routing", description: "Navigator, named routes, and passing data between screens.", videoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/" },
          { id: "flutter-state-mgmt", title: "State Management", description: "setState, Provider, and other state management approaches.", videoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/" },
        ],
      },
      {
        id: "flutter-backend",
        title: "Backend Integration",
        videoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/",
        topics: [
          { id: "flutter-firebase", title: "Firebase Integration", description: "Auth, Firestore, and connecting a Flutter app to a backend.", videoUrl: "https://www.freecodecamp.org/news/learn-flutter-full-course/" },
        ],
      },
    ],
  },
  "aspnet-core": {
    id: "aspnet-core",
    label: "ASP.NET Core",
    tagline: "Building web apps and APIs on .NET — MVC, Entity Framework, and dependency injection.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/",
    heroVideoLabel: "freeCodeCamp: Learn ASP.NET Core MVC with .NET 9",
    heroCertUrl: "https://www.freecodecamp.org/news/free-microsoft-c-sharp-certification/",
    heroCertLabel: "Microsoft & freeCodeCamp: Foundational C# Certification (Free)",
    sections: [
      {
        id: "aspnet-basics",
        title: "MVC Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/",
        certUrl: "https://www.freecodecamp.org/news/free-microsoft-c-sharp-certification/",
        certLabel: "Microsoft: Foundational C# Certification",
        topics: [
          { id: "aspnet-mvc-pattern", title: "Models, Views & Controllers", description: "How ASP.NET Core structures a web request.", videoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/" },
          { id: "aspnet-routing", title: "Routing", description: "Mapping URLs to controller actions.", videoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/" },
        ],
      },
      {
        id: "aspnet-data",
        title: "Data Access",
        videoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/",
        topics: [
          { id: "aspnet-ef-core", title: "Entity Framework Core", description: "The ORM for querying and persisting data.", videoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/" },
        ],
      },
      {
        id: "aspnet-di",
        title: "Dependency Injection & Middleware",
        videoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/",
        topics: [
          { id: "aspnet-di-topic", title: "Dependency Injection", description: "The built-in DI container and service lifetimes.", videoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/" },
          { id: "aspnet-middleware", title: "Middleware Pipeline", description: "How requests flow through the ASP.NET Core pipeline.", videoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/" },
        ],
      },
      {
        id: "aspnet-apis",
        title: "Web APIs",
        videoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/",
        topics: [
          { id: "aspnet-web-api", title: "Building REST APIs", description: "Controllers, model binding, and returning JSON.", videoUrl: "https://www.freecodecamp.org/news/learn-aspnet-core-mvc-with-net-9/" },
        ],
      },
    ],
  },
  "spring-boot": {
    id: "spring-boot",
    label: "Spring Boot",
    tagline: "Auto-configuration, dependency injection, and building production Java web apps.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/",
    heroVideoLabel: "freeCodeCamp: Learn App Development with Spring Boot 3",
    heroCertUrl: "https://www.broadcom.com/support/education/vmware/certification/spring-certified-pro",
    heroCertLabel: "VMware/Broadcom: Spring Certified Professional",
    sections: [
      {
        id: "springboot-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/",
        certUrl: "https://www.broadcom.com/support/education/vmware/certification/spring-certified-pro",
        certLabel: "Spring Certified Professional",
        topics: [
          { id: "springboot-autoconfig", title: "Auto-Configuration & Starters", description: "How Spring Boot removes boilerplate configuration.", videoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/" },
          { id: "springboot-di", title: "Dependency Injection", description: "Beans, @Autowired, and the Spring container.", videoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/" },
        ],
      },
      {
        id: "springboot-web",
        title: "Web Layer",
        videoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/",
        topics: [
          { id: "springboot-rest-controllers", title: "REST Controllers", description: "@RestController, @RequestMapping, and building JSON APIs.", videoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/" },
        ],
      },
      {
        id: "springboot-data",
        title: "Data Access",
        videoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/",
        topics: [
          { id: "springboot-jpa", title: "Spring Data JPA", description: "Repositories, entities, and Hibernate under the hood.", videoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/" },
        ],
      },
      {
        id: "springboot-production",
        title: "Production Readiness",
        videoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/",
        topics: [
          { id: "springboot-actuator", title: "Actuator & Profiles", description: "Health checks, metrics, and environment-specific configuration.", videoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/" },
          { id: "springboot-security", title: "Spring Security", description: "Authentication and authorization basics.", videoUrl: "https://www.freecodecamp.org/news/learn-app-development-with-spring-boot-3/" },
        ],
      },
    ],
  },
  laravel: {
    id: "laravel",
    label: "Laravel",
    tagline: "PHP's expressive framework — Eloquent, routing, and Blade templates.",
    heroVideoUrl: "https://www.freecodecamp.org/news/laravel-full-course/",
    heroVideoLabel: "freeCodeCamp: Learn Laravel by Creating an Instagram Clone",
    heroCertUrl: "https://www.vskills.in/certification/laravel-online-course",
    heroCertLabel: "Vskills: Certified Laravel Professional",
    sections: [
      {
        id: "laravel-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/laravel-full-course/",
        certUrl: "https://www.vskills.in/certification/laravel-online-course",
        certLabel: "Vskills: Certified Laravel Professional",
        topics: [
          { id: "laravel-routing-controllers", title: "Routing & Controllers", description: "Defining routes and handling requests.", videoUrl: "https://www.freecodecamp.org/news/laravel-full-course/" },
          { id: "laravel-blade", title: "Blade Templates", description: "Laravel's templating engine for views.", videoUrl: "https://www.freecodecamp.org/news/laravel-full-course/" },
        ],
      },
      {
        id: "laravel-eloquent",
        title: "Eloquent ORM",
        videoUrl: "https://www.freecodecamp.org/news/laravel-full-course/",
        topics: [
          { id: "laravel-models-migrations", title: "Models & Migrations", description: "Defining schema and mapping database tables to models.", videoUrl: "https://www.freecodecamp.org/news/laravel-full-course/" },
          { id: "laravel-relationships", title: "Eloquent Relationships", description: "hasMany, belongsTo, and many-to-many relationships.", videoUrl: "https://www.freecodecamp.org/news/laravel-full-course/" },
        ],
      },
      {
        id: "laravel-auth",
        title: "Authentication",
        videoUrl: "https://www.freecodecamp.org/news/laravel-full-course/",
        topics: [
          { id: "laravel-auth-topic", title: "Auth & Middleware", description: "Built-in authentication scaffolding and route middleware.", videoUrl: "https://www.freecodecamp.org/news/laravel-full-course/" },
        ],
      },
      {
        id: "laravel-ecosystem",
        title: "Ecosystem",
        videoUrl: "https://www.freecodecamp.org/news/laravel-full-course/",
        topics: [
          { id: "laravel-artisan", title: "Artisan CLI", description: "Code generation and task automation from the command line.", videoUrl: "https://www.freecodecamp.org/news/laravel-full-course/" },
        ],
      },
    ],
  },
  django: {
    id: "django",
    label: "Django",
    tagline: "Python's batteries-included web framework — models, views, templates, and the admin.",
    heroVideoUrl: "https://www.freecodecamp.org/news/python-django-course/",
    heroVideoLabel: "freeCodeCamp: Python Django Web Framework — Full Course",
    heroCertUrl: "https://www.studysection.com/django-foundation",
    heroCertLabel: "StudySection: Django Foundation Certification (Free)",
    sections: [
      {
        id: "django-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/python-django-course/",
        certUrl: "https://www.studysection.com/django-foundation",
        certLabel: "StudySection: Django Foundation",
        topics: [
          { id: "django-project-apps", title: "Projects & Apps", description: "Django's project/app structure and settings.", videoUrl: "https://www.freecodecamp.org/news/python-django-course/" },
          { id: "django-urls-views", title: "URLs & Views", description: "Routing requests to view functions or classes.", videoUrl: "https://www.freecodecamp.org/news/python-django-course/" },
        ],
      },
      {
        id: "django-models",
        title: "Models & ORM",
        videoUrl: "https://www.freecodecamp.org/news/python-django-course/",
        topics: [
          { id: "django-models-topic", title: "Models & Migrations", description: "Defining schema in Python and generating migrations.", videoUrl: "https://www.freecodecamp.org/news/python-django-course/" },
          { id: "django-admin", title: "Django Admin", description: "The auto-generated admin interface for managing data.", videoUrl: "https://www.freecodecamp.org/news/python-django-course/" },
        ],
      },
      {
        id: "django-templates",
        title: "Templates & Forms",
        videoUrl: "https://www.freecodecamp.org/news/python-django-course/",
        topics: [
          { id: "django-templates-topic", title: "Templates", description: "Django's template language for rendering HTML.", videoUrl: "https://www.freecodecamp.org/news/python-django-course/" },
          { id: "django-forms", title: "Forms & Validation", description: "Handling and validating user input.", videoUrl: "https://www.freecodecamp.org/news/python-django-course/" },
        ],
      },
      {
        id: "django-rest",
        title: "APIs",
        videoUrl: "https://www.freecodecamp.org/news/python-django-course/",
        topics: [
          { id: "django-rest-framework", title: "Django REST Framework", description: "Building REST APIs on top of Django models.", videoUrl: "https://www.freecodecamp.org/news/python-django-course/" },
        ],
      },
    ],
  },
  ruby: {
    id: "ruby",
    label: "Ruby",
    tagline: "Ruby's expressive syntax — blocks, classes, and metaprogramming basics.",
    heroVideoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY",
    heroVideoLabel: "freeCodeCamp: Ruby Programming Language — Full Course",
    heroCertUrl: "https://www.ruby.or.jp/en/certification/examination/",
    heroCertLabel: "Ruby Association Certified Ruby Programmer",
    sections: [
      {
        id: "ruby-basics",
        title: "Basics",
        videoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY",
        certUrl: "https://www.ruby.or.jp/en/certification/examination/",
        certLabel: "Ruby Association Certified Ruby Programmer",
        topics: [
          { id: "ruby-syntax-vars", title: "Syntax & Variables", description: "Ruby's readable, minimal-punctuation syntax.", videoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY" },
          { id: "ruby-blocks-procs", title: "Blocks, Procs & Lambdas", description: "Ruby's approach to passing chunks of code around.", videoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY" },
        ],
      },
      {
        id: "ruby-collections",
        title: "Arrays & Hashes",
        videoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY",
        topics: [
          { id: "ruby-arrays-hashes", title: "Arrays & Hashes", description: "Ruby's core collection types and enumerable methods.", videoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY" },
        ],
      },
      {
        id: "ruby-oop",
        title: "Classes & Modules",
        videoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY",
        topics: [
          { id: "ruby-classes-objects", title: "Classes & Objects", description: "Everything in Ruby is an object, including numbers.", videoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY" },
          { id: "ruby-modules-mixins", title: "Modules & Mixins", description: "Sharing behavior across classes without inheritance.", videoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY" },
        ],
      },
      {
        id: "ruby-errors",
        title: "Error Handling",
        videoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY",
        topics: [
          { id: "ruby-exceptions", title: "Exceptions", description: "begin/rescue/ensure and raising custom errors.", videoUrl: "https://www.youtube.com/watch?v=t_ispmWmdjY" },
        ],
      },
    ],
  },
  "ruby-on-rails": {
    id: "ruby-on-rails",
    label: "Ruby on Rails",
    tagline: "Convention over configuration — MVC, ActiveRecord, and rapid full-stack development.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/",
    heroVideoLabel: "freeCodeCamp: Learn Ruby on Rails — Full Course",
    heroCertUrl: "https://www.edchart.com/certificate/ruby-on-rails-certification",
    heroCertLabel: "EdChart: Ruby on Rails Certification",
    sections: [
      {
        id: "rails-basics",
        title: "MVC Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/",
        certUrl: "https://www.edchart.com/certificate/ruby-on-rails-certification",
        certLabel: "EdChart: Ruby on Rails Certification",
        topics: [
          { id: "rails-mvc", title: "MVC & Convention over Configuration", description: "How Rails' opinionated defaults speed up development.", videoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/" },
          { id: "rails-routing", title: "Routing", description: "RESTful routes and the routes.rb file.", videoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/" },
        ],
      },
      {
        id: "rails-activerecord",
        title: "ActiveRecord",
        videoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/",
        topics: [
          { id: "rails-models-migrations", title: "Models & Migrations", description: "ActiveRecord's ORM and schema migrations.", videoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/" },
          { id: "rails-associations", title: "Associations", description: "has_many, belongs_to, and has_and_belongs_to_many.", videoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/" },
        ],
      },
      {
        id: "rails-views",
        title: "Views & Forms",
        videoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/",
        topics: [
          { id: "rails-erb-views", title: "ERB Views & Partials", description: "Embedded Ruby templates and reusable view partials.", videoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/" },
        ],
      },
      {
        id: "rails-deployment",
        title: "Deployment",
        videoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/",
        topics: [
          { id: "rails-heroku-deploy", title: "Deploying to Heroku", description: "Getting a Rails app live.", videoUrl: "https://www.freecodecamp.org/news/learn-ruby-on-rails-video-course/" },
        ],
      },
    ],
  },
  mongodb: {
    id: "mongodb",
    label: "MongoDB",
    tagline: "Document modeling, queries, and aggregation in a NoSQL database.",
    heroVideoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/",
    heroVideoLabel: "freeCodeCamp: MongoDB Full Course with Node.js, Express & Mongoose",
    heroCertUrl: "https://learn.mongodb.com/",
    heroCertLabel: "MongoDB University (Official, Free)",
    sections: [
      {
        id: "mongodb-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/",
        certUrl: "https://learn.mongodb.com/",
        certLabel: "MongoDB University",
        topics: [
          { id: "mongodb-documents-collections", title: "Documents & Collections", description: "BSON documents, collections, and MongoDB's flexible schema.", videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/" },
          { id: "mongodb-crud", title: "CRUD Operations", description: "find, insertOne, updateOne, and deleteOne.", videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/" },
        ],
      },
      {
        id: "mongodb-modeling",
        title: "Data Modeling",
        videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/",
        topics: [
          { id: "mongodb-schema-design", title: "Schema Design", description: "Embedding vs. referencing related data.", videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/" },
          { id: "mongodb-mongoose", title: "Mongoose", description: "Schema validation and modeling for Node.js apps.", videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/" },
        ],
      },
      {
        id: "mongodb-aggregation",
        title: "Aggregation & Indexing",
        videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/",
        topics: [
          { id: "mongodb-aggregation-pipeline", title: "Aggregation Pipeline", description: "$match, $group, $project, and building query pipelines.", videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/" },
          { id: "mongodb-indexes", title: "Indexes", description: "Speeding up queries with single-field and compound indexes.", videoUrl: "https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/" },
        ],
      },
    ],
  },
  redis: {
    id: "redis",
    label: "Redis",
    tagline: "In-memory data structures for caching, sessions, and pub/sub.",
    heroVideoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/",
    heroVideoLabel: "freeCodeCamp: Redis Database Basics",
    heroCertUrl: "https://redis.io/tutorials/university/",
    heroCertLabel: "Redis University (Official, Free)",
    sections: [
      {
        id: "redis-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/",
        certUrl: "https://redis.io/tutorials/university/",
        certLabel: "Redis University",
        topics: [
          { id: "redis-data-types", title: "Data Types", description: "Strings, lists, sets, hashes, and sorted sets.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
          { id: "redis-cli", title: "The Redis CLI", description: "Common commands for reading and writing keys.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
        ],
      },
      {
        id: "redis-caching",
        title: "Caching",
        videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/",
        topics: [
          { id: "redis-cache-patterns", title: "Caching Patterns", description: "Cache-aside, write-through, and expiration (TTL).", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
        ],
      },
      {
        id: "redis-pubsub",
        title: "Pub/Sub & Streams",
        videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/",
        topics: [
          { id: "redis-pubsub-topic", title: "Pub/Sub", description: "Publishing and subscribing to channels for real-time messaging.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
          { id: "redis-streams", title: "Redis Streams", description: "An append-only log structure for event data.", videoUrl: "https://www.freecodecamp.org/news/how-to-learn-redis/" },
        ],
      },
    ],
  },
  elasticsearch: {
    id: "elasticsearch",
    label: "Elasticsearch",
    tagline: "Full-text search and analytics — indexing, querying, and the Elastic Stack.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-elasticsearch-with-a-comprehensive-beginner-friendly-course/",
    heroVideoLabel: "freeCodeCamp: Learn Elasticsearch — Comprehensive Beginner Course",
    heroCertUrl: "https://www.elastic.co/training/elastic-certified-engineer-exam",
    heroCertLabel: "Elastic Certified Engineer",
    sections: [
      {
        id: "elasticsearch-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-elasticsearch-with-a-comprehensive-beginner-friendly-course/",
        certUrl: "https://www.elastic.co/training/elastic-certified-engineer-exam",
        certLabel: "Elastic Certified Engineer",
        topics: [
          { id: "elasticsearch-indices-docs", title: "Indices & Documents", description: "How Elasticsearch stores and organizes JSON documents.", videoUrl: "https://www.freecodecamp.org/news/learn-elasticsearch-with-a-comprehensive-beginner-friendly-course/" },
          { id: "elasticsearch-mapping", title: "Mapping", description: "Defining field types for how data gets indexed.", videoUrl: "https://www.freecodecamp.org/news/learn-elasticsearch-with-a-comprehensive-beginner-friendly-course/" },
        ],
      },
      {
        id: "elasticsearch-querying",
        title: "Querying",
        videoUrl: "https://www.freecodecamp.org/news/learn-elasticsearch-with-a-comprehensive-beginner-friendly-course/",
        topics: [
          { id: "elasticsearch-query-dsl", title: "Query DSL", description: "match, term, and bool queries.", videoUrl: "https://www.freecodecamp.org/news/learn-elasticsearch-with-a-comprehensive-beginner-friendly-course/" },
          { id: "elasticsearch-full-text-search", title: "Full-Text Search", description: "Analyzers, tokenizers, and relevance scoring.", videoUrl: "https://www.freecodecamp.org/news/learn-elasticsearch-with-a-comprehensive-beginner-friendly-course/" },
        ],
      },
      {
        id: "elasticsearch-stack",
        title: "The Elastic Stack",
        videoUrl: "https://www.freecodecamp.org/news/learn-elasticsearch-with-a-comprehensive-beginner-friendly-course/",
        topics: [
          { id: "elasticsearch-kibana", title: "Kibana", description: "Visualizing and exploring data indexed in Elasticsearch.", videoUrl: "https://www.freecodecamp.org/news/learn-elasticsearch-with-a-comprehensive-beginner-friendly-course/" },
          { id: "elasticsearch-logstash", title: "Logstash", description: "Ingesting and transforming data before it reaches Elasticsearch.", videoUrl: "https://www.freecodecamp.org/news/learn-elasticsearch-with-a-comprehensive-beginner-friendly-course/" },
        ],
      },
    ],
  },
  cloudflare: {
    id: "cloudflare",
    label: "Cloudflare",
    tagline: "Edge networking, Workers, and Cloudflare's developer platform.",
    heroVideoUrl: "https://developers.cloudflare.com/workers/get-started/guide/",
    heroVideoLabel: "Cloudflare: Workers Get Started Guide",
    heroCertUrl: "https://learn.cloudflare.com/",
    heroCertLabel: "Cloudflare University (Official, Free)",
    sections: [
      {
        id: "cloudflare-basics",
        title: "Basics",
        videoUrl: "https://developers.cloudflare.com/workers/get-started/guide/",
        certUrl: "https://learn.cloudflare.com/",
        certLabel: "Cloudflare University",
        topics: [
          { id: "cloudflare-dns-cdn", title: "DNS & CDN", description: "How Cloudflare sits in front of your origin server.", videoUrl: "https://developers.cloudflare.com/workers/get-started/guide/" },
          { id: "cloudflare-ssl", title: "SSL/TLS", description: "Encryption modes and certificate management.", videoUrl: "https://developers.cloudflare.com/workers/get-started/guide/" },
        ],
      },
      {
        id: "cloudflare-workers",
        title: "Workers",
        videoUrl: "https://developers.cloudflare.com/workers/get-started/guide/",
        topics: [
          { id: "cloudflare-workers-topic", title: "Cloudflare Workers", description: "Serverless functions running on Cloudflare's edge network.", videoUrl: "https://developers.cloudflare.com/workers/get-started/guide/" },
          { id: "cloudflare-kv-d1", title: "KV & D1", description: "Edge key-value storage and Cloudflare's serverless SQL database.", videoUrl: "https://developers.cloudflare.com/workers/get-started/guide/" },
        ],
      },
      {
        id: "cloudflare-security",
        title: "Security",
        videoUrl: "https://developers.cloudflare.com/workers/get-started/guide/",
        topics: [
          { id: "cloudflare-waf", title: "WAF & Firewall Rules", description: "Filtering malicious traffic at the edge.", videoUrl: "https://developers.cloudflare.com/workers/get-started/guide/" },
        ],
      },
    ],
  },
  "shell-bash": {
    id: "shell-bash",
    label: "Shell / Bash",
    tagline: "The command line and shell scripting for automation.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-bash-scripting-tutorial/",
    heroVideoLabel: "freeCodeCamp: Use Bash Scripting to Enhance Your Productivity",
    heroCertUrl: "https://www.freecodecamp.org/learn/learn-bash-scripting",
    heroCertLabel: "freeCodeCamp: Learn Bash Scripting (Certification)",
    sections: [
      {
        id: "bash-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-bash-scripting-tutorial/",
        certUrl: "https://www.freecodecamp.org/learn/learn-bash-scripting",
        certLabel: "freeCodeCamp: Learn Bash Scripting",
        topics: [
          { id: "bash-commands", title: "Basic Commands", description: "Navigating and manipulating files from the command line.", videoUrl: "https://www.freecodecamp.org/news/learn-bash-scripting-tutorial/" },
          { id: "bash-variables-args", title: "Variables & Positional Arguments", description: "Storing values and reading script arguments.", videoUrl: "https://www.freecodecamp.org/news/learn-bash-scripting-tutorial/" },
        ],
      },
      {
        id: "bash-control-flow",
        title: "Control Flow",
        videoUrl: "https://www.freecodecamp.org/news/learn-bash-scripting-tutorial/",
        topics: [
          { id: "bash-conditionals", title: "if/elif/else & case", description: "Conditional logic in shell scripts.", videoUrl: "https://www.freecodecamp.org/news/learn-bash-scripting-tutorial/" },
          { id: "bash-loops", title: "Loops", description: "for and while loops for repeating tasks.", videoUrl: "https://www.freecodecamp.org/news/learn-bash-scripting-tutorial/" },
        ],
      },
      {
        id: "bash-io",
        title: "I/O & Text Processing",
        videoUrl: "https://www.freecodecamp.org/news/learn-bash-scripting-tutorial/",
        topics: [
          { id: "bash-redirection", title: "Redirection & Pipes", description: "stdin, stdout, stderr, and chaining commands.", videoUrl: "https://www.freecodecamp.org/news/learn-bash-scripting-tutorial/" },
          { id: "bash-awk-sed", title: "AWK & Sed", description: "Text processing tools for parsing and transforming output.", videoUrl: "https://www.freecodecamp.org/news/learn-bash-scripting-tutorial/" },
        ],
      },
    ],
  },
  "react-native": {
    id: "react-native",
    label: "React Native",
    tagline: "Building native iOS & Android apps with React — components, navigation, and native modules.",
    heroVideoUrl: "https://www.freecodecamp.org/news/react-native-full-course-android-ios-development/",
    heroVideoLabel: "freeCodeCamp: React Native Full Course",
    heroCertUrl: "https://www.coursera.org/specializations/meta-react-native",
    heroCertLabel: "Meta React Native Specialization",
    sections: [
      {
        id: "rn-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/react-native-full-course-android-ios-development/",
        certUrl: "https://www.coursera.org/specializations/meta-react-native",
        certLabel: "Meta React Native Specialization",
        topics: [
          { id: "rn-core-components", title: "Core Components", description: "View, Text, Image, and other built-in native components.", videoUrl: "https://www.freecodecamp.org/news/react-native-full-course-android-ios-development/" },
          { id: "rn-styling", title: "Styling", description: "Flexbox-based styling with StyleSheet.", videoUrl: "https://www.freecodecamp.org/news/react-native-full-course-android-ios-development/" },
        ],
      },
      {
        id: "rn-navigation",
        title: "Navigation",
        videoUrl: "https://www.freecodecamp.org/news/react-native-full-course-android-ios-development/",
        topics: [
          { id: "rn-react-navigation", title: "React Navigation", description: "Stack, tab, and drawer navigators.", videoUrl: "https://www.freecodecamp.org/news/react-native-full-course-android-ios-development/" },
        ],
      },
      {
        id: "rn-native-features",
        title: "Native Features",
        videoUrl: "https://www.freecodecamp.org/news/react-native-full-course-android-ios-development/",
        topics: [
          { id: "rn-native-modules", title: "Native Modules & APIs", description: "Camera, location, and other device APIs.", videoUrl: "https://www.freecodecamp.org/news/react-native-full-course-android-ios-development/" },
          { id: "rn-expo", title: "Expo", description: "The managed workflow for faster React Native development.", videoUrl: "https://www.freecodecamp.org/news/react-native-full-course-android-ios-development/" },
        ],
      },
    ],
  },
  "swift-ui": {
    id: "swift-ui",
    label: "Swift & SwiftUI",
    tagline: "Declarative UI for iOS — views, state, and navigation with SwiftUI.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-swiftui-and-create-an-ios-app-from-scratch/",
    heroVideoLabel: "freeCodeCamp: Learn SwiftUI and Create an iOS App from Scratch",
    heroCertUrl: "https://www.mygreatlearning.com/academy/learn-for-free/courses/swift-tutorial",
    heroCertLabel: "Great Learning: Free Swift Course with Certificate",
    sections: [
      {
        id: "swiftui-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-swiftui-and-create-an-ios-app-from-scratch/",
        certUrl: "https://www.mygreatlearning.com/academy/learn-for-free/courses/swift-tutorial",
        certLabel: "Great Learning: Swift Course",
        topics: [
          { id: "swiftui-views", title: "Views & Modifiers", description: "SwiftUI's declarative view syntax and modifier chaining.", videoUrl: "https://www.freecodecamp.org/news/learn-swiftui-and-create-an-ios-app-from-scratch/" },
          { id: "swiftui-layout", title: "Stacks & Layout", description: "VStack, HStack, ZStack for composing layouts.", videoUrl: "https://www.freecodecamp.org/news/learn-swiftui-and-create-an-ios-app-from-scratch/" },
        ],
      },
      {
        id: "swiftui-state",
        title: "State Management",
        videoUrl: "https://www.freecodecamp.org/news/learn-swiftui-and-create-an-ios-app-from-scratch/",
        topics: [
          { id: "swiftui-state-topic", title: "@State & @Binding", description: "Local view state and two-way data flow.", videoUrl: "https://www.freecodecamp.org/news/learn-swiftui-and-create-an-ios-app-from-scratch/" },
          { id: "swiftui-observable", title: "@Observable & Environment", description: "Sharing state across a view hierarchy.", videoUrl: "https://www.freecodecamp.org/news/learn-swiftui-and-create-an-ios-app-from-scratch/" },
        ],
      },
      {
        id: "swiftui-navigation",
        title: "Navigation & Data",
        videoUrl: "https://www.freecodecamp.org/news/learn-swiftui-and-create-an-ios-app-from-scratch/",
        topics: [
          { id: "swiftui-navigationstack", title: "NavigationStack", description: "Push/pop navigation between SwiftUI views.", videoUrl: "https://www.freecodecamp.org/news/learn-swiftui-and-create-an-ios-app-from-scratch/" },
          { id: "swiftui-swiftdata", title: "SwiftData", description: "Apple's modern persistence framework for SwiftUI apps.", videoUrl: "https://www.freecodecamp.org/news/learn-swiftui-and-create-an-ios-app-from-scratch/" },
        ],
      },
    ],
  },
  scala: {
    id: "scala",
    label: "Scala",
    tagline: "Functional and object-oriented programming on the JVM.",
    heroVideoUrl: "https://www.youtube.com/watch?v=DGr9hhIuw_0",
    heroVideoLabel: "Scala Full Course",
    heroCertUrl: "https://www.coursera.org/learn/scala-functional-programming",
    heroCertLabel: "EPFL (Coursera): Functional Programming Principles in Scala",
    sections: [
      {
        id: "scala-basics",
        title: "Basics",
        videoUrl: "https://www.youtube.com/watch?v=DGr9hhIuw_0",
        certUrl: "https://www.coursera.org/learn/scala-functional-programming",
        certLabel: "EPFL: Functional Programming Principles in Scala",
        topics: [
          { id: "scala-syntax-vals", title: "Syntax, val & var", description: "Immutability by default and Scala's type inference.", videoUrl: "https://www.youtube.com/watch?v=DGr9hhIuw_0" },
          { id: "scala-functions", title: "Functions", description: "First-class functions, higher-order functions, and closures.", videoUrl: "https://www.youtube.com/watch?v=DGr9hhIuw_0" },
        ],
      },
      {
        id: "scala-oop",
        title: "Classes & Case Classes",
        videoUrl: "https://www.youtube.com/watch?v=DGr9hhIuw_0",
        topics: [
          { id: "scala-classes-traits", title: "Classes & Traits", description: "Scala's take on classes, traits, and mixin composition.", videoUrl: "https://www.youtube.com/watch?v=DGr9hhIuw_0" },
          { id: "scala-case-classes", title: "Case Classes & Pattern Matching", description: "Algebraic data types and exhaustive pattern matching.", videoUrl: "https://www.youtube.com/watch?v=DGr9hhIuw_0" },
        ],
      },
      {
        id: "scala-collections",
        title: "Collections & Functional Style",
        videoUrl: "https://www.youtube.com/watch?v=DGr9hhIuw_0",
        topics: [
          { id: "scala-collections-topic", title: "Collections", description: "List, Map, Set, and Scala's rich collection operations.", videoUrl: "https://www.youtube.com/watch?v=DGr9hhIuw_0" },
          { id: "scala-option-either", title: "Option, Either & For-Comprehensions", description: "Handling absence and errors without exceptions.", videoUrl: "https://www.youtube.com/watch?v=DGr9hhIuw_0" },
        ],
      },
    ],
  },
  wordpress: {
    id: "wordpress",
    label: "WordPress",
    tagline: "From installing WordPress through theme customization and plugin development.",
    heroVideoUrl: "https://www.freecodecamp.org/news/how-to-make-a-website-with-wordpress/",
    heroVideoLabel: "freeCodeCamp: How to Make a Website with WordPress",
    heroCertUrl: "https://yoast.com/academy/free-training-wordpress-for-beginners/",
    heroCertLabel: "Yoast Academy: WordPress for Beginners (Free, with Certificate)",
    sections: [
      {
        id: "wordpress-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/how-to-make-a-website-with-wordpress/",
        certUrl: "https://yoast.com/academy/free-training-wordpress-for-beginners/",
        certLabel: "Yoast Academy: WordPress for Beginners",
        topics: [
          { id: "wordpress-install", title: "Installation & Hosting", description: "Domains, hosting, and installing WordPress.", videoUrl: "https://www.freecodecamp.org/news/how-to-make-a-website-with-wordpress/" },
          { id: "wordpress-dashboard", title: "The Dashboard", description: "Posts, pages, media, and the admin interface.", videoUrl: "https://www.freecodecamp.org/news/how-to-make-a-website-with-wordpress/" },
        ],
      },
      {
        id: "wordpress-themes",
        title: "Themes & Customization",
        videoUrl: "https://www.freecodecamp.org/news/how-to-make-a-website-with-wordpress/",
        topics: [
          { id: "wordpress-themes-topic", title: "Themes & the Block Editor", description: "Choosing themes and building pages with Gutenberg blocks.", videoUrl: "https://www.freecodecamp.org/news/how-to-make-a-website-with-wordpress/" },
        ],
      },
      {
        id: "wordpress-plugins",
        title: "Plugins & Development",
        videoUrl: "https://www.freecodecamp.org/news/how-to-make-a-website-with-wordpress/",
        topics: [
          { id: "wordpress-plugins-topic", title: "Plugins", description: "Extending WordPress functionality without touching core code.", videoUrl: "https://www.freecodecamp.org/news/how-to-make-a-website-with-wordpress/" },
          { id: "wordpress-custom-dev", title: "Custom Theme & Plugin Development", description: "Hooks, filters, and the WordPress Plugin API for PHP developers.", videoUrl: "https://www.freecodecamp.org/news/how-to-make-a-website-with-wordpress/" },
        ],
      },
    ],
  },
  "computer-science": {
    id: "computer-science",
    label: "Computer Science",
    tagline: "Harvard's CS50 — algorithmic thinking, data structures, and the fundamentals of CS.",
    heroVideoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/",
    heroVideoLabel: "freeCodeCamp: Harvard CS50 — Free Computer Science University Course",
    heroCertUrl: "https://cs50.harvard.edu/x/",
    heroCertLabel: "Harvard CS50x (Official, Free Certificate)",
    sections: [
      {
        id: "cs-fundamentals",
        title: "Fundamentals",
        videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/",
        certUrl: "https://cs50.harvard.edu/x/",
        certLabel: "Harvard CS50x",
        topics: [
          { id: "cs-algorithmic-thinking", title: "Algorithmic Thinking", description: "Breaking problems into precise, step-by-step solutions.", videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/" },
          { id: "cs-abstraction", title: "Abstraction", description: "Hiding complexity behind simpler interfaces.", videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/" },
        ],
      },
      {
        id: "cs-data-structures",
        title: "Data Structures & Algorithms",
        videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/",
        topics: [
          { id: "cs-arrays-linked-lists", title: "Arrays & Linked Lists", description: "Contiguous vs. pointer-based data storage.", videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/" },
          { id: "cs-sorting-searching", title: "Sorting & Searching", description: "Bubble sort, merge sort, and binary search.", videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/" },
        ],
      },
      {
        id: "cs-systems",
        title: "Memory & Systems",
        videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/",
        topics: [
          { id: "cs-memory-management", title: "Memory Management", description: "Stack, heap, and how programs use memory.", videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/" },
        ],
      },
      {
        id: "cs-theory",
        title: "Theory & Security",
        videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/",
        topics: [
          { id: "cs-complexity", title: "Big-O & Complexity", description: "Reasoning about how algorithms scale.", videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/" },
          { id: "cs-security-basics", title: "Security Fundamentals", description: "Common vulnerabilities and secure design principles.", videoUrl: "https://www.freecodecamp.org/news/harvard-cs50-2026-free-computer-science-university-course/" },
        ],
      },
    ],
  },
  leetcode: {
    id: "leetcode",
    label: "LeetCode",
    tagline: "A structured path through the essential coding-interview patterns.",
    heroVideoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/",
    heroVideoLabel: "freeCodeCamp: Prepare for Technical Interviews Using NeetCode 150",
    heroCertUrl: "https://www.freecodecamp.org/learn/coding-interview-prep/",
    heroCertLabel: "freeCodeCamp: Coding Interview Prep Certification",
    sections: [
      {
        id: "leetcode-arrays-strings",
        title: "Arrays & Strings",
        videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/",
        certUrl: "https://www.freecodecamp.org/learn/coding-interview-prep/",
        certLabel: "freeCodeCamp: Coding Interview Prep",
        topics: [
          { id: "leetcode-two-pointers", title: "Two Pointers & Sliding Window", description: "Patterns for scanning arrays and strings in linear time.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/" },
          { id: "leetcode-hashing", title: "Hashing", description: "Using hash maps/sets to trade space for O(1) lookups.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/" },
        ],
      },
      {
        id: "leetcode-trees-graphs",
        title: "Trees & Graphs",
        videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/",
        topics: [
          { id: "leetcode-tree-traversal", title: "Tree Traversal", description: "DFS/BFS on binary trees and BSTs.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/" },
          { id: "leetcode-graph-traversal", title: "Graph Traversal", description: "DFS/BFS, topological sort, and union-find.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/" },
        ],
      },
      {
        id: "leetcode-dp",
        title: "Dynamic Programming",
        videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/",
        topics: [
          { id: "leetcode-1d-dp", title: "1D DP", description: "Climbing stairs, house robber, and coin change patterns.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/" },
          { id: "leetcode-2d-dp", title: "2D DP", description: "Grid paths, edit distance, and knapsack-style problems.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/" },
        ],
      },
      {
        id: "leetcode-backtracking-heap",
        title: "Backtracking & Heaps",
        videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/",
        topics: [
          { id: "leetcode-backtracking-topic", title: "Backtracking", description: "Permutations, combinations, and subsets.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/" },
          { id: "leetcode-heaps-topic", title: "Heaps & Priority Queues", description: "Top-K problems and merge-k-sorted patterns.", videoUrl: "https://www.freecodecamp.org/news/prepare-for-technical-interviews-using-neetcode-150/" },
        ],
      },
    ],
  },
  "power-bi": {
    id: "power-bi",
    label: "Power BI",
    tagline: "Data modeling, DAX, and report design — through PL-300 topics.",
    heroVideoUrl: "https://www.freecodecamp.org/news/microsoft-power-platform-fundamentals-certification-pl-900/",
    heroVideoLabel: "freeCodeCamp: Microsoft Power Platform Fundamentals (PL-900) Course",
    heroCertUrl: "https://learn.microsoft.com/en-us/credentials/certifications/exams/pl-300/",
    heroCertLabel: "Microsoft: PL-300 — Power BI Data Analyst",
    sections: [
      {
        id: "powerbi-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/microsoft-power-platform-fundamentals-certification-pl-900/",
        certUrl: "https://learn.microsoft.com/en-us/credentials/certifications/exams/pl-300/",
        certLabel: "Microsoft: PL-300",
        topics: [
          { id: "powerbi-power-query", title: "Power Query", description: "Importing and transforming data before it hits the model.", videoUrl: "https://www.freecodecamp.org/news/microsoft-power-platform-fundamentals-certification-pl-900/" },
          { id: "powerbi-data-modeling", title: "Data Modeling", description: "Relationships, star schema, and model design.", videoUrl: "https://www.freecodecamp.org/news/microsoft-power-platform-fundamentals-certification-pl-900/" },
        ],
      },
      {
        id: "powerbi-dax",
        title: "DAX",
        videoUrl: "https://www.freecodecamp.org/news/microsoft-power-platform-fundamentals-certification-pl-900/",
        topics: [
          { id: "powerbi-dax-measures", title: "Measures & Calculated Columns", description: "Writing DAX formulas for aggregations and derived values.", videoUrl: "https://www.freecodecamp.org/news/microsoft-power-platform-fundamentals-certification-pl-900/" },
        ],
      },
      {
        id: "powerbi-visuals",
        title: "Reports & Visuals",
        videoUrl: "https://www.freecodecamp.org/news/microsoft-power-platform-fundamentals-certification-pl-900/",
        topics: [
          { id: "powerbi-visualizations", title: "Visualizations", description: "Choosing the right chart type for the data and story.", videoUrl: "https://www.freecodecamp.org/news/microsoft-power-platform-fundamentals-certification-pl-900/" },
          { id: "powerbi-dashboards", title: "Dashboards & Sharing", description: "Publishing reports and building dashboards in the Power BI service.", videoUrl: "https://www.freecodecamp.org/news/microsoft-power-platform-fundamentals-certification-pl-900/" },
        ],
      },
    ],
  },
  "python-data-analysis": {
    id: "python-data-analysis",
    label: "Python for Data Analysis",
    tagline: "NumPy, Pandas, and Matplotlib — through the freeCodeCamp Data Analysis certification.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-pandas-for-data-science/",
    heroVideoLabel: "freeCodeCamp: Learn Pandas & Python for Data Analysis",
    heroCertUrl: "https://www.freecodecamp.org/learn/data-analysis-with-python/",
    heroCertLabel: "freeCodeCamp: Data Analysis with Python Certification",
    sections: [
      {
        id: "pda-numpy",
        title: "NumPy",
        videoUrl: "https://www.freecodecamp.org/news/learn-pandas-for-data-science/",
        certUrl: "https://www.freecodecamp.org/learn/data-analysis-with-python/",
        certLabel: "freeCodeCamp: Data Analysis with Python",
        topics: [
          { id: "pda-ndarray", title: "NumPy Arrays", description: "Vectorized operations on n-dimensional arrays.", videoUrl: "https://www.freecodecamp.org/news/learn-pandas-for-data-science/" },
        ],
      },
      {
        id: "pda-pandas",
        title: "Pandas",
        videoUrl: "https://www.freecodecamp.org/news/learn-pandas-for-data-science/",
        topics: [
          { id: "pda-dataframes", title: "DataFrames & Series", description: "Reading CSVs/SQL and manipulating tabular data.", videoUrl: "https://www.freecodecamp.org/news/learn-pandas-for-data-science/" },
          { id: "pda-groupby", title: "GroupBy & Merging", description: "Aggregating and joining datasets.", videoUrl: "https://www.freecodecamp.org/news/learn-pandas-for-data-science/" },
        ],
      },
      {
        id: "pda-viz",
        title: "Visualization",
        videoUrl: "https://www.freecodecamp.org/news/learn-pandas-for-data-science/",
        topics: [
          { id: "pda-matplotlib-seaborn", title: "Matplotlib & Seaborn", description: "Plotting distributions, trends, and relationships.", videoUrl: "https://www.freecodecamp.org/news/learn-pandas-for-data-science/" },
        ],
      },
    ],
  },
  "r-programming": {
    id: "r-programming",
    label: "R Programming",
    tagline: "Statistical computing — vectors, data frames, and the tidyverse.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-r-programming-from-harvard-university/",
    heroVideoLabel: "freeCodeCamp: Learn R Programming from Harvard University (CS50R)",
    heroCertUrl: "https://cs50.harvard.edu/r/",
    heroCertLabel: "Harvard CS50R (Official, Free)",
    sections: [
      {
        id: "r-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-r-programming-from-harvard-university/",
        certUrl: "https://cs50.harvard.edu/r/",
        certLabel: "Harvard CS50R",
        topics: [
          { id: "r-vectors-dataframes", title: "Vectors & Data Frames", description: "R's core data structures for statistical computing.", videoUrl: "https://www.freecodecamp.org/news/learn-r-programming-from-harvard-university/" },
          { id: "r-functions-loops", title: "Functions & Loops", description: "Writing reusable functions and iterating over data.", videoUrl: "https://www.freecodecamp.org/news/learn-r-programming-from-harvard-university/" },
        ],
      },
      {
        id: "r-tidyverse",
        title: "The Tidyverse",
        videoUrl: "https://www.freecodecamp.org/news/learn-r-programming-from-harvard-university/",
        topics: [
          { id: "r-dplyr", title: "dplyr", description: "filter, select, mutate, and summarize for tidy data manipulation.", videoUrl: "https://www.freecodecamp.org/news/learn-r-programming-from-harvard-university/" },
          { id: "r-ggplot2", title: "ggplot2", description: "The grammar of graphics for building visualizations.", videoUrl: "https://www.freecodecamp.org/news/learn-r-programming-from-harvard-university/" },
        ],
      },
      {
        id: "r-stats",
        title: "Statistics",
        videoUrl: "https://www.freecodecamp.org/news/learn-r-programming-from-harvard-university/",
        topics: [
          { id: "r-regression-clustering", title: "Regression & Clustering", description: "Basic statistical modeling in R.", videoUrl: "https://www.freecodecamp.org/news/learn-r-programming-from-harvard-university/" },
        ],
      },
    ],
  },
  "prompt-engineering": {
    id: "prompt-engineering",
    label: "Prompt Engineering",
    tagline: "Writing effective prompts — zero/few-shot, chaining, and evaluation.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-prompt-engineering-full-course/",
    heroVideoLabel: "freeCodeCamp: Learn Prompt Engineering — Full Course",
    heroCertUrl: "https://www.deeplearning.ai/courses/ai-prompting-for-everyone",
    heroCertLabel: "DeepLearning.AI: AI Prompting for Everyone (Free, with Certificate)",
    sections: [
      {
        id: "pe-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/learn-prompt-engineering-full-course/",
        certUrl: "https://www.deeplearning.ai/courses/ai-prompting-for-everyone",
        certLabel: "DeepLearning.AI: AI Prompting for Everyone",
        topics: [
          { id: "pe-mindset", title: "The Prompt Engineering Mindset", description: "Treating prompts as an iterative design problem.", videoUrl: "https://www.freecodecamp.org/news/learn-prompt-engineering-full-course/" },
          { id: "pe-zero-few-shot", title: "Zero-Shot & Few-Shot Prompting", description: "Giving a model zero, one, or several examples to follow.", videoUrl: "https://www.freecodecamp.org/news/learn-prompt-engineering-full-course/" },
        ],
      },
      {
        id: "pe-techniques",
        title: "Techniques",
        videoUrl: "https://www.freecodecamp.org/news/learn-prompt-engineering-full-course/",
        topics: [
          { id: "pe-chain-of-thought", title: "Chain-of-Thought Prompting", description: "Asking a model to reason step by step.", videoUrl: "https://www.freecodecamp.org/news/learn-prompt-engineering-full-course/" },
          { id: "pe-role-prompting", title: "Role & System Prompts", description: "Setting persona and constraints before the user's actual request.", videoUrl: "https://www.freecodecamp.org/news/learn-prompt-engineering-full-course/" },
        ],
      },
      {
        id: "pe-pitfalls",
        title: "Pitfalls & Evaluation",
        videoUrl: "https://www.freecodecamp.org/news/learn-prompt-engineering-full-course/",
        topics: [
          { id: "pe-hallucinations", title: "AI Hallucinations", description: "Why models confidently state wrong things, and how to reduce it.", videoUrl: "https://www.freecodecamp.org/news/learn-prompt-engineering-full-course/" },
          { id: "pe-embeddings", title: "Vectors & Text Embeddings", description: "How semantic search and retrieval-augmented prompts work.", videoUrl: "https://www.freecodecamp.org/news/learn-prompt-engineering-full-course/" },
        ],
      },
    ],
  },
  "ai-agents": {
    id: "ai-agents",
    label: "AI Agents",
    tagline: "Building autonomous, tool-using LLM agents with LangChain and LangGraph.",
    heroVideoUrl: "https://www.freecodecamp.org/news/agentic-ai-using-langgraph-build-ai-agents-automate-workflows/",
    heroVideoLabel: "freeCodeCamp: Agentic AI Using LangGraph — Build AI Agents & Automate Workflows",
    heroCertUrl: "https://huggingface.co/learn/agents-course/unit0/introduction",
    heroCertLabel: "Hugging Face: AI Agents Course (Free, with Certificate)",
    sections: [
      {
        id: "agents-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/agentic-ai-using-langgraph-build-ai-agents-automate-workflows/",
        certUrl: "https://huggingface.co/learn/agents-course/unit0/introduction",
        certLabel: "Hugging Face: AI Agents Course",
        topics: [
          { id: "agents-vs-llms", title: "Agentic AI vs. Standard LLMs", description: "What makes an agent different from a single prompt/response call.", videoUrl: "https://www.freecodecamp.org/news/agentic-ai-using-langgraph-build-ai-agents-automate-workflows/" },
          { id: "agents-tool-use", title: "Tool Use", description: "Giving an LLM the ability to call functions and external APIs.", videoUrl: "https://www.freecodecamp.org/news/agentic-ai-using-langgraph-build-ai-agents-automate-workflows/" },
        ],
      },
      {
        id: "agents-orchestration",
        title: "Orchestration",
        videoUrl: "https://www.freecodecamp.org/news/agentic-ai-using-langgraph-build-ai-agents-automate-workflows/",
        topics: [
          { id: "agents-langgraph", title: "LangGraph", description: "Modeling agent workflows as graphs of nodes and edges.", videoUrl: "https://www.freecodecamp.org/news/agentic-ai-using-langgraph-build-ai-agents-automate-workflows/" },
          { id: "agents-multi-agent", title: "Multi-Agent Systems", description: "Coordinating multiple specialized agents on one task.", videoUrl: "https://www.freecodecamp.org/news/agentic-ai-using-langgraph-build-ai-agents-automate-workflows/" },
        ],
      },
      {
        id: "agents-advanced",
        title: "Advanced Techniques",
        videoUrl: "https://www.freecodecamp.org/news/agentic-ai-using-langgraph-build-ai-agents-automate-workflows/",
        topics: [
          { id: "agents-rag", title: "RAG for Agents", description: "Grounding agent responses in retrieved documents.", videoUrl: "https://www.freecodecamp.org/news/agentic-ai-using-langgraph-build-ai-agents-automate-workflows/" },
          { id: "agents-hitl", title: "Human-in-the-Loop", description: "Adding approval steps for high-stakes agent actions.", videoUrl: "https://www.freecodecamp.org/news/agentic-ai-using-langgraph-build-ai-agents-automate-workflows/" },
        ],
      },
    ],
  },
  "ai-product-builders": {
    id: "ai-product-builders",
    label: "AI Product Builders",
    tagline: "Shipping AI-powered products end-to-end — from idea to a deployed, sellable application.",
    heroVideoUrl: "https://www.freecodecamp.org/news/build-and-deploy-a-polished-ai-project-and-get-sales/",
    heroVideoLabel: "freeCodeCamp: Build and Deploy a Polished AI Project and Get Sales",
    heroCertUrl: "https://www.mygreatlearning.com/academy/learn-for-free/courses/ai-for-product-management",
    heroCertLabel: "Great Learning: AI for Product Management (Free, with Certificate)",
    sections: [
      {
        id: "aipb-foundations",
        title: "Foundations",
        videoUrl: "https://www.freecodecamp.org/news/build-and-deploy-a-polished-ai-project-and-get-sales/",
        certUrl: "https://www.mygreatlearning.com/academy/learn-for-free/courses/ai-for-product-management",
        certLabel: "Great Learning: AI for Product Management",
        topics: [
          { id: "aipb-idea-to-mvp", title: "From Idea to MVP", description: "Scoping an AI feature that's actually worth building.", videoUrl: "https://www.freecodecamp.org/news/build-and-deploy-a-polished-ai-project-and-get-sales/" },
          { id: "aipb-model-selection", title: "Choosing a Model/API", description: "Picking the right LLM provider and API for cost and quality.", videoUrl: "https://www.freecodecamp.org/news/build-and-deploy-a-polished-ai-project-and-get-sales/" },
        ],
      },
      {
        id: "aipb-building",
        title: "Building",
        videoUrl: "https://www.freecodecamp.org/news/build-and-deploy-a-polished-ai-project-and-get-sales/",
        topics: [
          { id: "aipb-ui-polish", title: "Polishing the UI/UX", description: "Making AI output feel trustworthy and production-ready.", videoUrl: "https://www.freecodecamp.org/news/build-and-deploy-a-polished-ai-project-and-get-sales/" },
        ],
      },
      {
        id: "aipb-launch",
        title: "Deployment & Monetization",
        videoUrl: "https://www.freecodecamp.org/news/build-and-deploy-a-polished-ai-project-and-get-sales/",
        topics: [
          { id: "aipb-deployment", title: "Deployment", description: "Shipping the app to real users.", videoUrl: "https://www.freecodecamp.org/news/build-and-deploy-a-polished-ai-project-and-get-sales/" },
          { id: "aipb-pricing-sales", title: "Pricing & Getting First Sales", description: "Turning a working AI product into a paying business.", videoUrl: "https://www.freecodecamp.org/news/build-and-deploy-a-polished-ai-project-and-get-sales/" },
        ],
      },
    ],
  },
  "claude-code": {
    id: "claude-code",
    label: "Claude Code",
    tagline: "Anthropic's agentic coding tool — reading, editing, and running commands across a codebase.",
    heroVideoUrl: "https://www.freecodecamp.org/news/claude-certified-architect-foundations-prep-for-anthropic-s-new-certification-exam/",
    heroVideoLabel: "freeCodeCamp: Claude Certified Architect — Foundations",
    heroCertUrl: "https://anthropic.com/learn",
    heroCertLabel: "Anthropic Academy (Official, Free Certificates)",
    sections: [
      {
        id: "claude-code-basics",
        title: "Basics",
        videoUrl: "https://www.freecodecamp.org/news/claude-certified-architect-foundations-prep-for-anthropic-s-new-certification-exam/",
        certUrl: "https://anthropic.com/learn",
        certLabel: "Anthropic Academy",
        topics: [
          { id: "claude-code-cli", title: "The Claude Code CLI", description: "Reading a codebase, making edits, and running shell commands.", videoUrl: "https://www.freecodecamp.org/news/claude-certified-architect-foundations-prep-for-anthropic-s-new-certification-exam/" },
          { id: "claude-code-context", title: "Context Management", description: "How Claude Code builds context from your project files.", videoUrl: "https://www.freecodecamp.org/news/claude-certified-architect-foundations-prep-for-anthropic-s-new-certification-exam/" },
        ],
      },
      {
        id: "claude-code-workflows",
        title: "Workflows",
        videoUrl: "https://www.freecodecamp.org/news/claude-certified-architect-foundations-prep-for-anthropic-s-new-certification-exam/",
        topics: [
          { id: "claude-code-plan-mode", title: "Plan Mode & Permissions", description: "Reviewing a plan before Claude Code makes changes.", videoUrl: "https://www.freecodecamp.org/news/claude-certified-architect-foundations-prep-for-anthropic-s-new-certification-exam/" },
          { id: "claude-code-skills", title: "Skills & Subagents", description: "Packaging reusable instructions and delegating to subagents.", videoUrl: "https://www.freecodecamp.org/news/claude-certified-architect-foundations-prep-for-anthropic-s-new-certification-exam/" },
        ],
      },
      {
        id: "claude-code-mcp",
        title: "MCP & Extensibility",
        videoUrl: "https://www.freecodecamp.org/news/claude-certified-architect-foundations-prep-for-anthropic-s-new-certification-exam/",
        topics: [
          { id: "claude-code-mcp-topic", title: "Model Context Protocol", description: "Connecting Claude Code to external tools and data sources.", videoUrl: "https://www.freecodecamp.org/news/claude-certified-architect-foundations-prep-for-anthropic-s-new-certification-exam/" },
        ],
      },
    ],
  },
  "design-system": {
    id: "design-system",
    label: "Design System",
    tagline: "Tokens, components, and documentation for consistent product design at scale.",
    heroVideoUrl: "https://www.freecodecamp.org/news/learn-how-to-create-a-design-system-in-figma/",
    heroVideoLabel: "freeCodeCamp: Learn How to Create a Design System in Figma",
    heroCertUrl: "https://www.coursera.org/professional-certificates/google-ux-design",
    heroCertLabel: "Google UX Design Professional Certificate",
    sections: [
      {
        id: "ds-foundations",
        title: "Foundations",
        videoUrl: "https://www.freecodecamp.org/news/learn-how-to-create-a-design-system-in-figma/",
        certUrl: "https://www.coursera.org/professional-certificates/google-ux-design",
        certLabel: "Google UX Design Certificate",
        topics: [
          { id: "ds-design-tokens", title: "Design Tokens", description: "Color, spacing, and typography as reusable, named values.", videoUrl: "https://www.freecodecamp.org/news/learn-how-to-create-a-design-system-in-figma/" },
          { id: "ds-color-type-systems", title: "Color & Type Systems", description: "Building scalable color palettes and type scales.", videoUrl: "https://www.freecodecamp.org/news/learn-how-to-create-a-design-system-in-figma/" },
        ],
      },
      {
        id: "ds-components",
        title: "Components",
        videoUrl: "https://www.freecodecamp.org/news/learn-how-to-create-a-design-system-in-figma/",
        topics: [
          { id: "ds-master-components", title: "Master Components & Variants", description: "Reusable Figma components with states and variants.", videoUrl: "https://www.freecodecamp.org/news/learn-how-to-create-a-design-system-in-figma/" },
        ],
      },
      {
        id: "ds-scaling",
        title: "Scaling the System",
        videoUrl: "https://www.freecodecamp.org/news/learn-how-to-create-a-design-system-in-figma/",
        topics: [
          { id: "ds-responsive-grids", title: "Responsive Grids & Spacing", description: "Layout rules that hold up across screen sizes.", videoUrl: "https://www.freecodecamp.org/news/learn-how-to-create-a-design-system-in-figma/" },
          { id: "ds-code-handoff", title: "Design-to-Code Handoff", description: "Keeping design tokens in sync with a component library in code.", videoUrl: "https://www.freecodecamp.org/news/learn-how-to-create-a-design-system-in-figma/" },
        ],
      },
    ],
  },
  "software-design-architecture": {
    id: "software-design-architecture",
    label: "Design Architecture",
    tagline: "OOP principles, design patterns, and architectural decision-making.",
    heroVideoUrl: "https://www.freecodecamp.org/news/master-object-oriented-programming-and-design-patterns-in-c/",
    heroVideoLabel: "freeCodeCamp: Master OOP and Design Patterns",
    heroCertUrl: "https://www.coursera.org/learn/design-patterns",
    heroCertLabel: "Coursera: Design Patterns",
    sections: [
      {
        id: "sda-oop",
        title: "OOP Principles",
        videoUrl: "https://www.freecodecamp.org/news/master-object-oriented-programming-and-design-patterns-in-c/",
        certUrl: "https://www.coursera.org/learn/design-patterns",
        certLabel: "Coursera: Design Patterns",
        topics: [
          { id: "sda-solid", title: "SOLID Principles", description: "Five guidelines for maintainable object-oriented design.", videoUrl: "https://www.freecodecamp.org/news/master-object-oriented-programming-and-design-patterns-in-c/" },
        ],
      },
      {
        id: "sda-patterns",
        title: "Design Patterns",
        videoUrl: "https://www.freecodecamp.org/news/master-object-oriented-programming-and-design-patterns-in-c/",
        topics: [
          { id: "sda-creational", title: "Creational Patterns", description: "Factory, builder, and singleton patterns.", videoUrl: "https://www.freecodecamp.org/news/master-object-oriented-programming-and-design-patterns-in-c/" },
          { id: "sda-structural-behavioral", title: "Structural & Behavioral Patterns", description: "Adapter, decorator, observer, and strategy patterns.", videoUrl: "https://www.freecodecamp.org/news/master-object-oriented-programming-and-design-patterns-in-c/" },
        ],
      },
      {
        id: "sda-architecture",
        title: "Architectural Decisions",
        videoUrl: "https://www.freecodecamp.org/news/master-object-oriented-programming-and-design-patterns-in-c/",
        topics: [
          { id: "sda-layered-hexagonal", title: "Layered & Hexagonal Architecture", description: "Separating business logic from frameworks and infrastructure.", videoUrl: "https://www.freecodecamp.org/news/master-object-oriented-programming-and-design-patterns-in-c/" },
        ],
      },
    ],
  },
  openclaw: {
    id: "openclaw",
    label: "OpenClaw",
    tagline: "Deploying and configuring OpenClaw — a self-hosted, programmable AI agent.",
    heroVideoUrl: "https://docs.openclaw.ai/start/getting-started",
    heroVideoLabel: "OpenClaw: Official Getting Started Guide",
    heroCertUrl: "https://huggingface.co/learn/agents-course/unit0/introduction",
    heroCertLabel: "Hugging Face: AI Agents Course (Free, with Certificate)",
    sections: [
      {
        id: "openclaw-understanding",
        title: "Understanding OpenClaw",
        videoUrl: "https://docs.openclaw.ai/start/getting-started",
        certUrl: "https://huggingface.co/learn/agents-course/unit0/introduction",
        certLabel: "Hugging Face: AI Agents Course",
        topics: [
          { id: "openclaw-what-is", title: "What is OpenClaw?", description: "A self-hosted, MIT-licensed agent that connects messaging apps to AI models you control.", videoUrl: "https://docs.openclaw.ai/start/getting-started" },
        ],
      },
      {
        id: "openclaw-install",
        title: "Installation",
        videoUrl: "https://docs.openclaw.ai/start/getting-started",
        topics: [
          { id: "openclaw-quickstart", title: "Quick Start", description: "Installing OpenClaw and running the onboarding flow.", videoUrl: "https://docs.openclaw.ai/start/getting-started" },
        ],
      },
      {
        id: "openclaw-connect",
        title: "Connecting Channels",
        videoUrl: "https://docs.openclaw.ai/start/getting-started",
        topics: [
          { id: "openclaw-channels", title: "Messaging Channels", description: "Connecting Telegram, WhatsApp, Discord, and other channels.", videoUrl: "https://docs.openclaw.ai/start/getting-started" },
        ],
      },
      {
        id: "openclaw-security",
        title: "Security",
        videoUrl: "https://docs.openclaw.ai/start/getting-started",
        topics: [
          { id: "openclaw-security-topic", title: "Security Best Practices", description: "Hardening a self-hosted agent before giving it real permissions.", videoUrl: "https://docs.openclaw.ai/start/getting-started" },
        ],
      },
    ],
  },
  "vibe-coding": {
    id: "vibe-coding",
    label: "Vibe Coding",
    tagline: "Building software through natural-language prompts and AI-assisted tools.",
    heroVideoUrl: "https://www.freecodecamp.org/news/how-to-vibe-code-with-help-from-n8n/",
    heroVideoLabel: "freeCodeCamp: How to Vibe Code with n8n",
    heroCertUrl: "https://www.mygreatlearning.com/academy/learn-for-free/courses/learn-vibe-coding-with-ai-tools",
    heroCertLabel: "Great Learning: Vibe Coding with AI Tools (Free, with Certificate)",
    sections: [
      {
        id: "vibe-mindset",
        title: "The Vibe Coding Mindset",
        videoUrl: "https://www.freecodecamp.org/news/how-to-vibe-code-with-help-from-n8n/",
        certUrl: "https://www.mygreatlearning.com/academy/learn-for-free/courses/learn-vibe-coding-with-ai-tools",
        certLabel: "Great Learning: Vibe Coding with AI Tools",
        topics: [
          { id: "vibe-what-is", title: "What is Vibe Coding?", description: "Directing an AI tool with natural language instead of writing every line by hand.", videoUrl: "https://www.freecodecamp.org/news/how-to-vibe-code-with-help-from-n8n/" },
        ],
      },
      {
        id: "vibe-tools",
        title: "Tools",
        videoUrl: "https://www.freecodecamp.org/news/how-to-vibe-code-with-help-from-n8n/",
        topics: [
          { id: "vibe-ai-editors", title: "AI-Native Editors", description: "Cursor, Claude Code, and other AI-first coding tools.", videoUrl: "https://www.freecodecamp.org/news/how-to-vibe-code-with-help-from-n8n/" },
          { id: "vibe-automation-n8n", title: "Workflow Automation (n8n)", description: "Connecting apps and APIs without writing glue code by hand.", videoUrl: "https://www.freecodecamp.org/news/how-to-vibe-code-with-help-from-n8n/" },
        ],
      },
      {
        id: "vibe-pitfalls",
        title: "Pitfalls",
        videoUrl: "https://www.freecodecamp.org/news/how-to-vibe-code-with-help-from-n8n/",
        topics: [
          { id: "vibe-review-code", title: "Reviewing AI-Generated Code", description: "Why you still need to read and understand what got shipped.", videoUrl: "https://www.freecodecamp.org/news/how-to-vibe-code-with-help-from-n8n/" },
        ],
      },
    ],
  },
  "frontend-beginner": {
    id: "frontend-beginner",
    label: "Frontend Beginner",
    tagline: "The absolute-beginner on-ramp to frontend — HTML, CSS, and just enough JavaScript.",
    heroVideoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/",
    heroVideoLabel: "freeCodeCamp: HTML Full Course for Beginners",
    heroCertUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
    heroCertLabel: "freeCodeCamp: Responsive Web Design Certification",
    sections: [
      {
        id: "feb-html-css",
        title: "HTML & CSS",
        videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/",
        certUrl: "https://www.freecodecamp.org/learn/responsive-web-design/",
        certLabel: "freeCodeCamp: Responsive Web Design",
        topics: [
          { id: "feb-html-basics", title: "HTML Basics", description: "Tags, elements, and the structure of a web page.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
          { id: "feb-css-basics", title: "CSS Basics", description: "Selectors, the box model, and basic styling.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
        ],
      },
      {
        id: "feb-js-basics",
        title: "A Little JavaScript",
        videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/",
        topics: [
          { id: "feb-js-dom", title: "The DOM & Events", description: "Making a page interactive by responding to clicks and input.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
        ],
      },
      {
        id: "feb-next-steps",
        title: "Next Steps",
        videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/",
        topics: [
          { id: "feb-pick-a-path", title: "Picking a Framework", description: "When you're ready to move on to React, Vue, or Angular.", videoUrl: "https://www.freecodecamp.org/news/html-full-course-for-beginners/" },
        ],
      },
    ],
  },
  "backend-beginner": {
    id: "backend-beginner",
    label: "Backend Beginner",
    tagline: "The absolute-beginner on-ramp to backend — a server, a route, and a database.",
    heroVideoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
    heroVideoLabel: "freeCodeCamp: Node.js and Express.js — Full Course",
    heroCertUrl: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    heroCertLabel: "freeCodeCamp: Back End Development and APIs Certification",
    sections: [
      {
        id: "beb-server-basics",
        title: "Your First Server",
        videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
        certUrl: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
        certLabel: "freeCodeCamp: Back End Development and APIs",
        topics: [
          { id: "beb-http-basics", title: "What is a Server?", description: "Handling HTTP requests and sending responses.", videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/" },
          { id: "beb-routes", title: "Routes", description: "Mapping URLs to the code that handles them.", videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/" },
        ],
      },
      {
        id: "beb-database-basics",
        title: "A Database",
        videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
        topics: [
          { id: "beb-crud-basics", title: "Basic CRUD", description: "Create, read, update, and delete records.", videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/" },
        ],
      },
      {
        id: "beb-next-steps",
        title: "Next Steps",
        videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/",
        topics: [
          { id: "beb-pick-a-stack", title: "Picking a Language/Framework", description: "Node.js, Python/Django, or another backend stack to go deeper on.", videoUrl: "https://www.freecodecamp.org/news/free-8-hour-node-express-course/" },
        ],
      },
    ],
  },
  "devops-beginner": {
    id: "devops-beginner",
    label: "DevOps Beginner",
    tagline: "The absolute-beginner on-ramp to DevOps — the command line, Git, and one deployment.",
    heroVideoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
    heroVideoLabel: "freeCodeCamp: Introduction to Linux (LFS101x)",
    heroCertUrl: "https://training.linuxfoundation.org/training/introduction-to-linux/",
    heroCertLabel: "Linux Foundation: Introduction to Linux (LFS101x)",
    sections: [
      {
        id: "deb-command-line",
        title: "The Command Line",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        certUrl: "https://training.linuxfoundation.org/training/introduction-to-linux/",
        certLabel: "Linux Foundation: Introduction to Linux",
        topics: [
          { id: "deb-shell-basics", title: "Shell Basics", description: "Navigating files and running commands in a terminal.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
        ],
      },
      {
        id: "deb-version-control",
        title: "Version Control",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [
          { id: "deb-git-basics", title: "Git Basics", description: "Committing changes and pushing to a remote repository.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
        ],
      },
      {
        id: "deb-first-deploy",
        title: "Your First Deployment",
        videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/",
        topics: [
          { id: "deb-deploy-basics", title: "Deploying a Simple App", description: "Getting a small app running on a real server or platform.", videoUrl: "https://www.freecodecamp.org/news/introduction-to-linux/" },
        ],
      },
    ],
  },
  "git-github-beginner": {
    id: "git-github-beginner",
    label: "Git and GitHub Beginner",
    tagline: "The absolute-beginner on-ramp to Git and GitHub — your first commit and pull request.",
    heroVideoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
    heroVideoLabel: "freeCodeCamp: Learn Git — Full Course for Beginners",
    heroCertUrl: "https://docs.github.com/en/get-started/showcase-your-expertise-with-github-certifications/about-github-certifications",
    heroCertLabel: "GitHub Foundations Certification",
    sections: [
      {
        id: "ggb-first-commit",
        title: "Your First Commit",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        certUrl: "https://docs.github.com/en/get-started/showcase-your-expertise-with-github-certifications/about-github-certifications",
        certLabel: "GitHub Foundations Certification",
        topics: [
          { id: "ggb-init-add-commit", title: "init, add & commit", description: "Turning a folder into a Git repository and saving your first snapshot.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
        ],
      },
      {
        id: "ggb-github-basics",
        title: "GitHub Basics",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [
          { id: "ggb-remote-push", title: "Remotes & Push", description: "Connecting a local repo to GitHub and pushing your commits.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
        ],
      },
      {
        id: "ggb-first-pr",
        title: "Your First Pull Request",
        videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU",
        topics: [
          { id: "ggb-pr-basics", title: "Branches & Pull Requests", description: "Making a change on a branch and opening a PR for review.", videoUrl: "https://www.youtube.com/watch?v=zTjRZNkhiEU" },
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
