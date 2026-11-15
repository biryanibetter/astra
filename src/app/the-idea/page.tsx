import type { Metadata } from "next";
import ProgramsStage from "@/components/programs/programs-stage";
import PhotographicGallery from "@/components/the-idea/photographic-gallery";
import { programStockData } from "@/data/program-stock-data";
import { astraPrograms } from "@/data/programs";
import styles from "./the-idea.module.css";

export const metadata: Metadata = {
  title: "The Idea",
  description:
    "Explore what you could build with other curious students at ASTRA.",
};

const explorationAreas = astraPrograms.map((program) => {
  const photo = programStockData.find((item) => item.number === program.number);
  return {
    ...program,
    title:
      program.number === "02"
        ? "Design & Creation"
        : program.number === "03"
          ? "Business & Startups"
          : program.title,
    description:
      program.number === "02"
        ? "Explore visual design, creative making, digital tools and how an early sketch could become something people use."
        : program.number === "03"
          ? "Explore entrepreneurship, strategy and the first steps of shaping an idea into a useful venture with others."
          : program.description,
    image: photo
      ? { hero: photo.imagePath, alt: photo.altText }
      : program.image,
  };
});

export default function TheIdeaPage() {
  return (
    <div className={styles.frame} data-testid="idea-outer-frame">
      <ProgramsStage programs={explorationAreas} showSpotlightCard={false} />
      <PhotographicGallery />
    </div>
  );
}
