/**
 * Astra Programs Data
 *
 * Structured content for the four cinematic program chapters.
 * Images are locally hosted in /public/images/programs/
 * All photos sourced from Pexels/Unsplash under free commercial-use licenses.
 * No attribution required per platform licenses, but photographer credit is appreciated.
 */

export interface ProgramImage {
  /** Full-size hero image (WebP, ~1920px wide) */
  hero: string;
  /** Thumbnail variant (WebP, ~400px wide) */
  thumb: string;
  /** Accessible alt text describing the image content */
  alt: string;
}

export interface AstraProgram {
  /** Stable identifier for routing and keys */
  id: string;
  /** Display number (01-04) */
  number: string;
  /** Program title */
  title: string;
  /** Premium, concise description (student-focused, no promised specifics) */
  description: string;
  /** Chapter rail and thumbnail caption */
  short: string;
  /** Small chapter label */
  eyebrow: string;
  /** Expanded chapter copy */
  details: string;
  /** Image assets */
  image: ProgramImage;
}

/**
 * Rich program data with full image metadata.
 * Use this for new components that need thumbnails, alt text, etc.
 */
export const astraPrograms: readonly AstraProgram[] = [
  {
    id: "technology-ai",
    number: "01",
    title: "Technology & AI",
    eyebrow: "EXPLORE",
    short:
      "Explore emerging technologies, artificial intelligence and the future of how we live.",
    description:
      "Explore artificial intelligence, software, robotics and other emerging technologies. Discover how technology is changing the world — and what you could build with it.",
    details:
      "A space to explore AI, software, emerging technology and their potential for real-world change. Share ideas, connect with people interested in technology, and discover new directions for your own projects.",
    image: {
      hero: "/images/program-stock/01-technology-ai.webp",
      thumb: "/images/program-stock/01-technology-ai.webp",
      alt: "Close-up of source code displayed on a laptop in a dark workspace",
    },
  },
  {
    id: "build-create",
    number: "02",
    title: "Build & Create",
    eyebrow: "CREATE",
    short:
      "Turn ideas into real prototypes through hands-on projects and design.",
    description:
      "Go beyond the idea. Explore programming, product design, engineering and hands-on making while discovering how ambitious concepts become real things.",
    details:
      "For students drawn to making, designing and experimenting. From an early sketch to a working prototype, this area is about exploring how ideas could be brought to life.",
    image: {
      hero: "/images/program-stock/02-build-create.webp",
      thumb: "/images/program-stock/02-build-create.webp",
      alt: "Two engineers working together on a prototype in a tool-lined workshop",
    },
  },
  {
    id: "business-ideas",
    number: "03",
    title: "Business & Ideas",
    eyebrow: "LAUNCH",
    short:
      "Learn how ideas become ventures with strategy, finance and collaboration.",
    description:
      "Explore entrepreneurship, strategy, finance and the process of developing an idea. Connect with other students interested in creating useful ventures.",
    details:
      "Explore the thinking behind entrepreneurship, finance, strategy and collaborative problem-solving. Learn from other students’ interests and bring a commercial perspective to new ideas.",
    image: {
      hero: "/images/program-stock/03-business-ideas.webp",
      thumb: "/images/program-stock/03-business-ideas.webp",
      alt: "A group of young adults discussing ideas around a table in a studio",
    },
  },
  {
    id: "science-media",
    number: "04",
    title: "Science, Media & More",
    eyebrow: "DISCOVER",
    short:
      "Explore science, communication, design and other diverse fields that shape our world.",
    description:
      "Follow your curiosity into science, research, media, creative work and everything in between. Explore unexpected connections across disciplines.",
    details:
      "A broad space for curious minds whose interests do not fit into a single category — from scientific investigation and research to design, storytelling and creative communication.",
    image: {
      hero: "/images/program-stock/04-science-media-more.webp",
      thumb: "/images/program-stock/04-science-media-more.webp",
      alt: "Three university students conducting physics experiments in a laboratory",
    },
  },
] as const;

/** Type for program ID union */
export type ProgramId = (typeof astraPrograms)[number]["id"];

/** Lookup a program by ID */
export function getProgramById(id: ProgramId): AstraProgram | undefined {
  return astraPrograms.find((p) => p.id === id);
}

/** Get all program IDs in order */
export function getProgramIds(): readonly ProgramId[] {
  return astraPrograms.map((p) => p.id) as readonly ProgramId[];
}
