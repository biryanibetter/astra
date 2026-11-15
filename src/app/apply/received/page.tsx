import { notFound } from "next/navigation";

// Retired receipt URL: only the submission flow may show a confirmed receipt.
export default function RetiredApplicationReceipt() {
  notFound();
}
