import type { Metadata } from "next";
import { NetworkContent } from "@/components/network-content";

export const metadata: Metadata = { title: "The Network" };

export default function Network() {
  return <NetworkContent />;
}
