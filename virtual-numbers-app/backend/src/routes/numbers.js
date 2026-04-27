import { Router } from 'express';
import Telnyx from 'telnyx';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

const MONTHLY_PRICE = 5.00;

// Search available numbers
router.get('/search', authenticate, async (req, res) => {
  const { country = 'US', areaCode } = req.query;
  try {
    const params = {
      filter: {
        country_code: country,
        features: ['sms', 'voice'],
        limit: 10,
      },
    };
    if (areaCode) params.filter.national_destination_code = areaCode;

    const response = await telnyx.availablePhoneNumbers.list(params);
    res.json(response.data.map(n => ({
      phoneNumber: n.phone_number,
      friendlyName: n.phone_number,
      region: n.region_information?.[0]?.region_name || country,
      monthlyPrice: MONTHLY_PRICE,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Purchase a number
router.post('/purchase', authenticate, async (req, res) => {
  const { phoneNumber, country = 'US' } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (user.balance < MONTHLY_PRICE) {
    return res.status(402).json({ error: 'Insufficient balance. Please top up.' });
  }

  try {
    const purchased = await telnyx.phoneNumbers.create({
      phone_number: phoneNumber,
      connection_id: process.env.TELNYX_CONNECTION_ID || undefined,
    });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const [virtualNumber] = await prisma.$transaction([
      prisma.virtualNumber.create({
        data: {
          number: phoneNumber,
          twilioSid: purchased.data.id, // reusing field for Telnyx number ID
          country,
          monthlyPrice: MONTHLY_PRICE,
          expiresAt,
          userId: req.user.id,
        },
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: { balance: { decrement: MONTHLY_PRICE } },
      }),
    ]);

    res.json(virtualNumber);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List user's numbers
router.get('/', authenticate, async (req, res) => {
  const numbers = await prisma.virtualNumber.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(numbers);
});

// Release a number
router.delete('/:id', authenticate, async (req, res) => {
  const number = await prisma.virtualNumber.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!number) return res.status(404).json({ error: 'Number not found' });

  try {
    await telnyx.phoneNumbers.del(number.twilioSid);
    await prisma.virtualNumber.update({
      where: { id: number.id },
      data: { active: false },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
