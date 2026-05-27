import "dotenv/config";
import { PrismaClient, SourceType } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedSource {
  name: string;
  url: string;
  type: SourceType;
  category: string;
  isActive: boolean;
  fetchIntervalMinutes?: number;
  notes?: string;
}

/**
 * Only real, public, legitimate sources.
 * - GitHub `releases.atom` feeds exist for every public repo (confirmed real).
 * - arXiv exposes a stable public Atom API.
 * - Company/news feeds whose exact RSS URL is NOT confirmed are seeded as
 *   INACTIVE with a note, per the project rules. Validate before activating.
 */
const SOURCES: SeedSource[] = [
  // --- Active: GitHub releases (Atom) ---
  {
    name: "LangChain (GitHub Releases)",
    url: "https://github.com/langchain-ai/langchain/releases.atom",
    type: SourceType.GITHUB_RELEASES,
    category: "open-source",
    isActive: true,
  },
  {
    name: "Hugging Face Transformers (GitHub Releases)",
    url: "https://github.com/huggingface/transformers/releases.atom",
    type: SourceType.GITHUB_RELEASES,
    category: "open-source",
    isActive: true,
  },
  {
    name: "OpenAI Python SDK (GitHub Releases)",
    url: "https://github.com/openai/openai-python/releases.atom",
    type: SourceType.GITHUB_RELEASES,
    category: "open-source",
    isActive: true,
  },
  {
    name: "Ollama (GitHub Releases)",
    url: "https://github.com/ollama/ollama/releases.atom",
    type: SourceType.GITHUB_RELEASES,
    category: "open-source",
    isActive: true,
  },
  {
    name: "llama.cpp (GitHub Releases)",
    url: "https://github.com/ggerganov/llama.cpp/releases.atom",
    type: SourceType.GITHUB_RELEASES,
    category: "open-source",
    isActive: true,
  },
  {
    name: "vLLM (GitHub Releases)",
    url: "https://github.com/vllm-project/vllm/releases.atom",
    type: SourceType.GITHUB_RELEASES,
    category: "open-source",
    isActive: true,
  },

  // --- Active: arXiv (public Atom API) ---
  {
    name: "arXiv — Artificial Intelligence (cs.AI)",
    url: "http://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=40",
    type: SourceType.ARXIV,
    category: "papers",
    isActive: true,
    notes: "API pública Atom do arXiv (categoria cs.AI).",
  },
  {
    name: "arXiv — Machine Learning (cs.LG)",
    url: "http://export.arxiv.org/api/query?search_query=cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=40",
    type: SourceType.ARXIV,
    category: "papers",
    isActive: true,
    notes: "API pública Atom do arXiv (categoria cs.LG).",
  },

  // --- Inactive: general WordPress feeds (real /feed/, opt-in to avoid noise) ---
  {
    name: "TechCrunch (feed geral)",
    url: "https://techcrunch.com/feed/",
    type: SourceType.RSS,
    category: "news",
    isActive: false,
    notes:
      "Feed geral de tecnologia (WordPress). Ative se desejar; pode trazer conteúdo fora de IA.",
  },
  {
    name: "VentureBeat (feed geral)",
    url: "https://venturebeat.com/feed/",
    type: SourceType.RSS,
    category: "news",
    isActive: false,
    notes:
      "Feed geral (WordPress). Ative se desejar; pode trazer conteúdo fora de IA.",
  },

  // --- Inactive: feed RSS não confirmado (use a URL real do feed antes de ativar) ---
  {
    name: "OpenAI",
    url: "https://openai.com",
    type: SourceType.WEBPAGE,
    category: "vendor",
    isActive: false,
    notes: "Feed RSS não confirmado. Verifique a URL real do feed/news antes de ativar.",
  },
  {
    name: "Anthropic",
    url: "https://www.anthropic.com",
    type: SourceType.WEBPAGE,
    category: "vendor",
    isActive: false,
    notes: "Feed RSS não confirmado. Verifique a URL real do feed/news antes de ativar.",
  },
  {
    name: "Google AI (blog.google)",
    url: "https://blog.google",
    type: SourceType.WEBPAGE,
    category: "vendor",
    isActive: false,
    notes: "Feed RSS não confirmado. Verifique a URL real do feed antes de ativar.",
  },
  {
    name: "Meta AI",
    url: "https://ai.meta.com",
    type: SourceType.WEBPAGE,
    category: "vendor",
    isActive: false,
    notes: "Feed RSS não confirmado. Verifique a URL real do feed antes de ativar.",
  },
  {
    name: "Product Hunt",
    url: "https://www.producthunt.com",
    type: SourceType.WEBPAGE,
    category: "products",
    isActive: false,
    notes: "Feed RSS não confirmado. Verifique a URL real do feed antes de ativar.",
  },
];

async function main(): Promise<void> {
  let created = 0;
  let skipped = 0;

  for (const source of SOURCES) {
    const existing = await prisma.source.findFirst({ where: { url: source.url } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.source.create({ data: source });
    created++;
  }

  console.log(
    `Seed concluído: ${created} fonte(s) criada(s), ${skipped} já existia(m).`,
  );
}

main()
  .catch((err) => {
    console.error("Erro no seed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
