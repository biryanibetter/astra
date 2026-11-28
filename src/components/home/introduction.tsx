"use client";

import editorial from "@/components/ui/editorial-copy.module.css";
import {
  type DisciplinePreview,
  HoverPreview,
} from "@/components/ui/hover-preview";
import { ShimmerText } from "@/components/ui/shimmer-text";

const disciplines: readonly DisciplinePreview[] = [
  {
    id: "technology",
    name: "technology",
    copy: "Build projects, experiment with new technologies and exchange technical knowledge.",
    color: "#C6CCD5",
    image: "/images/home-stock/technology.webp",
  },
  {
    id: "business",
    name: "business",
    copy: "Discuss business ideas, develop entrepreneurial projects and explore new opportunities.",
    color: "#8E9BAE",
    image: "/images/home-stock/business.webp",
  },
  {
    id: "science",
    name: "science",
    copy: "Explore research ideas, exchange scientific knowledge and collaborate on investigations.",
    color: "#A3A9B4",
    image: "/images/home-stock/science.webp",
  },
  {
    id: "design",
    name: "design",
    copy: "Exchange creative ideas, develop concepts and collaborate on design projects.",
    color: "#C6CCD5",
    image: "/images/home-stock/design.webp",
  },
  {
    id: "media",
    name: "media",
    copy: "Create content, tell stories and bring student initiatives to a wider audience.",
    color: "#8E9BAE",
    image: "/images/home-stock/media.webp",
  },
] as const;

export function Introduction() {
  return (
    <section
      className={`wrap introduction ${editorial.section}`}
      aria-labelledby="intro-heading"
      data-reveal="section"
    >
      <h2 id="intro-heading" className={`display ${editorial.text}`}>
        <ShimmerText homepage restrained>
          <span data-shimmer-text="">
            A cross-school network bringing together young innovators across
          </span>
        </ShimmerText>{" "}
        <HoverPreview disciplines={disciplines} />
      </h2>
    </section>
  );
}
