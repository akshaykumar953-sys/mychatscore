"use client";

import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import Tesseract from "tesseract.js";
import ConversationGraph from "@/components/ConversationGraph";


import {
ResponsiveContainer,
LineChart,
XAxis,
Tooltip,
Line
} from "recharts";

function Logo() {
return (
<div className="logoBox">
<svg width="34" height="34" viewBox="0 0 100 100">
<defs>
<linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stopColor="#22c55e"/>
<stop offset="100%" stopColor="#16a34a"/>
</linearGradient>
</defs>

<circle cx="50" cy="50" r="45" fill="url(#logoGrad)" />

<path
d="M30 55 Q40 30 50 50 Q60 70 70 45"
stroke="white"
strokeWidth="6"
fill="none"
strokeLinecap="round"
/>
</svg>

<span className="logoText">MyChatScore</span>
</div>
);
}

export default function Home(){

const [chatText,setChatText]=useState("");
const [result,setResult]=useState("");
const [loading,setLoading]=useState(false);
const [openIndex, setOpenIndex] = useState<number | null>(null);

const [chatOpen,setChatOpen]=useState(false);
const [userEmail,setUserEmail]=useState("");
const [message,setMessage]=useState("");
const [showGreeting,setShowGreeting] = useState(true);
const reportRef=useRef<HTMLDivElement>(null);


useEffect(()=>{

const timer = setTimeout(()=>{

setShowGreeting(false);

},10000);

return ()=>clearTimeout(timer);

},[]);

/* ---------------- NAME DETECTION ---------------- */

function extractNamesFromResult(result:string){

const match=result.match(/between\s+([A-Za-z]+)\s+and\s+([A-Za-z]+)/i);

if(match){

return{
you:match[1],
them:match[2]
};

}

return null;

}

function extractNamesFromChat(text:string){

const lines=text.split("\n");
const names:string[]=[];

for(const line of lines){

const match=line.match(/^([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?):/);

if(match){

const name=match[1];

if(!names.includes(name)){
names.push(name);
}

}

}

if(names.length>=2){

return{
you:names[0],
them:names[1]
};

}

return null;

}

function resolveNames(){

const fromAI=extractNamesFromResult(result);

if(fromAI) return fromAI;

const fromChat=extractNamesFromChat(chatText);

if(fromChat) return fromChat;

return{
you:"You",
them:"Them"
};

}

const {you,them}=resolveNames();

/* ---------------- PARSE AI RESULT ---------------- */

function parseValue(label:string){

const regex=new RegExp(`${label}:\\s*([^\\n]+)`);

const match=result.match(regex);

return match?match[1]:"—";

}


function parseVerdict(){

const match=result.match(/Verdict:([\s\S]*)/);

return match ? match[1].trim() : "";

}

const interest=parseValue("Interest Score");
const flirting=parseValue("Flirting Level");
const ghosting=parseValue("Ghosting Risk");
const energy=parseValue("Conversation Energy");
const curiosity=parseValue("Curiosity Level");

const verdict=parseVerdict();

/* ---------------- DYNAMIC CONVERSATION EFFORT ---------------- */

function calculateEffort(chatText:string,you:string,them:string){

const lines = chatText.split("\n");

let youCount = 0;
let themCount = 0;

for(const line of lines){

if(line.startsWith(you)) youCount++;

if(line.startsWith(them)) themCount++;

}

const total = youCount + themCount || 1;

return [
{ name: you, value: Math.round((youCount/total)*100) },
{ name: them, value: Math.round((themCount/total)*100) }
];

}

const balanceData = calculateEffort(chatText,you,them);

/* ---------------- INTEREST TIMELINE ---------------- */

const score = parseInt(interest) || 50;

const timelineData = [

{
stage:"Start",
interest:50,
alexEffort:20,
samEffort:15
},

{
stage:"Mid",
interest:65,
alexEffort:35,
samEffort:30
},

{
stage:"End",
interest:75,
alexEffort:55,
samEffort:43
}

];

/* ---------------- REPLY PROBABILITY ---------------- */

function calculateReplyProbability(interest:string){

const score=parseInt(interest) || 50;

return Math.min(95,Math.max(30,score+10));

}

const replyProbability = calculateReplyProbability(interest);

/* ---------------- CHAT DETECTION (FRONTEND) ---------------- */

function isLikelyChat(text: string) {
  const lines = text.split("\n").filter(l => l.trim().length > 0);

  if (lines.length < 3) return false;

  let hasSpeaker = false;
  let shortLines = 0;

  for (const line of lines) {
    if (/^[A-Z][a-zA-Z]*:/.test(line) || /^[A-Z]:/.test(line)) {
      hasSpeaker = true;
    }

    if (line.length < 80) shortLines++;
  }

  const hasChatSignals = /😂|😅|🙂|👍|ok|yes|no|hey|hi/i.test(text);

  const ratio = shortLines / lines.length;

  // ✅ NEW LOGIC (more flexible)
  return (
    hasSpeaker ||               // speaker format exists
    (ratio > 0.6 && hasChatSignals) // OR casual chat signals
  );
}

/* ---------------- ANALYZE CHAT ---------------- */

async function analyzeChat(){

if (!chatText.trim()) {
  alert("Paste chat first");
  return;
}

if (!isLikelyChat(chatText)) {
  alert("⚠️ This doesn't look like a real chat conversation.");
  return;
}


/* text length limit */

const MAX_CHAT_LENGTH = 3000;

if(chatText.length > MAX_CHAT_LENGTH){

alert("Chat too long. Please paste a shorter conversation.");

return;

}

setLoading(true);
setResult("");

try {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: chatText })
  });

  const data = await res.json();

  if (!res.ok) {
    setResult("");
    alert(data.error || "Invalid chat");
    setLoading(false);   // ✅ FIX: STOP LOADER
    return;
  }

  setResult(data.result);

} catch {
  setResult("");
  alert("Server error");
} finally {
  setLoading(false);     // ✅ FIX: ALWAYS STOP LOADER
}

}
/* ---------------- DEMO CHAT ---------------- */

