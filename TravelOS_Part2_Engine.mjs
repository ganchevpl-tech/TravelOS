/**
 * TravelOS — AI Model Dispatcher + Webhook Handlers
 * Node.js / Express
 *
 * The Dispatcher routes requests to 3 AI models:
 *   • GPT-4o-mini    → general chat / greetings (fast + cheap)
 *   • Claude Sonnet  → complex itinerary planning + pricing logic
 *   • Gemini 1.5 Pro → marketing data + ad-spend analysis
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

const app = express();
app.use(express.json());

// ─── Clients ────────────────────────────────────────────────
const supabase   = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const stripe     = new Stripe(process.env.STRIPE_SECRET_KEY);
const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai     = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini     = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ════════════════════════════════════════════════════════════
//  AI MODEL DISPATCHER
// ════════════════════════════════════════════════════════════

/**
 * Intent classifier — determines which model to use
 */
function classifyIntent(message, context = {}) {
  const msg = message.toLowerCase();

  // 1. Marketing / analytics → Gemini
  const marketingKeywords = ['реклама','кампания','cpl','roas','facebook','instagram','бюджет реклама','meta','ads','spend','conversion','pixel'];
  if (marketingKeywords.some(k => msg.includes(k)) || context.taskType === 'marketing_analysis') {
    return { model: 'gemini', reason: 'marketing_analytics' };
  }

  // 2. Complex itinerary / pricing → Claude
  const complexKeywords = ['itinerary','маршрут','ден','програма','хотел','оферта','пакет','хотели','цена','почивка','пътуване','нощ','all inclusive','настаняване'];
  const isOfferRequest = complexKeywords.some(k => msg.includes(k)) || context.needsOffer;
  if (isOfferRequest || msg.length > 120) {
    return { model: 'claude', reason: 'complex_planning' };
  }

  // 3. Simple chat / greeting → GPT-4o-mini
  return { model: 'gpt-mini', reason: 'simple_chat' };
}

/**
 * Main dispatcher — routes to the right model
 */
async function dispatch({ message, history = [], agencyId, systemPrompt, context = {} }) {
  const { model, reason } = classifyIntent(message, context);

  // Log the routing decision
  await supabase.from('ai_action_log').insert({
    agency_id:   agencyId,
    action_type: 'MODEL_DISPATCH',
    ai_model:    model,
    input_data:  { message: message.substring(0, 200), reason, historyLen: history.length },
    status:      'executed'
  });

  console.log(`[Dispatcher] → ${model} (${reason}): "${message.substring(0, 60)}"`);

  if (model === 'claude') return dispatchClaude({ message, history, systemPrompt });
  if (model === 'gemini') return dispatchGemini({ message, history });
  return dispatchGPTMini({ message, history, systemPrompt });
}

// ── Claude Sonnet — complex itinerary + pricing ──────────────
async function dispatchClaude({ message, history, systemPrompt }) {
  const start = Date.now();
  const response = await anthropic.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system:     systemPrompt,
    messages:   [...history, { role: 'user', content: message }]
  });
  const text = response.content[0]?.text || '';
  console.log(`[Claude] ${Date.now()-start}ms · ${response.usage?.input_tokens}+${response.usage?.output_tokens} tokens`);
  return { text, model: 'claude-sonnet-4-20250514', usage: response.usage };
}

// ── GPT-4o-mini — greetings + simple FAQ ────────────────────
async function dispatchGPTMini({ message, history, systemPrompt }) {
  const start = Date.now();
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message }
  ];
  const response = await openai.chat.completions.create({
    model:      'gpt-4o-mini',
    max_tokens: 500,
    messages
  });
  const text = response.choices[0]?.message?.content || '';
  console.log(`[GPT-mini] ${Date.now()-start}ms · ${response.usage?.total_tokens} tokens`);
  return { text, model: 'gpt-4o-mini', usage: response.usage };
}

// ── Gemini 1.5 Pro — marketing analysis ─────────────────────
async function dispatchGemini({ message, history }) {
  const start = Date.now();
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const chat = model.startChat({
    history: history.map(h => ({
      role:  h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }))
  });
  const result = await chat.sendMessage(message);
  const text = result.response.text();
  console.log(`[Gemini] ${Date.now()-start}ms`);
  return { text, model: 'gemini-1.5-pro', usage: null };
}

