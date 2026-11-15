import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { ShinyButton } from "@/components/ui/shiny-button";
import styles from "./application-presentation.module.css";

type ApplicationShellProps = {
  title: string;
  backHref: string;
  navigationControls?: ReactNode;
  children?: ReactNode;
};

export function ApplicationShell({
  title,
  backHref,
  navigationControls,
  children,
}: ApplicationShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.shellHeader}>
        <div className={styles.headerSpacer} aria-hidden="true" />
        <h1 className={styles.shellTitle}>{title}</h1>
        <nav
          className={styles.headerActions}
          aria-label="Application navigation"
        >
          <ShinyButton
            className={`${styles.glassControl} astra-card-glass`}
            href={backHref}
            aria-label="Back"
            title="Back"
          >
            <ArrowLeft aria-hidden="true" size={19} />
          </ShinyButton>
          {navigationControls}
        </nav>
      </header>
      <div className={styles.shellContent}>{children}</div>
    </div>
  );
}
