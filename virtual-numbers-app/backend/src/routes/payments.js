import { Router } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { createBinancePayOrder } from '../lib/binancePay.js';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe checkout session to top up balance
router.post('/topup', authenticate, async (req, res) => {
  const { amount } = req.body; // amount in USD (e.g. 10, 20, 50)
  if (!amount || amount < 5) return res.status(400).json({ error: 'Minimum top-up is $5' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Account Balance Top-Up' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?topup=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?topup=cancelled`,
      metadata: { userId: req.user.id, amount: amount.toString() },
    });

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create Binance Pay order to top up balance
router.post('/topup/crypto', authenticate, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 5) return res.status(400).json({ error: 'Minimum top-up is $5' });

  // Unique trade number: userId prefix + timestamp
  const merchantTradeNo = `${req.user.id.slice(0, 8)}-${Date.now()}`;

  try {
    const { checkoutUrl, prepayId } = await createBinancePayOrder({
      merchantTradeNo,
      amount,
      description: 'VirtualLine Balance Top-Up',
    });

    // Store pending order so webhook can credit the right user
    await prisma.pendingPayment.create({
      data: {
        merchantTradeNo,
        prepayId,
        userId: req.user.id,
        amount,
        provider: 'binance',
      },
    });

    res.json({ url: checkoutUrl, prepayId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get current balance
router.get('/balance', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { balance: true },
  });
  res.json({ balance: user.balance });
});

export default router;
