import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    const record = await prisma.verificationCode.findFirst({
      where: { email, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Verify code error:", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
