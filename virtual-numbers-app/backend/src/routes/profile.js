import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get profile
router.get('/', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, balance: true, forwardingNumber: true, role: true },
  });
  res.json(user);
});

// Update forwarding number
router.patch('/forwarding', authenticate, async (req, res) => {
  const { forwardingNumber } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { forwardingNumber: forwardingNumber || null },
    select: { id: true, email: true, forwardingNumber: true },
  });
  res.json(user);
});

export default router;
