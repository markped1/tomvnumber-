import { Router } from 'express';
import Telnyx from 'telnyx';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

// Send SMS
router.post('/send', authenticate, async (req, res) => {
  const { to, body, fromNumberId } = req.body;
  const number = await prisma.virtualNumber.findFirst({
    where: { id: fromNumberId, userId: req.user.id, active: true },
  });
  if (!number) return res.status(404).json({ error: 'Number not found' });

  try {
    const message = await telnyx.messages.create({
      from: number.number,
      to,
      text: body,
    });

    const log = await prisma.smsLog.create({
      data: {
        smsSid: message.data.id,
        direction: 'outbound',
        from: number.number,
        to,
        body,
        status: message.data.to[0]?.status || 'queued',
        userId: req.user.id,
        numberId: number.id,
      },
    });

    res.json(log);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get SMS history
router.get('/history', authenticate, async (req, res) => {
  const messages = await prisma.smsLog.findMany({
    where: { userId: req.user.id },
    include: { number: { select: { number: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(messages);
});

export default router;
