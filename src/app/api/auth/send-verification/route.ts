import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const code = crypto.randomInt(100000, 999999).toString();

    await prisma.verificationCode.deleteMany({ where: { email } });
    await prisma.verificationCode.create({
      data: { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
