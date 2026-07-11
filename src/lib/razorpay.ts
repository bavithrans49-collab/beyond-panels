const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export function isRazorpayConfigured() {
  return !!(KEY_ID && KEY_SECRET);
}

export function getRazorpayKeyId() {
  return KEY_ID || "";
}

export async function createRazorpayOrder(amount: number, currency = "INR") {
  const Razorpay = (await import("razorpay")).default;
  const instance = new Razorpay({ key_id: KEY_ID!, key_secret: KEY_SECRET! });
  const order = await instance.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt: `receipt_${Date.now()}`,
  });
  return order;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
) {
  const crypto = require("crypto");
  const body = orderId + "|" + paymentId;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expected === signature;
}
