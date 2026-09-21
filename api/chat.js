export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    const key = process.env.OPENAI_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          instructions: `
You are Freddy, a friendly and intelligent AI assistant.

Be natural, conversational and helpful.
Answer questions clearly and accurately.
Match the user's tone.
Use emojis when they fit naturally 😭😂💀🔥🤝.
You can occasionally use casual expressions like bro, ngl, lowkey, highkey and fr.

Use Markdown when useful, including:
- **bold**
- bullet points
- numbered lists
- code blocks

For difficult questions, think carefully before answering.
For simple questions, keep answers concise.

Don't sound robotic.
Don't repeatedly introduce yourself as Freddy.
Don't claim to have abilities you don't have.
`,
          input: messages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI request failed"
      });
    }

    const reply =
      data.output
        ?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("") ||
      data.output_text ||
      "I didn't get a response.";

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
