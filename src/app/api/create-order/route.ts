import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isRazorpayConfigured, createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });
  }

  const { amount } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const order = await createRazorpayOrder(amount);
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
    });
  } catch (e) {
    console.error("Razorpay order error:", e);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
