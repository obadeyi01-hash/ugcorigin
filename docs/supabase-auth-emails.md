# UGCOrigin — Supabase Auth email templates

These replace Supabase's plain default auth emails with on-brand, high-energy
UGCOrigin emails, sent from a **no-reply** address through **Resend**.

There are two parts:
1. **One-time setup** — route Supabase auth mail through Resend + set the From.
2. **The templates** — paste each into Supabase Dashboard → Authentication → Emails.

> Note: these are the **Supabase Auth** emails (signup confirm, magic link,
> password reset, email change, invite, reauthentication). Your *product* emails
> (approvals, notifications, broadcasts) already go through Resend in app code
> (`src/lib/email/send.ts`) and aren't affected by this.

---

## 1. One-time setup (sender + routing)

### a) Verify your domain in Resend
In Resend → **Domains** → add `ugcorigin.com` and add the DNS records it gives
you (SPF, DKIM, and the return-path). Wait until it shows **Verified**. Without
this, `no-reply@ugcorigin.com` will land in spam or bounce.

### b) Point Supabase Auth at Resend's SMTP (so you control the From)
Supabase Dashboard → **Authentication → Emails → SMTP Settings** → **Enable
Custom SMTP** and enter:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) — or `587` (TLS) |
| Username | `resend` |
| Password | your **Resend API key** (`re_...`) |
| Sender email | `no-reply@ugcorigin.com` |
| Sender name | `UGCOrigin` |

Save. From now on all auth emails come **from `UGCOrigin <no-reply@ugcorigin.com>`**,
not Supabase's default address. (A reply-to isn't needed; the footer tells users
the mailbox isn't monitored.)

