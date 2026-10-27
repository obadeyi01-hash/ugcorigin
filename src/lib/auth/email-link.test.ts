import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  callbackRedirect,
  decideEmailLink,
  describeOtpError,
  linkSentRecently,
  normalizeEmail,
  shouldFallbackToAppMailer,
  socialNotice,
  type AccountHint,
} from "./email-link.ts";

const NOW = Date.parse("2026-10-26T12:00:00.000Z");

function hint(overrides: Partial<AccountHint> = {}): AccountHint {
  return {
    exists: true,
    banned: false,
    providers: ["email"],
    recoverySentAt: null,
    ...overrides,
  };
}

describe("normalizeEmail", () => {
  it("trims and lowercases a normal address", () => {
    assert.equal(normalizeEmail("  Ada@UGCOrigin.com "), "ada@ugcorigin.com");
  });
  it("keeps a plus tag", () => {
    assert.equal(normalizeEmail("ada+brand@gmail.com"), "ada+brand@gmail.com");
  });
  it("rejects blanks, spaces, and a missing domain", () => {
    assert.equal(normalizeEmail("   "), null);
    assert.equal(normalizeEmail("ada lovelace@x.com"), null);
    assert.equal(normalizeEmail("ada@localhost"), null);
    assert.equal(normalizeEmail("ada@@x.com"), null);
  });
});

describe("callbackRedirect", () => {
  it("keeps the live callback and a role", () => {
    assert.equal(
      callbackRedirect("https://www.ugcorigin.com/auth/callback?role=brand"),
      "https://www.ugcorigin.com/auth/callback?role=brand",
    );
    assert.equal(
      callbackRedirect("https://ugcorigin.com/auth/callback?role=creator"),
      "https://ugcorigin.com/auth/callback?role=creator",
    );
  });
  it("keeps local dev on port 3000", () => {
    assert.equal(
      callbackRedirect("http://localhost:3000/auth/callback"),
      "http://localhost:3000/auth/callback",
    );
    assert.equal(
      callbackRedirect("http://127.0.0.1:3000/auth/callback?role=creator"),
      "http://127.0.0.1:3000/auth/callback?role=creator",
    );
  });
  it("drops extra query params and a hash", () => {
    assert.equal(
      callbackRedirect("https://www.ugcorigin.com/auth/callback?next=https://evil.com&role=nope#token"),
      "https://www.ugcorigin.com/auth/callback",
    );
  });
  it("rejects other hosts, ports, and paths", () => {
    assert.equal(callbackRedirect("https://evil.com/auth/callback"), null);
    assert.equal(callbackRedirect("https://www.ugcorigin.com.evil.com/auth/callback"), null);
    assert.equal(callbackRedirect("https://www.ugcorigin.com/auth/callback/extra"), null);
    assert.equal(callbackRedirect("https://www.ugcorigin.com/login"), null);
    assert.equal(callbackRedirect("http://www.ugcorigin.com/auth/callback"), null);
    assert.equal(callbackRedirect("http://localhost:3001/auth/callback"), null);
    assert.equal(callbackRedirect("javascript:alert(1)"), null);
  });
});

