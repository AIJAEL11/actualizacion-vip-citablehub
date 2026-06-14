// =============================================================================
// LLM BROKER — Multi-provider cascade with automatic failover
// Priority: Abacus AI → Gemini → Offline RAG
// =============================================================================

export interface BrokerResponse {
  text: string;
  providerUsed: 'abacus' | 'gemini' | 'offline-rag';
  sources?: Array<{ uri: string; title: string }>;
}

async function tryAbacus(
  messages: Array<{ role: string; content: string }>,
): Promise<BrokerResponse> {
  const key = process.env.ABACUSAI_API_KEY || process.env.ABACUS_API_KEY;
  if (!key || key.length < 10) throw new Error('ABACUSAI_API_KEY not configured');

  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      messages,
      temperature: 0.2,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Abacus AI error ${response.status}: ${errBody?.slice(0, 200)}`);
  }

  const data = await response.json() as any;
  return {
    text: data?.choices?.[0]?.message?.content || '',
    providerUsed: 'abacus',
  };
}

async function tryAbacusStream(
  messages: Array<{ role: string; content: string }>,
): Promise<{ stream: ReadableStream; providerUsed: 'abacus' }> {
  const key = process.env.ABACUSAI_API_KEY || process.env.ABACUS_API_KEY;
  if (!key || key.length < 10) throw new Error('ABACUSAI_API_KEY not configured');

  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      messages,
      temperature: 0.2,
      max_tokens: 1500,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Abacus AI stream error ${response.status}: ${errBody?.slice(0, 200)}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body for streaming');

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return { stream, providerUsed: 'abacus' };
}

function offlineRagFallback(prompt: string, projects: any[] = []): BrokerResponse {
  const query = prompt?.toLowerCase() ?? '';
  const matched = (projects ?? []).filter((p: any) => {
    if (p?.status === 'flagged') return false;
    const nameMatch = p?.name?.toLowerCase()?.includes(query) ?? false;
    const descMatch = p?.description?.toLowerCase()?.includes(query) ?? false;
    const categoryMatch = p?.category?.toLowerCase()?.includes(query) ?? false;
    return nameMatch || descMatch || categoryMatch;
  }).slice(0, 2);

  const text = matched.length === 0
    ? 'No verified solutions found yet for this intent.'
    : matched.map((p: any) =>
        `- **Project Name**: [${p?.name}](/p/${p?.slug})\n- **Match reason**: Vetted solution in the ${p?.category} space.\n- **Evidence**: ${p?.outcome || 'Active verified results.'}\n- **CTA**: [Go to profile](/p/${p?.slug})`
      ).join('\n\n');

  return { text, providerUsed: 'offline-rag' };
}

export async function processLLMRequest(
  messages: Array<{ role: string; content: string }>,
  projects?: any[],
): Promise<BrokerResponse> {
  // Try Abacus first
  try {
    return await tryAbacus(messages);
  } catch (e) {
    console.warn('Abacus failed:', (e as Error).message);
  }

  // Fallback to offline RAG
  const lastMsg = messages?.[messages.length - 1]?.content || '';
  return offlineRagFallback(lastMsg, projects);
}

export async function processLLMStreamRequest(
  messages: Array<{ role: string; content: string }>,
): Promise<{ stream: ReadableStream; providerUsed: string }> {
  // Try Abacus streaming
  try {
    return await tryAbacusStream(messages);
  } catch (e) {
    console.warn('Abacus stream failed:', (e as Error).message);
  }

  // Fallback: create a simple text stream
  const encoder = new TextEncoder();
  const fallbackText = 'No verified solutions found yet for this intent.';
  const stream = new ReadableStream({
    start(controller) {
      const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: fallbackText } }] })}\n\ndata: [DONE]\n\n`;
      controller.enqueue(encoder.encode(sseData));
      controller.close();
    },
  });

  return { stream, providerUsed: 'offline-rag' };
}
