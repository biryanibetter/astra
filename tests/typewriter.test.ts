import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Typewriter } from "@/components/ui/typewriter";

describe("Typewriter", () => {
  it("starts empty while reserving the longest suffix", () => {
    const phrases = [
      "what's next.",
      "something more.",
      "bold ideas.",
      "the future.",
      "real impact.",
    ];
    const html = renderToStaticMarkup(createElement(Typewriter, { phrases }));

    expect(html).toContain(">something more.</span>");
    expect(html).toContain(
      'class="typewriter-text"><span class="typewriter-cursor" aria-hidden="true"></span></span>',
    );
  });
});
