const RESEND_EMAILS_URL = "https://api.resend.com/emails";

type ResendPayload = Record<string, unknown> & {
  from?: string;
};

export function getResendFrom(context: string): string {
  const from = Deno.env.get("RESEND_FROM")?.trim();
  if (!from) {
    console.error(`[${context}] RESEND_FROM missing`);
    throw new Error("RESEND_FROM missing");
  }
  console.log(`[${context}] Resend from address: ${from}`);
  return from;
}

export async function sendResendEmail(context: string, payload: ResendPayload) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error(`[${context}] RESEND_API_KEY missing`);
    throw new Error("RESEND_API_KEY missing");
  }

  const from = getResendFrom(context);
  const response = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, from }),
  });

  const responseText = await response.text();
  let body: unknown = {};
  try {
    body = responseText ? JSON.parse(responseText) : {};
  } catch {
    body = { raw: responseText };
  }

  console.log(`[${context}] Resend response status: ${response.status}`);
  if (!response.ok) {
    console.error(`[${context}] Resend error response body: ${responseText}`);
  }

  return { response, body, responseText };
}