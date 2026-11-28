import type { Metadata } from "next";
import ProgramsStage, {
  type ProgramsStageItem,
} from "@/components/programs/programs-stage";
import { MembershipExplorer } from "@/components/the-idea/membership-explorer";
import { MembershipIntro } from "@/components/the-idea/membership-intro";
import PhotographicGallery from "@/components/the-idea/photographic-gallery";
import { astraPrograms } from "@/data/programs";
import styles from "./the-idea.module.css";

export const metadata: Metadata = {
  title: "The Idea",
  description:
    "Explore what you could build with other curious students at ASTRA.",
};

const chapterCopy: Readonly<Record<string, Partial<ProgramsStageItem>>> = {
  "01": {
    description:
      "Develop software, experiment with artificial intelligence, build prototypes and apply technology to problems that matter to you.",
    image: {
      hero: "/images/idea-stock/technology.webp",
      alt: "Three students assembling a small robot together",
    },
  },
  "02": {
    title: "Design & Creation",
    description:
      "Turn concepts into products, visual experiences and creative work through experimentation, design and collaboration.",
    image: {
      hero: "/images/idea-stock/design.webp",
      alt: "Two students fitting a cardboard costume prototype",
    },
  },
  "03": {
    title: "Business & Startups",
    description:
      "Identify opportunities, develop business models, test entrepreneurial ideas and work towards building viable ventures.",
  },
  "04": {
    description:
      "Investigate scientific questions, pursue research, communicate ideas through media and develop projects that connect different disciplines.",
  },
};

const explorationAreas = astraPrograms.map(
  ({ id, number, title, eyebrow, description, image }) => ({
    id,
    number,
    title,
    eyebrow,
    description,
    image: { hero: image.hero, alt: image.alt },
    ...chapterCopy[number],
  }),
);

function ConnectedPathways() {
  return (
    <div className={styles.pathwayTransition}>
      <svg aria-hidden="true" viewBox="0 0 346 120" fill="none">
        <defs>
          <linearGradient
            id="idea-pathway-stroke"
            x1="0"
            y1="1"
            x2="0"
            y2="101"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity=".1" />
            <stop offset=".62" stopColor="white" stopOpacity=".27" />
            <stop offset="1" stopColor="white" stopOpacity=".7" />
          </linearGradient>
          <radialGradient id="idea-pathway-halo">
            <stop stopColor="white" stopOpacity=".32" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M1 1 H65 C105 1 119 23 151 58 C165 73 173 87 173 101"
          stroke="url(#idea-pathway-stroke)"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M345 1 H281 C241 1 227 23 195 58 C181 73 173 87 173 101"
          stroke="url(#idea-pathway-stroke)"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="173" cy="101" r="18" fill="url(#idea-pathway-halo)" />
        <circle cx="173" cy="101" r="3.25" fill="#eee" />
      </svg>
      <p>Different pathways. Shared possibilities.</p>
    </div>
  );
}

export default function TheIdeaPage() {
  return (
    <div className={styles.frame} data-testid="idea-outer-frame">
      <ProgramsStage
        programs={explorationAreas}
        heading="Where your interests can take you."
        intro={
          <>
            <MembershipIntro />
            <ConnectedPathways />
            <MembershipExplorer />
          </>
        }
        showSpotlightCard={false}
      >
        <PhotographicGallery />
      </ProgramsStage>
    </div>
  );
}
