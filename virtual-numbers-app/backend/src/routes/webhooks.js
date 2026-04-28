import { Router } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Telnyx: inbound call webhook
router.post('/voice', async (req, res) => {
  const { data } = req.body;
  if (!data) return res.sendStatus(200);

  const { event_type, payload } = data;

  if (event_type === 'call.initiated') {
    const { call_control_id, from, to, direction } = payload;

    const number = await prisma.virtualNumber.findFirst({
      where: { number: to, active: true },
      include: { user: true },
    });

    if (number) {
      await prisma.callLog.create({
        data: {
          callSid: call_control_id,
          direction: direction || 'inbound',
          from,
          to,
          status: 'initiated',
          userId: number.userId,
          numberId: number.id,
        },
      }).catch(() => {});

      // If user has a forwarding number, forward the call
      if (number.user.forwardingNumber) {
        try {
          const telnyx = (await import('telnyx')).default;
          const client = new telnyx(process.env.TELNYX_API_KEY);
          await client.calls.create({
            connection_id: process.env.TELNYX_CONNECTION_ID,
            to: number.user.forwardingNumber,
            from: from,
            webhook_url: `${process.env.BASE_URL}/webhooks/voice`,
          });
        } catch (e) {
          console.error('Forward call failed:', e.message);
        }
      }
    }
  }

  if (event_type === 'call.hangup') {
    const { call_control_id, hangup_cause } = payload;
    await prisma.callLog.updateMany({
      where: { callSid: call_control_id },
      data: { status: hangup_cause || 'completed' },
    }).catch(() => {});
  }

  res.sendStatus(200);
});

// Telnyx: inbound SMS webhook
router.post('/sms', async (req, res) => {
  const { data } = req.body;
  if (!data) return res.sendStatus(200);

  const { payload } = data;
  const to = payload?.to?.[0]?.phone_number;
  const from = payload?.from?.phone_number;
  const body = payload?.text;
  const messageId = payload?.id;

  if (to && from && body) {
    const number = await prisma.virtualNumber.findFirst({
      where: { number: to, active: true },
      include: { user: true },
    });

    if (number) {
      await prisma.smsLog.create({
        data: {
          smsSid: messageId,
          direction: 'inbound',
          from,
          to,
          body,
          status: 'received',
          userId: number.userId,
          numberId: number.id,
        },
      }).catch(() => {});

      // Forward SMS to user's real phone number if set
      if (number.user.forwardingNumber) {
        try {
          const telnyx = (await import('telnyx')).default;
          const client = new telnyx(process.env.TELNYX_API_KEY);
          await client.messages.create({
            from: to, // send from the virtual number
            to: number.user.forwardingNumber,
            text: `📨 From ${from}:\n${body}`,
          });
        } catch (e) {
          console.error('SMS forward failed:', e.message);
        }
      }
    }
  }

  res.sendStatus(200);
});

// Stripe webhook: handle successful payment
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, amount } = session.metadata;
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: parseFloat(amount) } },
    });
  }

  res.json({ received: true });
});

// Binance Pay webhook
router.post('/binance', async (req, res) => {
  const { bizType, bizStatus, bizIdStr } = req.body;
  if (bizType === 'PAY' && bizStatus === 'PAY_SUCCESS') {
    const pending = await prisma.pendingPayment.findUnique({
      where: { merchantTradeNo: bizIdStr },
    });
    if (pending && !pending.credited) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: pending.userId },
          data: { balance: { increment: pending.amount } },
        }),
        prisma.pendingPayment.update({
          where: { id: pending.id },
          data: { credited: true },
        }),
      ]);
    }
  }
  res.json({ returnCode: 'SUCCESS', returnMessage: null });
});

export default router;
