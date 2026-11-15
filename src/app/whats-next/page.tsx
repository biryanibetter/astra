import type { Metadata } from "next";
import { WhatsNext } from "@/components/whats-next/whats-next";

export const metadata: Metadata = {
  title: "What’s Next",
  description: "A look at the experiences ASTRA hopes to build together.",
};

export default function WhatsNextPage() {
  return <WhatsNext />;
}
