import { NextRequest, NextResponse } from "next/server";
import { addToWaitlist } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Bitte gib eine gültige E-Mail-Adresse ein." },
        { status: 400 }
      );
    }

    const result = await addToWaitlist(email, body.source ?? "landing");

    if (result.message === "already_exists") {
      return NextResponse.json(
        { message: "Du bist bereits auf der Warteliste. Wir melden uns!" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Du bist dabei. Wir melden uns." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Etwas ist schiefgelaufen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
