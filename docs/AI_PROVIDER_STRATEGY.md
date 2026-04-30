# SocialSciencr — AI Provider Strategy

## Approach: Bring Your Own API Key (BYOAK)

SocialSciencr uses a BYO API key model for AI provider access.

### Why BYO API Key?

1. **Privacy**: Student data stays in their own provider account
2. **Cost control**: Students pay only for what they use through their own API billing
3. **Flexibility**: Students choose their preferred provider and model
4. **Transparency**: No hidden markup on AI usage costs
5. **Simplicity**: No need to build and maintain a billing system in Phase 0-1

### Why NOT Consumer Subscription Connection

Consumer subscriptions (ChatGPT Plus, Claude Pro, Gemini Advanced) are:
- Web-based products, not API services
- Subject to Terms of Service that may prohibit automated access
- Not designed for programmatic integration
- Unable to provide the structured, citation-injected outputs SocialSciencr requires

SocialSciencr connects to provider APIs, not consumer web interfaces.

## Provider Abstraction Layer

All AI interactions go through a provider abstraction layer:

```
User Query → Scope Resolution → Context Assembly → Prompt Construction → Provider Call → Response Processing → Citation Injection → UI Display
```

### Provider Interface

Each provider implements a common interface:

```typescript
interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse>;
  isConfigured(): boolean;
}
```

### Supported Providers (Future)

| Provider | Models | Status |
|----------|--------|--------|
| OpenAI | gpt-4o, gpt-4o-mini | Planned |
| Anthropic | claude-sonnet-4-20250514, claude-3-5-haiku-latest | Planned |
| Google Gemini | gemini-2.5-pro, gemini-2.5-flash | Planned |
| Local/Open-source | Ollama models | Future |

## Security Rules

1. **Server-side only**: All API calls are made from server-side code (Next.js API routes or server actions)
2. **Encrypted storage**: API keys are encrypted at rest using AES-256 encryption
3. **No client exposure**: API keys are NEVER included in client-side JavaScript bundles
4. **No localStorage**: API keys are never stored in browser localStorage or sessionStorage
5. **Usage tracking**: All API usage is logged for transparency and rate limiting
6. **Error handling**: Provider errors are handled gracefully without exposing internal details

## Implementation Notes

- Keys are stored in an encrypted database table with per-user isolation
- Key validation happens on save (test call to verify the key works)
- Model preference is configurable per-provider
- Fallback to mock responses when no provider is connected
- Rate limiting prevents excessive API costs
