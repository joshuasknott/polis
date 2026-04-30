import { auth } from "@/lib/auth";
import { saveProviderApiKey, removeProviderApiKey, getUserProviderConnections } from "@/lib/services/apikey-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await getUserProviderConnections(session.user.id);
  return NextResponse.json(
    connections.map((c) => ({
      provider: c.provider,
      status: c.status,
      modelPreference: c.modelPreference,
      hasKey: !!c.encryptedApiKey,
      updatedAt: c.updatedAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { provider, apiKey, modelPreference } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: "Provider and API key required" }, { status: 400 });
    }

    const validProviders = ["openai", "anthropic", "google"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    if (typeof apiKey !== "string" || apiKey.length < 10) {
      return NextResponse.json({ error: "Invalid API key format" }, { status: 400 });
    }

    try {
      const testResult = await testApiKey(provider, apiKey);
      if (!testResult.success) {
        return NextResponse.json({ error: `Key validation failed: ${testResult.error}` }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({
        error: `Could not validate key: ${error instanceof Error ? error.message : "Unknown error"}`,
      }, { status: 400 });
    }

    await saveProviderApiKey(session.user.id, provider, apiKey, modelPreference);

    return NextResponse.json({ success: true, provider, model: modelPreference });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");

  if (!provider) {
    return NextResponse.json({ error: "Provider required" }, { status: 400 });
  }

  await removeProviderApiKey(session.user.id, provider);
  return NextResponse.json({ success: true });
}

async function testApiKey(
  provider: string,
  apiKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (provider === "openai") {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey });
      await client.models.list();
      return { success: true };
    }

    if (provider === "anthropic") {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model: "claude-3-5-haiku-latest",
        max_tokens: 5,
        messages: [{ role: "user", content: "test" }],
      });
      return { success: true };
    }

    if (provider === "google") {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      await model.generateContent("test");
      return { success: true };
    }

    return { success: false, error: "Unknown provider" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}
