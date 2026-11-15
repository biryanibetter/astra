import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AstraFooter from "@/components/astra-footer";

describe("AstraFooter", () => {
  it("renders the approved four-column footer with the original artwork and copyright", () => {
    const html = renderToStaticMarkup(createElement(AstraFooter));

    expect(html.match(/<footer\b/g)).toHaveLength(1);
    expect(html).toContain("hwf-canonical");
    expect(html).toContain("hwf-fallback");
    expect(html).toContain("<canvas");
    for (const href of ["/", "/the-idea", "/#schools-heading", "/whats-next"]) {
      expect(html).toContain(`href="${href}"`);
    }
    for (const heading of ["Explore", "Social", "Media"]) {
      expect(html).toContain(`aria-label="${heading}"`);
    }
    for (const label of ["Instagram", "Facebook", "YouTube", "X (Twitter)"]) {
      expect(html).toContain(`>${label}</span>`);
      expect(html).not.toMatch(new RegExp(`<a[^>]*>${label}</a>`));
    }
    for (const label of ["Join ASTRA", "About", "Contact", "Privacy"]) {
      expect(html).not.toContain(`>${label}</a>`);
    }
    expect(html).not.toContain("Back to top");
    expect(html.match(/class="hwf-brand"/g)).toHaveLength(1);
    expect(html).not.toContain("<strong>ASTRA</strong>");
    expect(html).toContain("Built by students. Built for what&#x27;s next.");
    expect(html).toContain("Doha, Qatar");
    expect(html.indexOf('class="hwf-top"')).toBeLessThan(
      html.indexOf('class="hwf-artwork-space"'),
    );
    expect(html.indexOf('class="hwf-artwork-space"')).toBeLessThan(
      html.indexOf("ASTRA Youth Innovation Network"),
    );
    expect(html).toContain("© 2026 ASTRA Youth Innovation Network");
    expect(html).not.toContain("Build What&#x27;s Next.");
  });
});
