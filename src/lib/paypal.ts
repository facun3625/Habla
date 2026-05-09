import { getSettings } from './settings';

function base(mode: string) {
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken(clientId: string, secret: string, mode: string): Promise<string> {
  const res = await fetch(`${base(mode)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

export async function createPayPalOrder(params: {
  amount: number;
  currency: string;
  description: string;
  enrollmentId: number;
  returnUrl: string;
  cancelUrl: string;
}) {
  const cfg = await getSettings(['paypal_client_id', 'paypal_secret', 'paypal_mode']);
  if (!cfg.paypal_client_id || !cfg.paypal_secret) throw new Error('PayPal no configurado');

  const mode = cfg.paypal_mode ?? 'sandbox';
  const token = await getAccessToken(cfg.paypal_client_id, cfg.paypal_secret, mode);

  const res = await fetch(`${base(mode)}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: String(params.enrollmentId),
        description: params.description,
        amount: { currency_code: params.currency, value: params.amount.toFixed(2) },
      }],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        brand_name: 'Hablapraxia',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
      },
    }),
  });
  return res.json();
}

export async function capturePayPalOrder(orderId: string) {
  const cfg = await getSettings(['paypal_client_id', 'paypal_secret', 'paypal_mode']);
  if (!cfg.paypal_client_id || !cfg.paypal_secret) throw new Error('PayPal no configurado');

  const mode = cfg.paypal_mode ?? 'sandbox';
  const token = await getAccessToken(cfg.paypal_client_id, cfg.paypal_secret, mode);

  const res = await fetch(`${base(mode)}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.json();
}
