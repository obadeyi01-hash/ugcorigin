// Redact contact details from pre-contract chat. Until a brand and creator have
// a funded contract, sharing phone numbers, emails, links or off-platform
// handles is blocked (keeps deals, payment and protection on-platform).

const HIDDEN = "[hidden until you start a contract]";

const RULES: RegExp[] = [
  // emails
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  // urls + bare domains
  /\b(?:https?:\/\/|www\.)\S+/gi,
  /\b[a-z0-9-]+\.(?:com|net|org|ng|io|co|me|ly|gg|tv|app|xyz|site|link)\b\S*/gi,
  // phone numbers: 9+ digits allowing +, spaces, dashes, dots, parens
  /\+?\d(?:[\s().-]?\d){8,}/g,
  // off-platform handles
  /@[a-z0-9._]{2,}/gi,
  // common off-platform app names (often paired with a number/handle)
  /\b(whats\s?app|telegram|signal|wechat|imo|viber|snapchat|snap)\b/gi,
];

/** Returns the body with contact details masked, and whether anything was masked. */
export function redactContact(body: string): { text: string; redacted: boolean } {
  let text = body;
  for (const re of RULES) text = text.replace(re, HIDDEN);
  return { text, redacted: text !== body };
}
