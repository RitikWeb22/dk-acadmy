import Razorpay from 'razorpay';

// Ensure Razorpay SDK initializes safely without leaking real production secrets
const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

if (process.env.NODE_ENV === 'production' && (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)) {
  console.warn('[Security Warning]: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in production environment.');
}

export const razorpayInstance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret
});