describe("decideEmailLink", () => {
  it("sends our own link for a Google-only account", () => {
    const decision = decideEmailLink({
      mode: "login",
      emailOk: true,
      redirectOk: true,
      hint: hint({ providers: ["google"] }),
      now: NOW,
    });
    assert.deepEqual(decision, { status: "send" });
  });
  it("does the same when someone tries to sign up with a Google email", () => {
    const decision = decideEmailLink({
      mode: "signup",
      emailOk: true,
      redirectOk: true,
      hint: hint({ providers: ["google"] }),
      now: NOW,
    });
    assert.equal(decision.status, "send");
  });
  it("names Meta and X the same way, and uses the email path when both exist", () => {
    assert.equal(
      decideEmailLink({
        mode: "login",
        emailOk: true,
        redirectOk: true,
        hint: hint({ providers: ["facebook"] }),
        now: NOW,
      }).status,
      "send",
    );
    const both = decideEmailLink({
      mode: "login",
      emailOk: true,
      redirectOk: true,
      hint: hint({ providers: ["google", "email"] }),
      now: NOW,
    });
    assert.deepEqual(both, { status: "otp", shouldCreateUser: false, notice: null });
  });
  it("does not create an account from the login form", () => {
    const decision = decideEmailLink({
      mode: "login",
      emailOk: true,
      redirectOk: true,
      hint: hint({ exists: false, providers: [] }),
      now: NOW,
    });
    assert.deepEqual(decision, {
      status: "error",
      message: "No account uses this email yet. Create an account, or continue with Google if that's how you joined.",
    });
  });
  it("lets a new signup start the normal email link", () => {
    const decision = decideEmailLink({
      mode: "signup",
      emailOk: true,
      redirectOk: true,
      hint: hint({ exists: false, providers: [] }),
      now: NOW,
    });
    assert.deepEqual(decision, { status: "otp", shouldCreateUser: true, notice: null });
  });
  it("tells an existing email account, on the signup form, that they already joined", () => {
    const decision = decideEmailLink({
      mode: "signup",
      emailOk: true,
      redirectOk: true,
      hint: hint({ providers: ["email"] }),
      now: NOW,
    });
    assert.equal(decision.status, "otp");
    if (decision.status === "otp") {
      assert.equal(decision.shouldCreateUser, false);
      assert.match(decision.notice ?? "", /already have an account/i);
    }
  });
  it("stops a suspended account before any email", () => {
    const decision = decideEmailLink({
      mode: "login",
      emailOk: true,
      redirectOk: true,
      hint: hint({ banned: true, providers: ["google"] }),
      now: NOW,
    });
    assert.equal(decision.status, "error");
    if (decision.status === "error") assert.match(decision.message, /suspended/i);
  });
  it("waits out a link that was just sent", () => {
    const decision = decideEmailLink({
      mode: "login",
      emailOk: true,
      redirectOk: true,
      hint: hint({ recoverySentAt: new Date(NOW - 30_000).toISOString() }),
      now: NOW,
    });
    assert.equal(decision.status, "error");
    if (decision.status === "error") assert.match(decision.message, /wait a minute/i);
  });
  it("allows another link once the minute has passed", () => {
    assert.equal(linkSentRecently(new Date(NOW - 61_000).toISOString(), NOW), false);
    assert.equal(linkSentRecently(new Date(NOW + 60_000).toISOString(), NOW), false);
    assert.equal(linkSentRecently("not-a-date", NOW), false);
  });
  it("refuses an incomplete identity and a phone-only account", () => {
    const empty = decideEmailLink({
      mode: "login",
      emailOk: true,
      redirectOk: true,
      hint: hint({ providers: [] }),
      now: NOW,
    });
    const phone = decideEmailLink({
      mode: "login",
      emailOk: true,
      redirectOk: true,
      hint: hint({ providers: ["phone"] }),
      now: NOW,
    });
    assert.equal(empty.status, "error");
    assert.equal(phone.status, "error");
  });
  it("falls through to the browser link when the lookup failed", () => {
    const decision = decideEmailLink({
      mode: "login",
      emailOk: true,
      redirectOk: true,
      hint: null,
      now: NOW,
    });
    assert.deepEqual(decision, { status: "otp", shouldCreateUser: false, notice: null });
  });
  it("rejects a bad address and a bad redirect before the lookup matters", () => {
    assert.equal(
      decideEmailLink({ mode: "login", emailOk: false, redirectOk: true, hint: null, now: NOW }).status,
      "error",
    );
    assert.equal(
      decideEmailLink({ mode: "login", emailOk: true, redirectOk: false, hint: hint(), now: NOW }).status,
      "error",
    );
  });
});

describe("otp errors", () => {
  it("treats the magic-link mailer failure as something we can send ourselves", () => {
    assert.equal(shouldFallbackToAppMailer("Error sending magic link email"), true);
    assert.equal(shouldFallbackToAppMailer("Error sending confirmation email"), true);
    assert.equal(shouldFallbackToAppMailer("A user with this email address has already been registered"), true);
    assert.equal(shouldFallbackToAppMailer("email rate limit exceeded"), false);
  });
  it("never echoes the raw provider string", () => {
    const message = describeOtpError("Error sending magic link email", "unexpected_failure", "login");
    assert.equal(message.includes("Error sending"), false);
    assert.match(message, /didn't finish|try again/i);
  });
  it("maps the cases the form actually hits", () => {
    assert.match(describeOtpError("Signups not allowed for otp", "otp_disabled", "login"), /no account/i);
    assert.match(describeOtpError("For security purposes, you can only request this after 60 seconds", "over_email_send_rate_limit", "login"), /wait a minute/i);
    assert.match(describeOtpError("Email address not authorized", null, "signup"), /valid email|try again|didn't finish/i);
    assert.match(describeOtpError("User is banned", "user_banned", "login"), /suspended/i);
    assert.match(describeOtpError("redirect uri is not allowed", null, "login"), /allow list/i);
  });
});

describe("socialNotice", () => {
  it("names the provider and still offers the button when the email could not go out", () => {
    assert.match(socialNotice(["Google"], "login", true), /connected to Google/);
    assert.match(socialNotice(["Google"], "signup", true), /already joined with Google/);
    assert.match(socialNotice(["Google"], "login", false), /Continue with Google/);
    assert.match(socialNotice(["Google", "Meta"], "login", true), /Google or Meta/);
  });
});
