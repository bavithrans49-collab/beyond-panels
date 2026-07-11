import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isRazorpayConfigured, verifyPaymentSignature } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });
  }

  const userId = (session.user as any).id;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseIds } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !purchaseIds?.length) {
    return NextResponse.json({ error: "Invalid payment data" }, { status: 400 });
  }

  const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!isValid) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  await prisma.purchase.updateMany({
    where: { id: { in: purchaseIds }, userId },
    data: { status: "confirmed" },
  });

  return NextResponse.json({ success: true });
}
