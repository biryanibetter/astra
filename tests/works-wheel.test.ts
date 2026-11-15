import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ASTRA_WORKS_WHEEL_MOCK_ITEMS,
  WorksWheel,
} from "@/components/ui/works-wheel";

describe("WorksWheel", () => {
  it("renders an accessible wheel with lazy conceptual artwork", () => {
    const markup = renderToStaticMarkup(
      createElement(WorksWheel, {
        items: ASTRA_WORKS_WHEEL_MOCK_ITEMS,
        label: "Astra concept lab",
      }),
    );

    expect(markup).toContain('role="listbox"');
    expect(markup).toContain('aria-label="Astra concept lab"');
    expect(markup.match(/role="option"/g)).toHaveLength(
      ASTRA_WORKS_WHEEL_MOCK_ITEMS.length,
    );
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain('decoding="async"');
  });

  it("keeps mock content explicit and self-contained", () => {
    expect(ASTRA_WORKS_WHEEL_MOCK_ITEMS.length).toBeGreaterThanOrEqual(6);
    for (const item of ASTRA_WORKS_WHEEL_MOCK_ITEMS) {
      expect(item.title).toMatch(/concept/i);
      expect(item.image).toMatch(/^data:image\/svg\+xml/);
    }
  });
});