// ── Agency-specific system prompt builder ───────────────────
async function buildSystemPrompt(agencyId) {
  const { data: agency } = await supabase
    .from('agencies')
    .select('name, brand_voice, default_min_margin_pct, default_target_margin_pct, bank_transfer_threshold')
    .eq('id', agencyId)
    .single();

  return `Ти си AI асистент на туристическа агенция "${agency?.name || 'TravelOS'}" в България.
Отговаряш само на български.
Brand Voice: ${agency?.brand_voice || 'Приятелски и топъл тон.'}
Мин. марж: ${agency?.default_min_margin_pct || 3}%. Target марж: ${agency?.default_target_margin_pct || 10}%.
При оферта завърши с OFFER_JSON:{...} (виж формата).
Цени: target = comp_price × 0.995, price ≥ vendor_cost × (1 + min_margin/100).`;
}

// ════════════════════════════════════════════════════════════
//  INFOBIP MESSAGE RESOLVER
//  Maps incoming messages to the correct agency by destination number
// ════════════════════════════════════════════════════════════

/**
 * Find agency by the Infobip sender/destination number
 */
async function resolveAgencyBySender(destinationNumber) {
  // Try Viber sender IDs
  let { data } = await supabase
    .from('agencies')
    .select('id, name, brand_voice, default_min_margin_pct')
    .eq('viber_sender_id', destinationNumber)
    .eq('is_active', true)
    .single();

  if (!data) {
    // Try WhatsApp
    ({ data } = await supabase
      .from('agencies')
      .select('id, name, brand_voice, default_min_margin_pct')
      .eq('whatsapp_sender_id', destinationNumber)
      .eq('is_active', true)
      .single());
  }

  return data;
}

/**
 * Ensure lead exists for this phone number under this agency
 */
async function upsertLead(agencyId, phoneNumber, channel, utm = {}) {
  const { data: existing } = await supabase
    .from('leads')
    .select('id, conversation_id, message_count')
    .eq('agency_id', agencyId)
    .eq('phone', phoneNumber)
    .single();

  if (existing) {
    await supabase.from('leads').update({
      message_count: existing.message_count + 1,
      last_message_at: new Date().toISOString(),
      status: 'contacted'
    }).eq('id', existing.id);
    return existing;
  }

  const { data: newLead } = await supabase.from('leads').insert({
    agency_id:      agencyId,
    phone:          phoneNumber,
    source_channel: channel,
    status:         'new',
    utm_source:     utm.source,
    utm_medium:     utm.medium,
    utm_campaign:   utm.campaign,
    fbclid:         utm.fbclid,
    gclid:          utm.gclid,
    conversation_id: `conv_${Date.now()}_${Math.random().toString(36).substr(2,6)}`
  }).select().single();

  return newLead;
}

// ────────────────────────────────────────────────────────────
// POST /webhooks/infobip — Infobip Viber/WhatsApp messages
// ────────────────────────────────────────────────────────────
app.post('/webhooks/infobip', async (req, res) => {
  res.json({ status: 'ok' }); // Infobip expects quick 200

  try {
    const payload = req.body;
    // Infobip Viber message structure
    const results = payload.results || [];

    for (const msg of results) {
      const fromNumber  = msg.from;                     // client's phone
      const toNumber    = msg.to;                       // our Viber sender ID
      const messageText = msg.message?.text || '';
      const channel     = msg.channel || 'VIBER';

      if (!messageText.trim()) continue;

      // 1. Resolve which agency owns this number
      const agency = await resolveAgencyBySender(toNumber);
      if (!agency) {
        console.warn(`[Infobip] No agency found for sender: ${toNumber}`);
        continue;
      }

      // 2. Upsert lead
      const lead = await upsertLead(agency.id, fromNumber, channel.toLowerCase());

      // 3. Load conversation history (last 10 messages from AI log)
      const { data: logs } = await supabase
        .from('ai_action_log')
        .select('input_data, output_data')
        .eq('agency_id', agency.id)
        .eq('action_type', 'CHAT_REPLY')
        .contains('input_data', { lead_id: lead.id })
        .order('created_at', { ascending: false })
        .limit(10);

      const history = (logs || []).reverse().flatMap(l => [
        { role: 'user',      content: l.input_data?.message || '' },
        { role: 'assistant', content: l.output_data?.reply || '' }
      ]).filter(h => h.content);

      // 4. Build system prompt for this agency
      const systemPrompt = await buildSystemPrompt(agency.id);

      // 5. Dispatch to AI model
      const { text: reply, model } = await dispatch({
        message:      messageText,
        history,
        agencyId:     agency.id,
        systemPrompt,
        context:      { needsOffer: history.length > 2 }
      });

      // 6. Log the exchange
      await supabase.from('ai_action_log').insert({
        agency_id:   agency.id,
        action_type: 'CHAT_REPLY',
        ai_model:    model,
        lead_id:     lead.id,
        input_data:  { message: messageText, lead_id: lead.id },
        output_data: { reply: reply.replace(/OFFER_JSON:[\s\S]+$/,'').trim() },
        status:      'executed'
      });

      // 7. Send reply via Infobip
      await sendInfobipMessage(agency, fromNumber, reply, channel);

      console.log(`[Infobip] ${channel} | Agency: ${agency.name} | Lead: ${fromNumber} | Model: ${model}`);
    }

  } catch (err) {
    console.error('[Infobip Webhook Error]', err);
  }
});

