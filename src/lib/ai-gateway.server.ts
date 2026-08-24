const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
};

export async function gatewayChat(options: {
  model: string;
  messages: ChatMessage[];
  responseFormat?: Record<string, unknown>;
  maxCompletionTokens?: number;
}): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI service is not configured.");

  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
  };
  if (options.responseFormat) body["response_format"] = options.responseFormat;
  if (options.maxCompletionTokens) body["max_completion_tokens"] = options.maxCompletionTokens;

  const res = await fetch(`${GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new Error("The AI companion is busy right now. Try again shortly.");
  if (res.status === 402) throw new Error("AI credits are exhausted. Please top up to continue.");
  if (!res.ok) {
    const text = await res.text();
    console.error(`[ai-gateway] ${res.status}: ${text}`);
    throw new Error("The AI companion could not respond right now.");
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}