function loadDemoChat(){

setChatText(`Alex: Hey, how was your day?
Sam: Pretty good actually! Busy though.
Alex: Same here 😅
Sam: What are you doing this weekend?
Alex: Nothing planned yet, maybe relaxing.
Sam: We should grab coffee sometime 🙂
Alex: I'd like that!`);

}

function clearChat(){
setChatText("");
setResult("");
}

/* ---------------- OCR ---------------- */

async function handleImageUpload(e:any){

const file = e.target.files[0];
if(!file) return;

/* file size limit */

const MAX_FILE_SIZE = 5 * 1024 * 1024;

if(file.size > MAX_FILE_SIZE){

alert("Screenshot too large. Maximum size is 5MB.");

return;

}

try{

setLoading(true);

/* convert image to canvas for stable OCR */

const img=new Image();
const reader=new FileReader();

reader.onload=()=>{
img.src=reader.result as string;
};

reader.readAsDataURL(file);

img.onload=async()=>{

const canvas=document.createElement("canvas");
const ctx=canvas.getContext("2d");

const MAX_WIDTH=1500;

let width=img.width;
let height=img.height;

if(width>MAX_WIDTH){
height = height*(MAX_WIDTH/width);
width = MAX_WIDTH;
}

canvas.width=width;
canvas.height=height;

ctx?.drawImage(img,0,0,width,height);


const { data } = await Tesseract.recognize(canvas, "eng");

const extractedText = data.text.trim();

// ❗ OCR QUALITY CHECK (NEW - VERY IMPORTANT)
const validCharCount = (extractedText.match(/[a-zA-Z]/g) || []).length;
const totalCharCount = extractedText.length;

const textQuality = validCharCount / totalCharCount;

// ❌ reject garbage OCR (random images, noise)
if (textQuality < 0.4) {
  alert("❌ Unable to detect readable chat in screenshot");
  setLoading(false);
  return;
}

// ❗ BLOCK: report-like structure (fuzzy detection)

if (
  /mychatscore|chat\s*score|chemistry|reply\s*probability|interest|flirting|ghosting/i.test(extractedText)
) {
  alert("❌ Please upload a real chat, not a report screenshot");
  setLoading(false);
  return;
}

// ❗ BLOCK: very small / unreadable
if (extractedText.length < 30) {
  alert("❌ No readable chat detected in screenshot");
  setLoading(false);
  return;
}

// ❗ BLOCK: your own report screenshots
if (
  /MyChatScore Report|Chat Chemistry Score|Reply Probability|Generated by MyChatScore/i.test(extractedText)
) {
  alert("❌ Please upload an actual chat, not a report screenshot");
  setLoading(false);
  return;
}

// ❗ CLEAN OCR TEXT

const cleanedLines = extractedText
  .split("\n")
  .map(l => l.trim())
  .filter(l => {
    // remove very short junk
    if (l.length < 3) return false;

    // must contain readable words
    if (!/[a-zA-Z]{2,}/.test(l)) return false;

    // reject weird OCR patterns
    if (/[^a-zA-Z0-9\s.,?!😂😅🙂👍]/.test(l) && l.length < 6) return false;

    return true;
  });
// ❗ REQUIRE CHAT STRUCTURE (speaker pattern)

// ❗ DETECT SPEAKER PATTERN (STRICT + WHATSAPP FALLBACK)

const hasColonPattern = cleanedLines.some(l =>
  /^[A-Z][a-zA-Z]*:/.test(l) || /^[A-Z]:/.test(l)
);

const hasNamePattern = cleanedLines.some((line, i) => {
  const nextLine = cleanedLines[i + 1];

  return (
    /^[A-Z][a-zA-Z]+\s?[A-Z]*[a-zA-Z]*$/.test(line) && // name
    nextLine &&
    nextLine.length > 3 &&
    !/^[A-Z][a-zA-Z]*:/.test(nextLine)
  );
});

if (!hasColonPattern && !hasNamePattern) {
  alert("❌ No conversation detected (missing participants)");
  setLoading(false);
  return;
}

// ❗ BLOCK: not enough chat-like lines
if (cleanedLines.length < 4) {
  alert("❌ No valid chat detected in screenshot");
  setLoading(false);
  return;
}

// ❗ must look like real conversation
let conversationScore = 0;

let speakerLineCount = 0;

for (let i = 0; i < cleanedLines.length; i++) {
  const line = cleanedLines[i];

  // count speaker lines (A:, B:, Alex:)
  if (/^[A-Z][a-zA-Z]*:/.test(line) || /^[A-Z]:/.test(line)) {
    speakerLineCount++;
  }

if (
  /\?|😂|😅|🙂|👍/.test(line) ||   // emotion / question
  line.split(" ").length >= 2 ||  // allow short chats
  /^[A-Z]:/.test(line)            // allow A:, B:, C:
) {
  conversationScore++;
}
}

// 🔥 NEW RULE: must have at least 2 speakers interacting

// 🔥 FIX: allow WhatsApp-style chats (no speaker labels)

if (speakerLineCount < 2) {

  // fallback: detect conversation by line variation
  const uniqueLines = new Set(cleanedLines);

  const hasConversationFlow =
    cleanedLines.length >= 4 &&
    uniqueLines.size >= 3;

  if (!hasConversationFlow) {
    alert("❌ Not enough interaction between participants");
    setLoading(false);
    return;
  }
}

if (conversationScore < 3) {
  alert("❌ This doesn't look like a real conversation");
  setLoading(false);
  return;
}


// ❗ BLOCK: must have conversational lines
const conversationalLines = cleanedLines.filter(
  l => l.split(" ").length >= 2
);

if (conversationalLines.length < 3) {
  alert("❌ This doesn't look like a real conversation");
  setLoading(false);
  return;
}

// ✅ FINAL CLEAN TEXT

// 🔥 STEP 5 — FINAL SAFETY

const cleanedText = cleanedLines.join("\n");

if (cleanedText.length < 20) {
  alert("❌ No valid chat detected");
  setLoading(false);
  return;
}

setChatText(cleanedText);

setLoading(false);

/* important fix */
e.target.value = "";

};

}catch(err){

console.error("OCR error:",err);
alert("Failed to read screenshot");

setLoading(false);

}
}

