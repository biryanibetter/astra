import { notFound } from "next/navigation";

// Retired receipt URL: frontend-only applications cannot be received or submitted.
export default function RetiredApplicationReceipt() {
  notFound();
}
