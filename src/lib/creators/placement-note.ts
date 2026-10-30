const P = "margin:0 0 12px;color:#3f3f46;font-size:15px;line-height:1.6";

function naira(amount: number) {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}
const LI = "margin:0 0 8px;color:#3f3f46;font-size:15px;line-height:1.5";

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

export type RateBand = { low: number; typical: number; high: number };

/** Bring a starting rate into the band for the level a reviewer placed them at. */
export function alignedRate(rate: number, band: RateBand, floor: number): { rate: number; adjusted: boolean } {
  const current = Math.round(rate);
  const minimum = Math.max(0, Math.round(floor));
  let next = current;
  if (current > band.high) next = band.typical;
  else if (current < band.low) next = band.low;
  next = Math.max(minimum, Math.round(next));
  return { rate: next, adjusted: next !== current };
}

export function placementNote(input: {
  firstName: string;
  tierLabel: string;
  previousRate: number;
  nextRate: number;
  band: RateBand;
  niches: string[];
  location: string;
}) {
  const name = input.firstName.trim().split(/\s+/)[0] || "there";
  const who = input.niches.length > 0 ? input.niches.join(", ") : "your niches";
  const where = input.location.trim() || "Nigeria";
  const range = `${naira(input.band.low)}–${naira(input.band.high)}`;
  const usual = naira(input.band.typical);
  const next = naira(input.nextRate);
  const adjusted = input.previousRate !== input.nextRate;
  const rateLine = adjusted
    ? `None of this is a comment on your worth. ${naira(input.previousRate)} is significantly above the usual starting range for ${who} in ${where} (${range}, around ${usual}). We set ${next} as a starting point per gig for where you are right now, at ${input.tierLabel}. You can always negotiate, and a brand can pay a bit more than this. As you finish work here, the rate can move up. Rising and Pro are earned from that work.`
    : `Your starting rate of ${next} is a starting point per gig at ${input.tierLabel}, not a comment on your worth. It sits in the usual range for ${who} in ${where} (${range}). You can always negotiate, and a brand can pay a bit more.`;

  const subject = `You're live on UGCOrigin: your ${input.tierLabel} starting point`;
  const heading = `You're live, at ${input.tierLabel}`;
  const body = `You're verified and live at ${input.tierLabel}. ${rateLine} Brands look next at a clear bio, a few showcase videos, and packages they can book.`;
  const bodyHtml = `
    <p style="${P}">Hi ${esc(name)}, you're verified, and your profile is live in the directory. We placed you at <strong>${esc(input.tierLabel)}</strong>. That's the level new profiles start from, and brands use it to decide who to book first.</p>
    <p style="${P}">${esc(rateLine)}</p>
    <p style="${P}">The next thing brands look at is the work itself. A few small things make a card much easier to hire:</p>
    <ul style="margin:0 0 4px;padding-left:20px">
      <li style="${LI}">A short bio that says what you make, and who it's for.</li>
      <li style="${LI}">Two or three clear showcase videos, with the product or the look in the first seconds.</li>
      <li style="${LI}">Packages with a format and a price, so a brand can say yes without guessing.</li>
    </ul>
    <p style="${P}">Your photo is already on the card. When you're ready, add the clips you're proudest of. We'll be glad to see them.</p>`;
  return { subject, heading, body, bodyHtml, preheader: `Placed at ${input.tierLabel}. Brands book from a clear card.` };
}
