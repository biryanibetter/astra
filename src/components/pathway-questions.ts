export type Pathway = "core" | "fellow";

const gradeLabels: Record<string, string> = {
  "grade-6-year-7": "Grade 6 / Year 7",
  "grade-7-year-8": "Grade 7 / Year 8",
  "grade-8-year-9": "Grade 8 / Year 9",
  "grade-9-year-10": "Grade 9 / Year 10",
  "grade-10-year-11": "Grade 10 / Year 11",
  "grade-11-year-12": "Grade 11 / Year 12",
  "grade-12-year-13": "Grade 12 / Year 13",
};

export function getGradeLabel(value: string): string {
  return gradeLabels[value] ?? "";
}

export type PathwayQuestion = {
  id: string;
  label: string;
  hint?: string;
} & (
  | { type: "multi-select" | "single-select"; options: readonly string[] }
  | { type: "textarea"; minimum: number; maximum: number }
);

type PathwayConfiguration = {
  title: string;
  introduction: string;
  expectation: string;
  questions: readonly [
    PathwayQuestion,
    PathwayQuestion,
    PathwayQuestion,
    PathwayQuestion,
    PathwayQuestion,
    PathwayQuestion,
  ];
};

export const pathwayQuestions: Record<Pathway, PathwayConfiguration> = {
  core: {
    title: "Astra Core",
    introduction:
      "For students who want to help build Astra: operations, events, projects, technology, marketing, partnerships, and the school network.",
    expectation:
      "Share where you can contribute, what you want to build, and what you hope to learn. Your answers stay in this browser session and are not submitted.",
    questions: [
      {
        id: "core-areas",
        type: "multi-select",
        label: "Which areas of Astra would you like to contribute to?",
        options: [
          "Events & experiences",
          "Projects & programs",
          "Technology & AI",
          "Communications & media",
          "Partnerships & outreach",
          "School network",
          "Operations & planning",
        ],
      },
      {
        id: "core-idea",
        type: "textarea",
        label:
          "Describe one idea or project you would like to help Astra develop.",
        minimum: 200,
        maximum: 500,
      },
      {
        id: "core-experience",
        type: "textarea",
        label:
          "Describe something you completed with a team. What was your contribution, and how did you follow through when plans changed?",
        minimum: 100,
        maximum: 300,
      },
      {
        id: "core-responsibilities",
        type: "multi-select",
        label: "What responsibilities would you be comfortable taking on?",
        options: [
          "Plan and coordinate tasks",
          "Create or improve digital tools",
          "Design content or communications",
          "Organize events or workshops",
          "Research ideas and opportunities",
          "Connect with students or partners",
          "Support a team and follow through",
        ],
      },
      {
        id: "core-time",
        type: "single-select",
        label: "How much time can you realistically contribute each week?",
        options: [
          "1–2 hours",
          "3–4 hours",
          "5–6 hours",
          "7+ hours",
          "It varies by week",
        ],
      },
      {
        id: "core-skills",
        type: "textarea",
        label: "What skills would you like to develop through Astra?",
        minimum: 100,
        maximum: 250,
      },
    ],
  },
  fellow: {
    title: "Astra Fellow",
    introduction:
      "For students pursuing independent projects, research, startups, leadership initiatives, or other ambitious work.",
    expectation:
      "Describe what you have made progress on, the evidence behind it, and what you intend to accomplish next. Your answers stay in this browser session and are not submitted.",
    questions: [
      {
        id: "fellow-field",
        type: "single-select",
        label: "What field best describes your primary initiative?",
        options: [
          "Artificial intelligence & technology",
          "Science, engineering & environment",
          "Entrepreneurship & business",
          "Research & academia",
          "Arts, design & media",
          "Education & community impact",
          "Leadership & advocacy",
          "Other / interdisciplinary",
        ],
      },
      {
        id: "fellow-project",
        type: "textarea",
        label:
          "Describe your most meaningful project, research, or initiative. What did you actually accomplish?",
        minimum: 200,
        maximum: 500,
      },
      {
        id: "fellow-contribution",
        type: "textarea",
        label:
          "What was your personal contribution, and what challenges did you overcome?",
        minimum: 150,
        maximum: 350,
      },
      {
        id: "fellow-evidence",
        type: "textarea",
        label: "What results or evidence can you share?",
        hint: "Examples include a prototype, findings, users reached, feedback, or measurable progress.",
        minimum: 100,
        maximum: 300,
      },
      {
        id: "fellow-next-year",
        type: "textarea",
        label:
          "What are you planning to build or achieve over the next 12 months?",
        minimum: 150,
        maximum: 350,
      },
      {
        id: "fellow-contribution-to-astra",
        type: "textarea",
        label:
          "How could you contribute to other students and projects within Astra?",
        minimum: 100,
        maximum: 250,
      },
    ],
  },
};
