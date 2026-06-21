const functions = require("firebase-functions");
const Razorpay = require("razorpay");

exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  // Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 'Login required'
    );
  }

  // Amount validate
  const { amount } = data;
  if (!amount || amount < 100) {
    throw new functions.https.HttpsError(
      'invalid-argument', 'Invalid amount'
    );
  }

  // Razorpay init
  const rzp = new Razorpay({
    key_id: functions.config().razorpay.key_id,
    key_secret: functions.config().razorpay.key_secret,
  });

  // Order create
  const order = await rzp.orders.create({
    amount: Math.round(amount), // paise
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  };
});
