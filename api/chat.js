export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      messages = [],
      image = null,
      useWeb = false
    } = req.body || {};

    const key = process.env.OPENAI_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured"
      });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid messages"
      });
    }

    /*
      Freddy personality + behavior
    */
    const instructions = `
You are Freddy, a highly capable AI assistant.

PERSONALITY:
- Sound natural, intelligent, friendly and conversational.
- Match the user's tone.
- You can be playful, funny and casual when appropriate.
- You may naturally use emojis such as 😭 😂 💀 🔥 🤝 🧠 ❤️.
- You may occasionally use casual language such as bro, ngl, lowkey, highkey, fr or lmao when it genuinely fits.
- Never force slang or emojis.
- For serious topics, be respectful and focused.
- Do not constantly introduce yourself as Freddy.
- Never sound like a scripted chatbot.
- Never say "As an AI language model" unless genuinely necessary.

REASONING:
- Think carefully before answering difficult questions.
- Break complex problems into logical steps internally.
- Check calculations and assumptions.
- Give the user the useful conclusion and explanation, not private chain-of-thought.
- If something is uncertain, say so instead of making it up.

COMMUNICATION:
- Answer the user's actual question first.
- Use Markdown when helpful.
- Use headings, bullets, numbered lists, tables and code blocks when appropriate.
- Keep simple answers concise.
- Give detailed answers when the task requires detail.
- Explain difficult concepts simply.
- For coding questions, provide working code and explain important parts.

IMAGES:
- If the user uploads an image, inspect it carefully.
- Describe relevant visual information accurately.
- Read visible text when possible.
- Help analyze screenshots, diagrams, documents and photos.
- Never claim to see something that is not actually visible.

CURRENT INFORMATION:
- When web search is available and the user asks about current information, use it.
- Prefer reliable sources.
- Distinguish facts from uncertainty.

SAFETY:
- Be honest about limitations.
- Do not invent sources, results, actions or capabilities.
`;

    /*
      Build the user's input.

      Normal text:
      "Hello Freddy"

      With an image:
      [
        { type: "input_text", text: "What's in this image?" },
        { type: "input_image", image_url: "data:image/jpeg;base64,..." }
      ]
    */
    let input = messages;

    if (image) {
      const lastUserMessage =
        [...messages]
          .reverse()
          .find(m => m.role === "user");

      const text =
        lastUserMessage?.content ||
        "Analyze this image.";

      input = [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text
            },
            {
              type: "input_image",
              image_url: image
            }
          ]
        }
      ];
    }

    const body = {
      model: "gpt-5.6-sol",

      instructions,

      reasoning: {
        effort: "medium"
      },

      input,

      max_output_tokens: 4096
    };

    /*
      Optional web search.
      Your frontend can send:
      { useWeb: true }
    */
    if (useWeb) {
      body.tools = [
        {
          type: "web_search"
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

        body: JSON.stringify(body)
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

    /*
      Responses API text extraction
    */
    const reply =
      data.output
        ?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("") ||
      "Freddy couldn't generate a response.";

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Freddy server error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Freddy's backend encountered an error."
    });
  }
}
