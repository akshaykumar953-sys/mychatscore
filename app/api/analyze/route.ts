import OpenAI from "openai";

export async function POST(req: Request) {

try{

const body = await req.json();
const chatText = body.text;

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

const completion = await openai.chat.completions.create({

model: "gpt-4o-mini",
temperature: 0,

messages:[

{
role:"system",
content:`
You are an expert AI conversation analyst.

First detect the names of the two people in the conversation.

If names appear like:

Akshay: message
Sarah: message

Then assume:
Akshay = user
Sarah = other person.

If names are unclear, use:
User
Other Person.

Use the detected names inside the explanation.
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

return Response.json({
result: completion.choices[0].message.content
});

}catch(error:any){

return Response.json(
{error:error.message},
{status:500}
);

}

}