// Send via Infobip API
async function sendInfobipMessage(agency, toNumber, text, channel) {
  if (!agency.infobip_api_key || !agency.infobip_base_url) {
    console.warn('[Infobip] Missing API credentials for agency:', agency.id);
    return;
  }

  // Strip OFFER_JSON from message to client
  const cleanText = text.replace(/OFFER_JSON:[\s\S]+$/,'').trim();

  const endpoint = channel === 'WHATSAPP'
    ? `/whatsapp/1/message/text`
    : `/viber/2/message`;

  const body = channel === 'VIBER'
    ? { messages: [{ from: agency.viber_sender_id, destinations: [{ to: toNumber }],
        viber: { text: cleanText, type: 'TEXT' } }] }
    : { from: agency.whatsapp_sender_id, to: toNumber, content: { text: cleanText } };

  await fetch(`${agency.infobip_base_url}${endpoint}`, {
    method:  'POST',
    headers: {
      'Authorization': `App ${agency.infobip_api_key}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify(body)
  });
}

// ════════════════════════════════════════════════════════════
//  STRIPE WEBHOOK — payment verification → auto voucher
// ════════════════════════════════════════════════════════════
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  // Verify webhook signature
  let event;
  try {
    // For multi-tenant: resolve agency from metadata first, then verify
    const rawPayload  = req.body.toString();
    const tempPayload = JSON.parse(rawPayload);
    const agencyId    = tempPayload.data?.object?.metadata?.agency_id;

    const { data: agency } = await supabase
      .from('agencies')
      .select('stripe_webhook_secret')
      .eq('id', agencyId)
      .single();

    event = stripe.webhooks.constructEvent(req.body, sig, agency?.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  res.json({ received: true });

  if (event.type === 'checkout.session.completed') {
    await handleStripePayment(event.data.object);
  }
  if (event.type === 'payment_intent.succeeded') {
    // Handle direct payment intents
    const pi = event.data.object;
    if (pi.metadata?.booking_id) {
      await markBookingPaid({
        bookingId:    pi.metadata.booking_id,
        amount:       pi.amount / 100,
        method:       'card',
        paymentRef:   pi.id,
        agencyId:     pi.metadata.agency_id
      });
    }
  }
});

async function handleStripePayment(session) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId || session.payment_status !== 'paid') return;

  await markBookingPaid({
    bookingId,
    amount:     session.amount_total / 100,
    method:     'card',
    paymentRef: session.payment_intent,
    agencyId:   session.metadata?.agency_id,
    sessionId:  session.id
  });
}

// ════════════════════════════════════════════════════════════
//  BANK TRANSFER WEBHOOK
//  Called by your bank (e.g. UniCredit Open Banking webhook)
// ════════════════════════════════════════════════════════════
app.post('/webhooks/bank-transfer', async (req, res) => {
  // Verify HMAC signature from bank
  const sig = req.headers['x-bank-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.BANK_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (sig !== expected) return res.status(401).json({ error: 'Invalid signature' });
  res.json({ received: true });

  const { reference, amount, currency, sender_name, sender_iban } = req.body;

  // Match by booking reference in payment description
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, agency_id, total_price, status, booking_ref')
    .eq('booking_ref', reference)
    .single();

  if (!booking) {
    console.warn(`[Bank] No booking found for ref: ${reference}`);
    return;
  }

  if (booking.status === 'paid') {
    console.log(`[Bank] Booking ${reference} already paid — ignoring duplicate`);
    return;
  }

  // Verify amount matches (allow ±€1 tolerance)
  const diff = Math.abs(parseFloat(amount) - parseFloat(booking.total_price));
  if (diff > 1.00) {
    console.error(`[Bank] Amount mismatch: received ${amount}, expected ${booking.total_price} for ${reference}`);
    // Alert supervisor
    await supabase.from('ai_action_log').insert({
      agency_id:   booking.agency_id,
      action_type: 'BANK_AMOUNT_MISMATCH',
      booking_id:  booking.id,
      input_data:  { received: amount, expected: booking.total_price, diff },
      status:      'failed',
      error_message: `Bank transfer amount mismatch: €${diff}`
    });
    return;
  }

  await markBookingPaid({
    bookingId:    booking.id,
    amount:       parseFloat(amount),
    method:       'bank_transfer',
    paymentRef:   `BANK_${Date.now()}`,
    agencyId:     booking.agency_id,
    notes:        `${sender_name} | ${sender_iban}`
  });
});

// ════════════════════════════════════════════════════════════
//  PAYMENT VERIFICATION SERVICE → triggers auto-voucher
// ════════════════════════════════════════════════════════════
async function markBookingPaid({ bookingId, amount, method, paymentRef, agencyId, sessionId, notes }) {
  console.log(`[PaymentVerification] Processing ${bookingId}: €${amount} via ${method}`);

  // 1. Update booking to PAID
  const { data: booking, error } = await supabase.from('bookings').update({
    status:               'paid',
    status_updated_at:    new Date().toISOString(),
    payment_method:       method,
    payment_route:        method === 'bank_transfer' ? 'bank' : 'stripe',
    payment_received_at:  new Date().toISOString(),
    payment_amount:       amount,
    stripe_session_id:    sessionId || null,
    stripe_payment_intent: method === 'card' ? paymentRef : null,
    bank_transfer_ref:    method === 'bank_transfer' ? paymentRef : null,
    updated_at:           new Date().toISOString()
  }).eq('id', bookingId).select().single();

  if (error) {
    console.error('[PaymentVerification] DB update failed:', error);
    return;
  }

  // 2. Log status change
  await supabase.from('ai_action_log').insert({
    agency_id:   agencyId,
    action_type: 'PAYMENT_CONFIRMED',
    booking_id:  bookingId,
    ai_model:    'system',
    input_data:  { amount, method, reference: paymentRef },
    output_data: { status: 'paid', booking_ref: booking.booking_ref },
    status:      'executed'
  });

  // 3. Add to financial ledger
  await supabase.from('financial_ledger').insert({
    agency_id:   agencyId,
    booking_id:  bookingId,
    entry_type:  'incoming',
    amount,
    currency:    booking.currency || 'EUR',
    settled_at:  new Date().toISOString(),
    description: `${method === 'bank_transfer' ? 'Bank transfer' : 'Stripe payment'} · ${booking.booking_ref}${notes ? ` · ${notes}` : ''}`
  });

  // 4. AUTO-GENERATE VOUCHER (Financial Shield check is in DB trigger)
  await issueVoucher(booking, agencyId);
}

// ────────────────────────────────────────────
// Voucher issuance service
// ────────────────────────────────────────────
async function issueVoucher(booking, agencyId) {
  const voucherRef = `VCH-${Date.now().toString(36).toUpperCase()}`;

  // This will FAIL if booking is not 'paid' thanks to the DB trigger
  const { error } = await supabase.from('bookings').update({
    status:         'voucher_issued',
    voucher_path:   `/vouchers/${agencyId}/${booking.booking_ref}.pdf`,
    voucher_sent_at: new Date().toISOString()
  }).eq('id', booking.id);

  if (error) {
    console.error(`[VoucherService] BLOCKED by Financial Shield: ${error.message}`);
    return;
  }

  // Send voucher via Infobip Viber
  const { data: agency } = await supabase
    .from('agencies')
    .select('infobip_api_key, infobip_base_url, viber_sender_id')
    .eq('id', agencyId)
    .single();

  if (agency && booking.client_phone) {
    const voucherMsg = `🎫 Вашият ваучер е готов!\n\nРезервация: ${booking.booking_ref}\nПлатена сума: €${booking.payment_amount}\n\nПриятно пътуване! ✈️🌴`;
    await sendInfobipMessage(agency, booking.client_phone, voucherMsg, 'VIBER');
  }

  console.log(`[VoucherService] Voucher issued for ${booking.booking_ref} ✓`);
}

// ════════════════════════════════════════════════════════════
//  DISPATCHER API ENDPOINT
// ════════════════════════════════════════════════════════════
app.post('/api/chat', async (req, res) => {
  const { message, history, agency_id, context } = req.body;
  try {
    const systemPrompt = await buildSystemPrompt(agency_id);
    const result = await dispatch({ message, history, agencyId: agency_id, systemPrompt, context });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ status: 'TravelOS Backend Online ✓', ts: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TravelOS Backend :${PORT}`));
