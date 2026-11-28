"use client";

import { AstraLogo } from "@/components/site";
import HalftoneWordmarkFooter, {
  type FooterColumn,
} from "@/components/ui/halftone-wordmark-footer";
import styles from "./astra-footer.module.css";

const columns: FooterColumn[] = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "The Idea", href: "/the-idea" },
      { label: "Get Involved", href: "/#schools-heading" },
      { label: "What's Next", href: "/#events" },
    ],
  },
  {
    title: "Social",
    links: [{ label: "Instagram" }, { label: "Facebook" }],
  },
  {
    title: "Media",
    links: [{ label: "YouTube" }, { label: "X (Twitter)" }],
  },
];

export default function AstraFooter() {
  return (
    <HalftoneWordmarkFooter
      wordmark="ASTRA."
      columns={columns}
      showTop
      showBrand
      label="ASTRA"
      meta="Youth Innovation Network"
      brandContent={
        <div className={styles.brand}>
          <AstraLogo className={styles.brandName ?? ""} width={200} />
          <span className={styles.description}>
            Built by students. Built for what's next.
          </span>
          <span className={styles.location}>Doha, Qatar</span>
        </div>
      }
      utilityBelowArtwork
      utility={
        <p className={styles.copyright}>
          © 2026 ASTRA Youth Innovation Network
        </p>
      }
      palette={{ background: "#030405", ink: "#f5f6f8", warm: "#c6ccd5" }}
      fontFamily="Inter, sans-serif"
      monoFamily="'JetBrains Mono', monospace"
      radius={120}
      grain={0.32}
      height="auto"
      className={styles.footer ?? ""}
    />
  );
}
