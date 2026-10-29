import Razorpay from 'razorpay';

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TsU73uTYIkcWgi',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'L4xpEHidBAKnVDktYkPG4I5p'
});