/* ---------------- DOWNLOAD REPORT ---------------- */

async function downloadReport(){

if(!reportRef.current) return;

const buttons = document.querySelector(".actionButtons") as HTMLElement;

/* hide buttons before capture */

if(buttons) buttons.style.display="none";

// 🔥 ADD THIS BEFORE CAPTURE
reportRef.current.classList.add("downloadMode");

const canvas = await html2canvas(reportRef.current,{
  scale:2, // better clarity without huge size
  useCORS:true,
  backgroundColor:"#ffffff",
  windowWidth:500 // force compact width
});

// 🔥 REMOVE AFTER CAPTURE
reportRef.current.classList.remove("downloadMode");

const dataUrl = canvas.toDataURL("image/png");

/* restore buttons */

if(buttons) buttons.style.display="flex";

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

if(isIOS){

const modal=document.createElement("div");

modal.style.position="fixed";
modal.style.top="0";
modal.style.left="0";
modal.style.width="100%";
modal.style.height="100%";
modal.style.background="rgba(0,0,0,0.9)";
modal.style.zIndex="9999";
modal.style.display="flex";
modal.style.alignItems="center";
modal.style.justifyContent="center";
modal.style.flexDirection="column";

modal.innerHTML=`

<div style="color:white;margin-bottom:10px">
Long press image → Save Image
</div>

<img src="${dataUrl}" style="max-width:90%;border-radius:12px"/>

<div style="color:#ccc;margin-top:10px">
Returning in <span id="countdown">8</span>s
</div>

`;

document.body.appendChild(modal);

let seconds=8;

const timer=setInterval(()=>{

seconds--;

const el=document.getElementById("countdown");
if(el) el.textContent=String(seconds);

if(seconds<=0){

clearInterval(timer);

if(document.body.contains(modal)){
document.body.removeChild(modal);
}

}

},1000);

}else{

const link=document.createElement("a");

link.href=dataUrl;
link.download="mychatscore.png";

document.body.appendChild(link);

link.click();

document.body.removeChild(link);

}

}

