import { redirect } from "next/navigation";

// Legacy path kept working: the page is now titled "Payment protection terms".
export default function EscrowTermsPage() {
  redirect("/payment-protection-terms");
}
