import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { adminOnly } from '../middleware/admin.js';

const router = Router();
const prisma = new PrismaClient();

// All routes require admin role
router.use(adminOnly);

// ── Stats overview ──────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const [totalUsers, totalNumbers, activeNumbers, totalCalls, totalSms] = await Promise.all([
    prisma.user.count(),
    prisma.virtualNumber.count(),
    prisma.virtualNumber.count({ where: { active: true } }),
    prisma.callLog.count(),
    prisma.smsLog.count(),
  ]);

  // Total revenue = sum of all purchased number prices
  const revenue = await prisma.virtualNumber.aggregate({ _sum: { monthlyPrice: true } });

  // Total balance held across all users
  const balances = await prisma.user.aggregate({ _sum: { balance: true } });

  res.json({
    totalUsers,
    totalNumbers,
    activeNumbers,
    totalCalls,
    totalSms,
    totalRevenue: revenue._sum.monthlyPrice || 0,
    totalBalanceHeld: balances._sum.balance || 0,
  });
});

// ── User management ─────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, role: true, balance: true, createdAt: true,
      _count: { select: { numbers: true, calls: true, messages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

router.get('/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, email: true, role: true, balance: true, createdAt: true,
      numbers: { orderBy: { createdAt: 'desc' } },
      calls: { orderBy: { createdAt: 'desc' }, take: 20 },
      messages: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Adjust a user's balance
router.patch('/users/:id/balance', async (req, res) => {
  const { amount, operation } = req.body; // operation: set | increment | decrement
  if (!amount || !operation) return res.status(400).json({ error: 'amount and operation required' });

  const data =
    operation === 'set'       ? { balance: parseFloat(amount) } :
    operation === 'increment' ? { balance: { increment: parseFloat(amount) } } :
    operation === 'decrement' ? { balance: { decrement: parseFloat(amount) } } :
    null;

  if (!data) return res.status(400).json({ error: 'Invalid operation' });

  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: { id: true, email: true, balance: true } });
  res.json(user);
});

// Change user role
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Role must be user or admin' });
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, email: true, role: true },
  });
  res.json(user);
});

// Reset user password
router.patch('/users/:id/password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.params.id }, data: { password: hashed } });
  res.json({ success: true });
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ── Number management ────────────────────────────────────────────
router.get('/numbers', async (req, res) => {
  const numbers = await prisma.virtualNumber.findMany({
    include: { user: { select: { id: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(numbers);
});

// Force-release a number
router.delete('/numbers/:id', async (req, res) => {
  await prisma.virtualNumber.update({
    where: { id: req.params.id },
    data: { active: false },
  });
  res.json({ success: true });
});

// ── Call & SMS logs ──────────────────────────────────────────────
router.get('/calls', async (req, res) => {
  const calls = await prisma.callLog.findMany({
    include: {
      user: { select: { email: true } },
      number: { select: { number: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(calls);
});

router.get('/sms', async (req, res) => {
  const messages = await prisma.smsLog.findMany({
    include: {
      user: { select: { email: true } },
      number: { select: { number: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(messages);
});

export default router;
