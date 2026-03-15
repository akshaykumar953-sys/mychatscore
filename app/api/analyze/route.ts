
import LRU from "lru-cache";

const rateLimit = new LRU({
max: 500,
ttl: 1000 * 60
});

import OpenAI from "openai";
const requestMap = new Map();

export async function POST(req: Request) {

const ip =
req.headers.get("x-forwarded-for") ||
req.headers.get("x-real-ip") ||
"unknown";

const count = rateLimit.get(ip) || 0;

if (count >= 15) {
return Response.json(
{ error: "Too many requests. Please wait." },
{ status: 429 }
);
}

rateLimit.set(ip, count + 1);

try{

const body = await req.json();

/* ---------------- RATE LIMIT ---------------- */

const ip = req.headers.get("x-forwarded-for") || "unknown";

const now = Date.now();

const lastRequest = requestMap.get(ip) || 0;

/* allow request every 3 seconds */

if(now - lastRequest < 3000){

return Response.json({
result:"Too many requests. Please wait a few seconds before analyzing again."
});

}

requestMap.set(ip, now);

const chatText = body.text;

/* ---------------- INPUT VALIDATION ---------------- */

if(!chatText || chatText.trim().length === 0){

return Response.json({
result:"Please paste a chat conversation first."
});

}

/* limit chat size */

const MAX_CHAT_LENGTH = 3000;

if(chatText.length > MAX_CHAT_LENGTH){

return Response.json({
result:"Chat too long. Please analyze a shorter conversation (max ~300 messages)."
});

}

/* check API key */

if(!process.env.OPENAI_API_KEY){

return Response.json({
error:"Server configuration error."
},{status:500});

}

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

/* ---------------- AI ANALYSIS ---------------- */

const completion = await openai.chat.completions.create({

model: "gpt-4o-mini",

temperature: 0,
max_tokens:200,

messages:[

{

role:"system",
content:`
You analyze chat conversations and return relationship insights.

Detect two participant names if present (e.g., "Akshay: message").
If names are unclear use "User" and "Other Person".

Always mention the detected names inside the explanation.
`

},

{
role:"user",
content:`

Analyze this conversation and return EXACTLY this format.

Interest Score: <0-100>

Flirting Level: <Low / Medium / High>

Ghosting Risk: <Low / Medium / High>

Effort Balance:
User: X%
Other Person: X%

Conversation Energy: <Low / Medium / High>

Curiosity Level: <Low / Medium / High>

Verdict: A short explanation mentioning the detected names.

Conversation:

${chatText}

`
}

]

});

/* ---------------- RETURN RESULT ---------------- */

return Response.json({
result: completion.choices[0].message.content
});

}catch(error:any){

console.error("Analyze API Error:",error);

return Response.json(
{error:"Analysis failed. Please try again."},
{status:500}
);

}

}
