"use client";

import {
  type DisciplinePreview,
  HoverPreview,
} from "@/components/ui/hover-preview";

const disciplines: readonly DisciplinePreview[] = [
  {
    id: "technology",
    name: "technology",
    copy: "Builders, coders, robotics.",
    color: "#C6CCD5",
    image: "/images/technology-preview.svg",
  },
  {
    id: "business",
    name: "business",
    copy: "Founders, pitches, real ventures.",
    color: "#8E9BAE",
    image: "/images/business-preview.svg",
  },
  {
    id: "science",
    name: "science",
    copy: "Labs, research, curiosity.",
    color: "#A3A9B4",
    image: "/images/science-preview.svg",
  },
  {
    id: "design",
    name: "design",
    copy: "Brands, products, visual craft.",
    color: "#C6CCD5",
    image: "/images/design-preview.svg",
  },
  {
    id: "media",
    name: "media",
    copy: "Film, content, storytelling.",
    color: "#8E9BAE",
    image: "/images/media-preview.svg",
  },
] as const;

export function Introduction() {
  return (
    <section
      className="wrap introduction home-section"
      aria-labelledby="intro-heading"
      data-reveal="section"
    >
      <p className="eyebrow">INTRODUCING ASTRA</p>
      <h2 id="intro-heading" className="display">
        A cross-school network for people who want to do things, in{" "}
        <HoverPreview disciplines={disciplines} />
      </h2>
    </section>
  );
}
