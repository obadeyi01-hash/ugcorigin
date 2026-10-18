import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/simple-page";

export const metadata: Metadata = {
  title: "Trust & Safety",
  description: "How UGCOrigin keeps brands and creators safe, escrow, verification, and fair disputes.",
};

export default function TrustPage() {
  return (
    <SimplePage title="Trust & Safety" intro="Every deal on UGCOrigin is built to protect both sides.">
      <h2>Escrow by default</h2>
      <p>When a brand hires a creator, the payment is held in escrow. Creators know they&apos;ll be paid on approval; brands know they won&apos;t get ghosted. Funds are released when the work is approved.</p>
      <h2>Verified humans</h2>
      <p>Every creator passes identity verification before they can be hired, real people making real content, with proof of origin in a world full of AI.</p>
      <h2>Fair disputes</h2>
      <p>If something goes wrong, disputes are decided against the written brief using the record in the on-platform workspace, not by who argues hardest.</p>
      <h2>Keep it on-platform</h2>
      <p>Communicating and paying through UGCOrigin keeps your escrow protection and your records intact. Off-platform deals void that protection.</p>
      <h2>Report a problem</h2>
      <p>Spotted something? Email <a href="mailto:support@ugcorigin.com">support@ugcorigin.com</a> or open a dispute from your gig.</p>
    </SimplePage>
  );
}
