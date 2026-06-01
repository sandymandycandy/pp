import { NextResponse } from "next/server";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (
      typeof name !== "string" || !name.trim() ||
      typeof email !== "string" || !EMAIL_RE.test(email) ||
      typeof message !== "string" || !message.trim()
    ) {
      return NextResponse.json(
        { error: "Please complete all fields with a valid email." },
        { status: 400 }
      );
    }

    // TODO: wire to an email provider (Resend, Postmark) or a database.
    // For now we just log the transmission server-side.
    console.log("📡 New transmission:", { name, email, message });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
