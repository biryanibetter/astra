import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EventsTimeline } from "@/components/home/events";

describe("experiences lane", () => {
  it("preserves the content without buttons or placeholder navigation", () => {
    const html = renderToStaticMarkup(createElement(EventsTimeline));
    const text = html
      .replace(/<[^>]*>/g, " ")
      .replaceAll("&#x27;", "'")
      .replaceAll("&amp;", "&")
      .replace(/\s+/g, " ");
    expect(text).toContain(
      "Our experiences that bring Qatar's innovators together.",
    );
    expect(text).toContain(
      "From large-scale events to intimate workshops, Astra creates experiences where ambitious students meet, learn and build.",
    );
    for (const title of [
      "Astra Launch Night",
      "Build & Learn",
      "Real Conversations",
      "Ideas in Action",
    ]) {
      expect(text).toContain(title);
    }
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a ");
    expect(text).not.toContain("View all programs");
    expect(text).toContain(
      "Hands-on experiences in technology, AI, business, design and more.",
    );
    expect(text).toContain(
      "A first gathering bringing ambitious young people across Qatar together.",
    );
    expect(text).toContain(
      "Conversations with founders, industry leaders and creators.",
    );
    expect(text).toContain(
      "Student projects, teams and ideas from across Qatar.",
    );
    expect(
      text.match(
        /A first gathering bringing ambitious young people across Qatar together\./g,
      ),
    ).toHaveLength(1);
    const welcomeMatch = text.match(
      /A welcoming first gathering for ambitious young people/g,
    );
    // Supporting copy stays mounted to prevent layout projection/remount jumps,
    // but is hidden from assistive technology until its card is expanded.
    expect(welcomeMatch ? welcomeMatch.length : 0).toBe(1);
    const document = new DOMParser().parseFromString(html, "text/html");
    const details = document.querySelectorAll("[data-experience-detail]");
    expect(details).toHaveLength(4);
    for (const detail of details) {
      expect(detail.getAttribute("aria-hidden")).toBe("true");
    }
    expect(html).toContain('id="events"');
    expect((html.match(/<article\b/g) ?? []).length).toBe(4);
    expect(html).not.toContain('aria-haspopup="dialog"');
    expect(html).not.toContain('aria-label="Previous experience"');
    expect(html).not.toContain('aria-label="Next experience"');
    expect(text).not.toContain("WHAT'S COMING UP");
    expect(text).not.toContain("Stock imagery is conceptual");
  });

  it("does not render a modal dialog or top-level arrow controls", () => {
    const html = renderToStaticMarkup(createElement(EventsTimeline));
    expect(html).not.toContain("<dialog");
    expect(html).not.toContain('aria-label="Previous experience"');
    expect(html).not.toContain('aria-label="Next experience"');
  });
});
