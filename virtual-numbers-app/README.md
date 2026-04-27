# VirtualLine - Virtual Phone Number App

Sell virtual phone numbers with inbound/outbound calls and SMS.

## Stack
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: React + Vite
- **Telephony**: Twilio (numbers, voice, SMS)
- **Payments**: Stripe Checkout

## Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database
- Twilio account (https://twilio.com)
- Stripe account (https://stripe.com)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run db:generate
npm run db:push
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Twilio Setup

1. Create a Twilio account and get your Account SID + Auth Token
2. Create a TwiML App (Console > Voice > TwiML Apps):
   - Voice Request URL: `http://your-domain/webhooks/voice`
   - Set `TWILIO_TWIML_APP_SID` in .env
3. For local dev, use [ngrok](https://ngrok.com) to expose your backend:
   ```bash
   ngrok http 3001
   ```
   Then set `BASE_URL` in .env to your ngrok URL.

## Stripe Setup

1. Get your secret key from Stripe Dashboard
2. For webhooks, run Stripe CLI locally:
   ```bash
   stripe listen --forward-to localhost:3001/webhooks/stripe
   ```
   Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in .env

## Environment Variables

See `backend/.env.example` for all required variables.