/* ---------------- COPY ---------------- */

function copyReport(){
navigator.clipboard.writeText(result);
alert("Copied!");
}

/* ---------------- SHARE ---------------- */

async function shareReport(){

if(!reportRef.current) return;

const buttons = document.querySelector(".actionButtons") as HTMLElement;

if(buttons) buttons.style.display="none";

reportRef.current.classList.add("downloadMode");

const canvas = await html2canvas(reportRef.current,{
  scale:2,
  backgroundColor:"#ffffff",
  windowWidth:500
});

reportRef.current.classList.remove("downloadMode");

const dataUrl = canvas.toDataURL("image/png");

if(buttons) buttons.style.display="flex";

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

/* iPhone fallback */

if(isIOS){

const modal=document.createElement("div");

modal.style.position="fixed";
modal.style.top="0";
modal.style.left="0";
modal.style.width="100%";
modal.style.height="100%";
modal.style.background="rgba(0,0,0,0.9)";
modal.style.zIndex="9999";
modal.style.display="flex";
modal.style.alignItems="center";
modal.style.justifyContent="center";
modal.style.flexDirection="column";

modal.innerHTML=`

<div style="color:white;margin-bottom:10px">
Long press image → Share or Save
</div>

<img src="${dataUrl}" style="max-width:90%;border-radius:12px"/>

`;

document.body.appendChild(modal);

setTimeout(()=>{
if(document.body.contains(modal)){
document.body.removeChild(modal);
}
},8000);

return;
}

/* Android / Desktop share */

canvas.toBlob(async(blob)=>{

if(!blob) return;

const file = new File([blob],"mychatscore.png",{type:"image/png"});

if(navigator.share){

try{

await navigator.share({
title:"My Chat Chemistry Score",
text:"Check my chat chemistry score!",
files:[file]
});

}catch(err){
console.log("Share cancelled");
}

}

});

}

/* ---------------- FEEDBACK ---------------- */

/* ---------------- FEEDBACK ---------------- */

async function sendFeedback(){

  if(!message.trim()){
    alert("Please enter a message");
    return;
  }

  if(!userEmail.trim()){
    alert("Please enter your email");
    return;
  }

  try{

    const res = await fetch("/api/feedback",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        email:userEmail,
        message
      })
    });

    const data = await res.json();

    // 🔥 CLEAN ERROR HANDLING (FINAL FIX)
    if(!res.ok){

      // hide technical backend errors
      if(data?.error?.includes("configured")){
        alert("Feedback not available right now 🙏");
      } else {
        alert(data.error || "Failed to send feedback");
      }

      return;
    }

    // ✅ SUCCESS
    alert("Thanks! Feedback received 🙌");

    setUserEmail("");
    setMessage("");
    setChatOpen(false);

  }catch(error){

    alert("Something went wrong. Try again.");

  }

}

