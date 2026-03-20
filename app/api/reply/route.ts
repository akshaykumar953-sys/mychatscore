import OpenAI from "openai";

export async function POST(req: Request) {

  try {

    const body = await req.json();
    const { text, mode } = body;

    if (!text || text.trim().length === 0) {
      return Response.json(
        { error: "No chat provided" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    /* 🔥 MODE PERSONALITY */

const modeMap: any = {

  auto: `
- analyze conversation deeply
- detect mood, interest, and tone
- choose best reply style automatically
- if conversation is dry → make it engaging
- if flirty → continue playfully
- if risk of ghosting → re-engage naturally
`,

  flirty: `
- playful
- slightly teasing
- confident but not desperate
- keep it short and smooth
`,

  funny: `
- witty
- light humor
- not cringe
- natural texting vibe
`,

  confident: `
- direct
- self-assured
- no overthinking
- calm energy
`,

  smart: `
- thoughtful
- engaging
- asks interesting follow-up
- not boring
`,

  chill: `
- casual
- short
- not trying too hard
- relaxed vibe
`,

  bold: `
- slightly daring
- confident
- playful risk
- not creepy
`,

  rescue: `
- revive dead conversation
- ask engaging question
- spark curiosity
- not boring
`
};

    const tone = modeMap[mode] || modeMap["flirty"];

    const prompt = `
You generate replies to continue a chat.

RULES:
- sound human (not AI)
- no long messages
- no over-explaining
- 1–2 lines max
- avoid generic replies

STYLE:
${tone}

OUTPUT:
Return EXACTLY 3 different reply options.

FORMAT:
1. ...
2. ...
3. ...
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: `Chat:\n${text}\n\nGenerate next replies.`
        }
      ]
    });

    const raw = completion.choices[0].message.content || "";

    const replies = raw
      .split("\n")
      .map((l) => l.replace(/^\d+\.\s*/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, 3);

    return Response.json({ replies });

  } catch (err) {

    return Response.json(
      { error: "Failed to generate replies" },
      { status: 500 }
    );

  }
}
