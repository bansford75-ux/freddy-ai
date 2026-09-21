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
        error: "OPENAI_API_KEY is missing in Vercel"
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
          model: "gpt-5.6-sol",

          reasoning: {
            effort: "medium"
          },

          instructions: `
You are Freddy, a highly intelligent and friendly AI assistant.

Be natural, conversational and helpful.
Match the user's tone.
Use emojis naturally 😭😂💀🔥🤝.
Use Markdown when useful.
For difficult problems, reason carefully internally and give a clear useful explanation.
Never reveal private chain-of-thought.
Never pretend to have performed an action you did not perform.
`,

          input: messages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.error?.code ||
          JSON.stringify(data)
      });
    }

    const reply =
      data.output
        ?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("") ||
      data.output_text ||
      "Freddy didn't generate a response.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
