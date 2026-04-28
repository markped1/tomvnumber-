import { Router } from 'express';
import Telnyx from 'telnyx';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

// Generate Telnyx WebRTC credential token for browser calling
router.get('/token', authenticate, async (req, res) => {
  try {
    // Return SIP credentials for WebRTC client
    res.json({
      login: process.env.TELNYX_SIP_USERNAME,
      password: process.env.TELNYX_SIP_PASSWORD,
      callerIdNumber: null, // will be set per call
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Make outbound call
router.post('/outbound', authenticate, async (req, res) => {
  const { to, fromNumberId } = req.body;
  const number = await prisma.virtualNumber.findFirst({
    where: { id: fromNumberId, userId: req.user.id, active: true },
  });
  if (!number) return res.status(404).json({ error: 'Number not found' });

  try {
    const call = await telnyx.calls.create({
      connection_id: process.env.TELNYX_CONNECTION_ID,
      to,
      from: number.number,
      webhook_url: `${process.env.BASE_URL}/webhooks/voice`,
    });

    await prisma.callLog.create({
      data: {
        callSid: call.data.call_control_id,
        direction: 'outbound',
        from: number.number,
        to,
        status: 'initiated',
        userId: req.user.id,
        numberId: number.id,
      },
    });

    res.json({ callId: call.data.call_control_id, status: 'initiated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get call history
router.get('/history', authenticate, async (req, res) => {
  const calls = await prisma.callLog.findMany({
    where: { userId: req.user.id },
    include: { number: { select: { number: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(calls);
});

export default router;
