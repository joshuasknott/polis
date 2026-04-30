import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface ChunkRow {
  id: string;
  text: string;
  chunk_index: number;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is required. Set it in .env");
    process.exit(1);
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  const chunks: ChunkRow[] = await prisma.$queryRaw`
    SELECT id, text, chunk_index FROM source_chunks WHERE embedding IS NULL ORDER BY chunk_index ASC LIMIT 100
  `;

  console.log(`Found ${chunks.length} chunks without embeddings`);

  let updated = 0;
  const batchSize = 20;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.text.slice(0, 8000));

    const response = await client.embeddings.create({ model, input: texts });

    for (let j = 0; j < batch.length; j++) {
      const embedding = response.data.find((d) => d.index === j);
      if (embedding) {
        const vectorStr = `[${embedding.embedding.join(",")}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE source_chunks SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          batch[j].id
        );
        updated++;
      }
    }

    console.log(`Embedded ${updated}/${chunks.length} chunks`);
  }

  console.log(`Done. Embedded ${updated} chunks.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
