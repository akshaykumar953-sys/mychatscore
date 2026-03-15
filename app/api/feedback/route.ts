import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {

  try {

    const body = await req.json();
    const { email, message } = body;

    await resend.emails.send({
      from: "MyChatScore <feedback@mychatscore.com>",
      to: "hello@mychatscore.com",
      subject: "New Feedback from MyChatScore",
      text: `Email: ${email}\n\nMessage:\n${message}`
    });

    return NextResponse.json({ success: true });

  } catch (error) {

    console.error("Feedback error:", error);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );

  }

}