return(

<main>

<header className="navbar">

<Logo/>

<div className="navQuestions">

<span onClick={()=>document.getElementById("uploadTool")?.scrollIntoView({behavior:"smooth"})}>
Are they interested?
</span>

<span onClick={()=>document.getElementById("uploadTool")?.scrollIntoView({behavior:"smooth"})}>
Is this flirting?
</span>

<span onClick={()=>document.getElementById("uploadTool")?.scrollIntoView({behavior:"smooth"})}>
Will they reply again?
</span>

<span onClick={()=>document.getElementById("uploadTool")?.scrollIntoView({behavior:"smooth"})}>
Who is trying more?
</span>

</div>

<button
className="aviButton"
onClick={()=>window.location.href="/"}
>
Avi
</button>

</header>

<section className="hero">
<div className="floatingChats">

<span>💬 hey</span>
<span>💬 haha</span>
<span>💬 really?</span>

</div>

<div style={{
  display: "inline-block",
  padding: "6px 14px",
  borderRadius: "999px",
  background: "#ecfdf5",
  color: "#16a34a",
  fontSize: "13px",
  fontWeight: 500,
  marginBottom: "18px"
}}>
  ✨ AI Chat Analyzer
</div>

<h1 style={{
  fontSize: "48px",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#111827",
  lineHeight: "1.15",
  marginBottom: "10px"
}}>
  Analyze your chat.
  <br />
  <span style={{ 
    color: "#9ca3af", 
    fontWeight: 500 
  }}>
    Interest, flirting & ghosting risk.
  </span>
</h1>

<p style={{
  color: "#9ca3af",
  fontSize: "15px",
  marginTop: "14px",
  lineHeight: "1.6",
  maxWidth: "520px",
  marginInline: "auto"
}}>
  AI analysis that reveals interest, flirting signals and reply chances.
</p>

</section>

<section 
  id="uploadTool" 
  className="toolSection"
  style={{ marginTop: "40px" }}
>

<div className="toolCard">

<label htmlFor="chatUpload" className="uploadCompact">

<span className="uploadEmoji">🖼️</span>

<span className="uploadTitle">
Upload Chat Screenshot
</span>

<span className="uploadSub">
Drag screenshot or click to upload
</span>

<span className="uploadHint">
Paste chat or upload screenshot • WhatsApp • Tinder • Instagram
</span>

<input
id="chatUpload"
type="file"
accept="image/png,image/jpeg,image/jpg"
onChange={handleImageUpload}
/>

</label>

<div className="privacyNote">
🔒 Your chats stay private. Nothing is stored or saved.
</div>

<textarea
rows={6}
maxLength={5000}
placeholder="Paste your chat conversation (work best with real and short chats)"
value={chatText}
onChange={(e)=>setChatText(e.target.value)}
/>

<div className="buttons">

<button onClick={loadDemoChat}>Demo</button>

<button className="secondary" onClick={clearChat}>Clear</button>

<button onClick={analyzeChat}>Analyze Chat</button>
<p style={{fontSize:"12px", color:"#16a34a", marginTop:"8px"}}>
  🔥 1,000+ chats analyzed today
</p>

</div>

</div>

</section>

{result &&
 result.includes("Interest Score") &&
 result.includes("Flirting Level") &&
 result.includes("Ghosting Risk") && (

<section className="resultSection">

<div ref={reportRef} className="resultCard exportCard">

<h2>I analyzed this chat… {interest}/100 😳</h2>
<div className="chatScore">

🔥 Chat Chemistry Score

<strong>{interest}/100</strong>

</div>

<div className="metrics">

<div>❤️ Interest {interest}</div>
<div>🙂 Flirting {flirting}</div>
<div>⚠️ Ghosting {ghosting}</div>
<div>⚡ Energy {energy}</div>
<div>🧠 Curiosity {curiosity}</div>

</div>

<div className="verdictBox">
<p>{verdict}</p>
</div>

<div className="insightBlock">

  <h3>Conversation Insights</h3>

  <div className="insightItems">

    <div>🔥 Interest is growing steadily</div>

    <div>⚡ Energy is {energy.toLowerCase()}</div>

    <div>
      💬 {you} vs {them}: {
        Math.abs(balanceData[0].value - balanceData[1].value) < 15
          ? "balanced conversation"
          : balanceData[0].value > balanceData[1].value
            ? `${you} is putting more effort`
            : `${them} is putting more effort`
      }
    </div>

  </div>

</div>

<div className="predictionBox">

<h3>Reply Probability</h3>

<div className="predictionScore">
{replyProbability}%
</div>

<p>
Based on engagement signals, they are likely to reply again.
</p>

</div>
<div className="reportFooter">

Generated by <strong>MyChatScore.com</strong>

</div>

<div className="actionButtons">

<button onClick={downloadReport}>Download</button>
<button onClick={copyReport}>Copy</button>
<button onClick={shareReport}>Share</button>

</div>

</div>

</section>

)}

{/* DEMO SECTION */}



<section className="featureSection">

  <h2 className="featureTitle">How MyChatScore Works</h2>

  <div className="featureGrid">

    {/* LEFT BIG CARD */}
    <div className="featureCard large">

      <h3>Upload your chat</h3>
      <p>
        Paste your conversation or upload a screenshot.
        Works with WhatsApp, Instagram, Tinder and more.
      </p>

<div className="imageWrapper">
      <img src="/demo1.png" alt="Upload chat"/>
</div>

<div className="featurePointsBox">
  <div>⚡ Works with real chats instantly</div>
  <div>🔒 100% private — nothing stored</div>
  <div>📱 Supports screenshots & text</div>
</div>

    </div>

    {/* RIGHT TOP */}
    <div className="featureCard">

      <h3>AI analyzes everything</h3>
      <p>
        Detects interest, flirting signals,
        energy and conversation patterns.
      </p>

<div className="imageWrapper">
      <img src="/demo2.png" alt="AI analysis"/>
</div> 
    </div>

    {/* RIGHT BOTTOM */}
    <div className="featureCard">

      <h3>Get instant insights</h3>
      <p>
        Understand who’s interested,
        who’s trying more and reply chances.
      </p>

<div className="imageWrapper">
      <img src="/demo3.png" alt="Insights"/>
</div> 

    </div>

  </div>

</section>

<section className="faqSection">

  <h2 className="faqTitle">Frequently Asked Questions</h2>

  <div className="faqList">

    {[
      {
        q: "Is my chat stored anywhere?",
        a: "No. Your chats are processed instantly and never stored on our servers."
      },
      {
        q: "Which apps does this support?",
        a: "Works with WhatsApp, Instagram, Tinder, iMessage and most chat screenshots."
      },
      {
        q: "How accurate is the AI analysis?",
        a: "The AI detects patterns like reply speed, engagement, and tone to estimate interest and behavior signals."
      },
      {
        q: "Can I upload screenshots?",
        a: "Yes, you can upload chat screenshots or paste text conversations."
      },
      {
        q: "Is this free to use?",
        a: "Yes, you can analyze chats for free."
      }
    ].map((item, i) => (

      <div 
        key={i}
        className={`faqItem ${openIndex === i ? "active" : ""}`}
        onClick={() => setOpenIndex(openIndex === i ? null : i)}
      >

        <div className="faqQuestion">
          {item.q}
          <span className="faqIcon">
            {openIndex === i ? "−" : "+"}
          </span>
        </div>

        <div className="faqAnswer">
          {item.a}
        </div>

      </div>

    ))}

  </div>

</section>

<footer className="footer">

<p className="footerTitle">Legal</p>

<p className="footerLinks">

<a href="/about">About</a>
<a href="/privacy">Privacy</a>
<a href="/ai-disclaimer">AI Disclaimer</a>
<a href="/terms">Terms</a>

</p>

<p className="footerNote">
This tool provides AI-generated insights for entertainment purposes only. Users are responsible for the content they upload.
</p>


<div className="copyright">
© 2026 MyChatScore™. All rights reserved.
</div>

</footer>

{/* AI LOADER */}

{loading && (

<div className="loaderOverlay">

<div className="loaderBox">

🤖 AI analyzing...

</div>

</div>

)}

{/* AVI FEEDBACK WIDGET */}

<div className="feedbackWidget">

{/* AVI GREETING */}

{!chatOpen && showGreeting && (
<div className="aviGreeting">
👋 Hi, I'm Avi. Need help or want to share feedback?
</div>
)}

<button
  className="feedbackButton"
  onClick={()=>setChatOpen(!chatOpen)}
>
  <span className="aviIcon">💬</span>
  <span className="aviLabel">Ask Avi</span>
</button>

{chatOpen && (

<div className="feedbackPanel">

<h4>👋 Hi, I’m Avi</h4>

<p className="aviText">
Ask anything about your chat analysis or share feedback.
</p>

<div className="aviQuick">
  <span>💡 Why is ghosting high?</span>
  <span>📊 How is score calculated?</span>
</div>

<input
type="email"
placeholder="your@email.com"
value={userEmail}
onChange={(e)=>setUserEmail(e.target.value)}
/>

<textarea
placeholder="Your message..."
maxLength={500}
value={message}
onChange={(e)=>setMessage(e.target.value)}
/>

<div className="charCounter">
{message.length}/500
</div>

<button onClick={sendFeedback}>
Send
</button>

</div>

)}

</div>

</main>

);

}
