const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "qwen2.5:7b";

export async function askLLM(
  goal: string,
  observation: string,
): Promise<string> {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      messages: [
        {
          role: "system",
          content: `
You are a computer-use discovery agent.

Your job is to choose the next safe action based on the user's goal and the visible UI.

Return ONLY valid JSON.

Allowed actions:

{"type":"login"}

{"type":"search_member","memberId":"10001"}

{"type":"extract_member"}

Rules:
- If the page shows Username and Password fields, return {"type":"login"}.
- If the page shows Member ID and a Search button, return {"type":"search_member","memberId":"10001"}.
- If the page shows Member Detail with Name and Current Balance, return {"type":"extract_member"}.
- Do not return any other action.
- Do not include explanations.
`,
        },
        {
          role: "user",
          content: `Goal:
${goal}

Current UI observation:
${observation}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    message?: {
      content?: string;
    };
  };

  return data.message?.content ?? "";
}
