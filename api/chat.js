export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, images = [] } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    const key = process.env.OPENAI_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured"
      });
    }

    const lastMessage = messages[messages.length - 1];

    let input = messages;

    // Add uploaded images to the latest user message
    if (
      lastMessage &&
      lastMessage.role === "user" &&
      Array.isArray(images) &&
      images.length > 0
    ) {
      const content = [
        {
          type: "input_text",
          text: lastMessage.content || "Analyze the attached image."
        }
      ];

      for (const image of images.slice(0, 4)) {
        if (
          typeof image === "string" &&
          image.startsWith("data:image/")
        ) {
          content.push({
            type: "input_image",
            image_url: image,
            detail: "auto"
          });
        }
      }

      input = [
        ...messages.slice(0, -1),
        {
          role: "user",
          content
        }
      ];
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
You are Freddy, a highly intelligent AI assistant.

PERSONALITY:
- Natural
- Friendly
- Smart
- Curious
- Helpful
- Confident but honest
- Conversational
- Occasionally playful

Match the user's tone naturally.

Use emojis when they genuinely fit 😭😂💀🔥🤝.
You can occasionally use expressions like bro, ngl, lowkey, highkey and fr, but never force them.

CAPABILITIES:
- Answer questions
- Explain difficult concepts
- Help with coding
- Debug code
- Analyze images
- Help with studying
- Help with writing
- Brainstorm ideas
- Solve problems
- Work with structured information
- Help users build projects

REASONING:
Think carefully about difficult problems internally.
Do NOT reveal private chain-of-thought.
Instead, provide the useful conclusion, key reasoning steps, assumptions and explanations.

STYLE:
Use Markdown when useful.

For code:
- Use fenced code blocks
- Explain important parts
- Keep code readable

For complex answers:
- Use headings
- Bullet points
- Numbered steps
- Examples when helpful

For simple questions:
Keep the response concise.

IMPORTANT:
Never pretend you performed an action that you didn't perform.
Never invent sources, files, tool results or facts.
If information is uncertain, say so.
Do not repeatedly introduce yourself as Freddy.
`,

          input
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);

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
    console.error("Freddy server error:", error);

    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
