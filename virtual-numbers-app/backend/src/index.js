import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import numberRoutes from './routes/numbers.js';
import callRoutes from './routes/calls.js';
import smsRoutes from './routes/sms.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

// Stripe webhooks need raw body
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/numbers', numberRoutes);
app.use('/calls', callRoutes);
app.use('/sms', smsRoutes);
app.use('/payments', paymentRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
