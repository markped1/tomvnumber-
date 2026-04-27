/**
 * Run this once to create your admin account:
 *   node src/scripts/createAdmin.js
 *
 * To customize email/password, edit the values below before running.
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// ✏️ Change these before running
const EMAIL = 'admin@virtualline.com';
const PASSWORD = 'changeme123';

const hashed = await bcrypt.hash(PASSWORD, 10);

const admin = await prisma.user.upsert({
  where: { email: EMAIL },
  update: { role: 'admin', password: hashed },
  create: { email: EMAIL, password: hashed, role: 'admin' },
});

console.log(`✅ Admin account ready: ${admin.email}`);
await prisma.$disconnect();
