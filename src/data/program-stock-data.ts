export interface ProgramStockItem {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly imagePath: string;
  readonly altText: string;
}

export const programStockData = [
  {
    id: "technology-ai",
    number: "01",
    title: "Technology & AI",
    description:
      "Explore artificial intelligence, software, robotics and the technologies shaping how we live and work.",
    imagePath: "/images/program-stock/01-technology-ai.webp",
    altText:
      "Close-up of source code displayed on a laptop in a dark workspace",
  },
  {
    id: "build-create",
    number: "02",
    title: "Build & Create",
    description:
      "Turn ideas into prototypes through hands-on engineering, product design and collaborative making.",
    imagePath: "/images/program-stock/02-build-create.webp",
    altText:
      "Two engineers working together on a prototype in a tool-lined workshop",
  },
  {
    id: "business-ideas",
    number: "03",
    title: "Business & Ideas",
    description:
      "Develop promising ideas through entrepreneurship, strategy, finance and collaborative problem-solving.",
    imagePath: "/images/program-stock/03-business-ideas.webp",
    altText:
      "A group of young adults discussing ideas around a table in a studio",
  },
  {
    id: "science-media-more",
    number: "04",
    title: "Science, Media & More",
    description:
      "Follow your curiosity across scientific research, media, design and creative communication.",
    imagePath: "/images/program-stock/04-science-media-more.webp",
    altText:
      "Three university students conducting physics experiments in a laboratory",
  },
] as const satisfies readonly ProgramStockItem[];
