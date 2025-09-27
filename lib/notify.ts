export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export type SendSmsOptions = {
  to: string; // E.164 format preferred
  text: string;
};

export async function sendEmailViaResend(opts: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Styler <noreply@styler.app>";
  if (!apiKey) {
    return { ok: false, reason: "RESEND_API_KEY not set" } as const;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, reason: `Resend HTTP ${res.status}: ${body}` } as const;
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id } as const;
  } catch (e) {
    return { ok: false, reason: (e as Error).message } as const;
  }
}

export async function sendSmsViaPindo(opts: SendSmsOptions) {
  const apiKey = process.env.PINDO_API_KEY;
  const sender = process.env.PINDO_SENDER || "Styler";
  if (!apiKey) {
    return { ok: false, reason: "PINDO_API_KEY not set" } as const;
  }
  try {
    const res = await fetch("https://api.pindo.io/v1/sms/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: opts.to, text: opts.text, sender }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, reason: `Pindo HTTP ${res.status}: ${body}` } as const;
    }
    const data = (await res.json().catch(() => ({}))) as { message_id?: string };
    return { ok: true, id: data.message_id } as const;
  } catch (e) {
    return { ok: false, reason: (e as Error).message } as const;
  }
}
