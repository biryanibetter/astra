import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EventsTimeline } from "@/components/home/events";

describe("experiences lane", () => {
  it("associates the approved copy with each card without placeholder navigation", () => {
    const html = renderToStaticMarkup(createElement(EventsTimeline));
    const text = html
      .replace(/<[^>]*>/g, " ")
      .replaceAll("&#x27;", "'")
      .replaceAll("&amp;", "&")
      .replace(/\s+/g, " ");
    expect(text).toContain("Creating opportunities. Connecting possibilities.");
    expect(text).toContain(
      "From cross-school gatherings to collaborative projects and conversations, Astra aims to create opportunities for students to connect, contribute and pursue their interests together.",
    );
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a ");
    expect(text).not.toContain("View all programs");
    expect(text).not.toContain("Astra Launch Night");

    const document = new DOMParser().parseFromString(html, "text/html");
    const cards = [...document.querySelectorAll("article")];
    expect(cards).toHaveLength(4);
    const content = [
      {
        category: "Flagship Experiences",
        title: "Events & Gatherings",
        intro:
          "Bringing students across schools together through shared experiences.",
        detail:
          "From youth festivals to cross-school gatherings, Astra aims to organize experiences where students can discover new interests, exchange perspectives and form meaningful connections beyond their schools.",
      },
      {
        category: "Hands-on Experiences",
        title: "Workshops & Hackathons",
        intro:
          "Collaborative challenges that bring different skills and ideas together.",
        detail:
          "Through interactive workshops, hackathons and team-based challenges, Astra aims to encourage students to experiment, solve problems and develop ideas alongside peers from different disciplines.",
      },
      {
        category: "Speaker Sessions",
        title: "Real Conversations",
        intro:
          "Conversations with founders, researchers, industry leaders and creators.",
        detail:
          "An opportunity to engage with people from different professional backgrounds, ask meaningful questions and gain perspectives that extend beyond conventional classroom learning.",
      },
      {
        category: "Exhibitions & Competitions",
        title: "Innovation Showcases",
        intro:
          "A platform for student research, inventions, projects and emerging ideas.",
        detail:
          "Astra aims to develop exhibitions and competitions where students can present their work, demonstrate their ideas, exchange constructive feedback and engage with a wider community of innovators.",
      },
    ];
    const expected = cards.map((card) => ({
      category:
        card.querySelector("[data-experience-label]")?.textContent ?? "",
      title: card.querySelector("strong")?.textContent ?? "",
      intro: card.querySelector("[data-experience-intro]")?.textContent ?? "",
      detail:
        card.querySelector('[data-experience-detail][aria-hidden="true"]')
          ?.textContent ?? "",
    }));
    expect(expected).toEqual(content);
    expect(html).toContain('id="events"');
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
