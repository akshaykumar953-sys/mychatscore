import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {

  try {

    const body = await req.json();

    let { email, message } = body;

    // sanitize input
    email = email?.trim();
    message = message?.trim();

    /* ---------- validation ---------- */

    if (!email || !message) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    if (email.length > 120) {
      return NextResponse.json(
        { error: "Email too long" },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message too long" },
        { status: 400 }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

    /* ---------- send email ---------- */

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
      { error: "Server error" },
      { status: 500 }
    );

  }

}