### c) Raise the rate limit if needed
Supabase → Authentication → **Rate Limits** → bump the email rate limit once
custom SMTP is on (the tiny default is only for Supabase's built-in sender).

### d) Set the Site URL + redirect URLs
Authentication → **URL Configuration** → Site URL = `https://ugcorigin.com`, and
add any redirect URLs you use. The templates rely on `{{ .ConfirmationURL }}`
which Supabase builds from these.

---

## 2. Templates

For each one in **Authentication → Emails**, set the **Subject** and paste the
**Message body (HTML)**. Supabase variables used: `{{ .ConfirmationURL }}`,
`{{ .Token }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .SiteURL }}`.

The shared look: powder background, white card, Origin-Pink button, Space-Grotesk-ish
display via web-safe stack, a no-reply footer with Dream Intrepid Ltd.

---

### 2.1 Confirm signup
**Subject:** `Confirm your email — you're one tap from UGCOrigin`

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f7f5;font-family:Helvetica,Arial,sans-serif;color:#15161a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">One tap and your UGCOrigin account is live.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ececea;border-radius:20px;overflow:hidden;">
          <tr><td style="padding:28px 32px 8px;">
            <span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;"><span style="color:#db2777;">UGC</span><span style="color:#15161a;">Origin</span></span>
          </td></tr>
          <tr><td style="padding:12px 32px 0;">
            <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:#15161a;">Welcome in — let's make it official</h1>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#44464d;">You're a tap away from joining Nigeria's network for real, human, original content. Confirm your email and your account is live.</p>
          </td></tr>
          <tr><td style="padding:26px 32px 6px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:999px;">Confirm my email</a>
          </td></tr>
          <tr><td style="padding:16px 32px 0;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#85868d;">Button not working? Paste this link into your browser:<br><a href="{{ .ConfirmationURL }}" style="color:#be185d;word-break:break-all;">{{ .ConfirmationURL }}</a></p>
          </td></tr>
          <tr><td style="padding:24px 32px 28px;border-top:1px solid #f1f1ef;margin-top:16px;">
            <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#a0a1a7;">You're getting this because someone signed up for UGCOrigin with {{ .Email }}. If that wasn't you, you can ignore this email. This mailbox isn't monitored — please don't reply.</p>
            <p style="margin:10px 0 0;font-size:12px;color:#a0a1a7;">UGCOrigin — a product by Dream Intrepid Ltd.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```

---

### 2.2 Magic Link
**Subject:** `Your UGCOrigin sign-in link`

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f7f5;font-family:Helvetica,Arial,sans-serif;color:#15161a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tap to sign in — this link is just for you.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ececea;border-radius:20px;">
          <tr><td style="padding:28px 32px 8px;"><span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;"><span style="color:#db2777;">UGC</span><span style="color:#15161a;">Origin</span></span></td></tr>
          <tr><td style="padding:12px 32px 0;">
            <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;">Your way back in</h1>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#44464d;">Tap below to sign in to UGCOrigin. The link works once and expires soon, so use it while it's warm.</p>
          </td></tr>
          <tr><td style="padding:26px 32px 6px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:999px;">Sign in to UGCOrigin</a></td></tr>
          <tr><td style="padding:16px 32px 0;"><p style="margin:0;font-size:13px;line-height:1.6;color:#85868d;">Or paste this link:<br><a href="{{ .ConfirmationURL }}" style="color:#be185d;word-break:break-all;">{{ .ConfirmationURL }}</a></p></td></tr>
          <tr><td style="padding:24px 32px 28px;border-top:1px solid #f1f1ef;">
            <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#a0a1a7;">Didn't ask to sign in? Ignore this email and your account stays locked. This mailbox isn't monitored — please don't reply.</p>
            <p style="margin:10px 0 0;font-size:12px;color:#a0a1a7;">UGCOrigin — a product by Dream Intrepid Ltd.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```

---

### 2.3 Reset Password (Recovery)
**Subject:** `Reset your UGCOrigin password`

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f7f5;font-family:Helvetica,Arial,sans-serif;color:#15161a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Set a new password in a couple of taps.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ececea;border-radius:20px;">
          <tr><td style="padding:28px 32px 8px;"><span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;"><span style="color:#db2777;">UGC</span><span style="color:#15161a;">Origin</span></span></td></tr>
          <tr><td style="padding:12px 32px 0;">
            <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;">Let's get you back in</h1>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#44464d;">Tap below to set a new password for your UGCOrigin account. This link expires soon for your safety.</p>
          </td></tr>
          <tr><td style="padding:26px 32px 6px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:999px;">Choose a new password</a></td></tr>
          <tr><td style="padding:16px 32px 0;"><p style="margin:0;font-size:13px;line-height:1.6;color:#85868d;">Or paste this link:<br><a href="{{ .ConfirmationURL }}" style="color:#be185d;word-break:break-all;">{{ .ConfirmationURL }}</a></p></td></tr>
          <tr><td style="padding:24px 32px 28px;border-top:1px solid #f1f1ef;">
            <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#a0a1a7;">Didn't request this? Your password hasn't changed — just ignore this email. This mailbox isn't monitored — please don't reply.</p>
            <p style="margin:10px 0 0;font-size:12px;color:#a0a1a7;">UGCOrigin — a product by Dream Intrepid Ltd.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```

---

### 2.4 Change Email Address
**Subject:** `Confirm your new email for UGCOrigin`

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f7f5;font-family:Helvetica,Arial,sans-serif;color:#15161a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Confirm the switch to your new email.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ececea;border-radius:20px;">
          <tr><td style="padding:28px 32px 8px;"><span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;"><span style="color:#db2777;">UGC</span><span style="color:#15161a;">Origin</span></span></td></tr>
          <tr><td style="padding:12px 32px 0;">
            <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;">Confirm your new email</h1>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#44464d;">You asked to change your UGCOrigin email to <strong>{{ .NewEmail }}</strong>. Tap below to make the switch.</p>
          </td></tr>
          <tr><td style="padding:26px 32px 6px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:999px;">Confirm new email</a></td></tr>
          <tr><td style="padding:16px 32px 0;"><p style="margin:0;font-size:13px;line-height:1.6;color:#85868d;">Or paste this link:<br><a href="{{ .ConfirmationURL }}" style="color:#be185d;word-break:break-all;">{{ .ConfirmationURL }}</a></p></td></tr>
          <tr><td style="padding:24px 32px 28px;border-top:1px solid #f1f1ef;">
            <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#a0a1a7;">Didn't request this change? Ignore this email and your address stays as it is. This mailbox isn't monitored — please don't reply.</p>
            <p style="margin:10px 0 0;font-size:12px;color:#a0a1a7;">UGCOrigin — a product by Dream Intrepid Ltd.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```

---

### 2.5 Invite user
**Subject:** `You're invited to UGCOrigin`

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f7f5;font-family:Helvetica,Arial,sans-serif;color:#15161a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">An invite to Nigeria's original-content network.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ececea;border-radius:20px;">
          <tr><td style="padding:28px 32px 8px;"><span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;"><span style="color:#db2777;">UGC</span><span style="color:#15161a;">Origin</span></span></td></tr>
          <tr><td style="padding:12px 32px 0;">
            <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;">You're invited</h1>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#44464d;">Someone thinks you belong on UGCOrigin — the network for real, human, original content. Accept your invite and set up your account.</p>
          </td></tr>
          <tr><td style="padding:26px 32px 6px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:999px;">Accept invite</a></td></tr>
          <tr><td style="padding:16px 32px 0;"><p style="margin:0;font-size:13px;line-height:1.6;color:#85868d;">Or paste this link:<br><a href="{{ .ConfirmationURL }}" style="color:#be185d;word-break:break-all;">{{ .ConfirmationURL }}</a></p></td></tr>
          <tr><td style="padding:24px 32px 28px;border-top:1px solid #f1f1ef;">
            <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#a0a1a7;">Not expecting this? You can safely ignore it. This mailbox isn't monitored — please don't reply.</p>
            <p style="margin:10px 0 0;font-size:12px;color:#a0a1a7;">UGCOrigin — a product by Dream Intrepid Ltd.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```

---

### 2.6 Reauthentication (OTP code)
**Subject:** `Your UGCOrigin verification code`

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f7f5;font-family:Helvetica,Arial,sans-serif;color:#15161a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your one-time UGCOrigin code.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ececea;border-radius:20px;">
          <tr><td style="padding:28px 32px 8px;"><span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;"><span style="color:#db2777;">UGC</span><span style="color:#15161a;">Origin</span></span></td></tr>
          <tr><td style="padding:12px 32px 0;">
            <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;">Your verification code</h1>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#44464d;">Enter this code to confirm it's really you:</p>
          </td></tr>
          <tr><td style="padding:22px 32px 6px;">
            <div style="display:inline-block;background:#fce7f3;color:#be185d;font-size:30px;font-weight:800;letter-spacing:8px;padding:14px 22px;border-radius:14px;">{{ .Token }}</div>
          </td></tr>
          <tr><td style="padding:16px 32px 0;"><p style="margin:0;font-size:13px;line-height:1.6;color:#85868d;">This code expires shortly. Never share it with anyone — UGCOrigin staff will never ask for it.</p></td></tr>
          <tr><td style="padding:24px 32px 28px;border-top:1px solid #f1f1ef;">
            <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#a0a1a7;">Didn't request this? Ignore this email. This mailbox isn't monitored — please don't reply.</p>
            <p style="margin:10px 0 0;font-size:12px;color:#a0a1a7;">UGCOrigin — a product by Dream Intrepid Ltd.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```

---

## 3. After pasting
- Send yourself a test of each (sign up a throwaway, trigger a reset, etc.).
- Check they render on mobile Gmail + Apple Mail and don't hit spam (domain
  verification in step 1a is what keeps them out of spam).
- If you later want a logo image instead of the text wordmark, host a PNG
  (e.g. `https://ugcorigin.com/brand/email-logo.png`) and swap the `<span>…</span>`
  wordmark for an `<img>`.
