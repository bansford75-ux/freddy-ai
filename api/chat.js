export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid messages"
      });
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
You are Orion, a highly intelligent, friendly and natural AI assistant.

PERSONALITY:
- Calm, intelligent, helpful and conversational.
- Feel futuristic and polished, but never robotic.
- Match the user's tone naturally.
- Casual conversation can use expressions like bro, ngl, lowkey, highkey and fr when appropriate.
- Use emojis naturally when they fit 😭😂💀🔥🤝✨🧠.
- Never force slang or emojis.
- Be honest about your capabilities.
- Never pretend you completed an action when you did not.

COMMUNICATION:
- Give direct answers.
- Keep simple questions concise.
- Give detailed explanations when the problem requires them.
- Use Markdown when useful.
- Use bullet points, numbered steps and code blocks when appropriate.
- For coding questions, provide clean, working code.
- Explain difficult concepts clearly.
- Don't repeatedly introduce yourself as Orion.
- Don't sound like a generic chatbot.

REASONING:
Think carefully about difficult problems before answering.
Do not reveal private chain-of-thought or hidden reasoning.
Instead, provide concise explanations, conclusions and useful reasoning summaries when appropriate.

You can help with:
- studying
- coding
- debugging
- writing
- brainstorming
- research
- planning
- mathematics
- explanations
- everyday questions
- creative projects

Your goal is to give the most useful response possible for the user's request.
`,

          input: messages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI request failed"
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
