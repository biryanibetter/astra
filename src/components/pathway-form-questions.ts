import type { Pathway } from "./pathway-questions";

export type { Pathway } from "./pathway-questions";

const gradeLabels = {
  "grade-9-year-10": "Grade 9 / Year 10",
  "grade-10-year-11": "Grade 10 / Year 11",
  "grade-11-year-12": "Grade 11 / Year 12",
  "grade-12-year-13": "Grade 12 / Year 13",
};

export const gradeOptions = Object.entries(gradeLabels);

export function getGradeLabel(value: string): string {
  return gradeOptions.find(([grade]) => grade === value)?.[1] ?? "";
}

export type PathwayQuestion = {
  id: string;
  label: string;
  hint?: string;
  maxChars?: number;
  minChars?: number;
  layout?: "vertical";
} & (
  | { type: "multi-select" | "single-select"; options: readonly string[] }
  | { type: "textarea"; placeholder: string; optional?: true }
);

export const coreCommitments = [
  {
    id: "tasks",
    text: "I agree to take responsibility for tasks that I accept and work towards agreed deadlines.",
  },
  {
    id: "meetings",
    text: "I agree to attend agreed meetings and communicate in advance if I am unable to participate.",
  },
  {
    id: "updates",
    text: "I agree to maintain reasonable communication with my team and provide updates on my assigned work.",
  },
  {
    id: "availability",
    text: "I agree to communicate difficulties or changes in my availability rather than leaving responsibilities unattended.",
  },
  {
    id: "conduct",
    text: "I agree to conduct myself professionally and respectfully when working with others and representing Astra.",
  },
  {
    id: "review",
    text: "I understand that repeated failure to meet agreed responsibilities or serious misconduct may result in a review or termination of my Core membership.",
  },
] as const;

type PathwayConfiguration = {
  cvRequired: boolean;
  questions: readonly [PathwayQuestion, ...PathwayQuestion[]];
};

// The public preview is independent of the prepared backend's legacy intake schema.
export const pathwayQuestions: Record<Pathway, PathwayConfiguration> = {
  core: {
    cvRequired: true,
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
        id: "core-motivation",
        type: "textarea",
        label:
          "Why do you want to join Astra Core, and what do you believe you could contribute to the organization?",
        placeholder:
          "Tell us what motivated you to apply and how you would like to contribute to Astra.",
        maxChars: 2000,
        minChars: 500,
      },
      {
        id: "core-time",
        type: "single-select",
        label:
          "How much time can you consistently dedicate to Astra each week?",
        options: [
          "1–2 hours",
          "3–4 hours",
          "5–6 hours",
          "7+ hours",
          "Availability varies",
        ],
      },
      {
        id: "core-availability",
        type: "multi-select",
        label:
          "When are you generally available for meetings and collaborative work?",
        options: [
          "Weekday afternoons",
          "Weekday evenings",
          "Friday",
          "Saturday",
          "Flexible availability",
        ],
        layout: "vertical",
      },
      {
        id: "core-in-person",
        type: "single-select",
        label:
          "Are you able to attend in-person meetings and events when scheduled in advance?",
        options: [
          "Yes",
          "Depending on the date and location",
          "I would primarily be available online",
        ],
        layout: "vertical",
      },
      {
        id: "core-existing-commitments",
        type: "textarea",
        label:
          "Do you have any existing commitments that may affect your availability?",
        placeholder:
          "For example, upcoming examinations, school responsibilities, other organizations or scheduling restrictions.",
        maxChars: 1000,
        optional: true,
      },
    ],
  },
  fellow: {
    cvRequired: false,
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
        id: "fellow-motivation",
        type: "textarea",
        label: "Why do you want to become an Astra Fellow?",
        placeholder:
          "Tell us what motivated you to apply and why you would like to be part of Astra.",
        maxChars: 2000,
        minChars: 500,
      },
      {
        id: "fellow-ambitions",
        type: "textarea",
        label:
          "What would you like to explore, develop or achieve as an Astra Fellow?",
        placeholder:
          "This could be an existing project, a new idea, an area of interest or something you would like to accomplish in the future.",
        maxChars: 1200,
        minChars: 250,
      },
      {
        id: "fellow-activities",
        type: "multi-select",
        label:
          "What types of activities would you be interested in participating in?",
        options: [
          "Hackathons & competitions",
          "Research & innovation exhibitions",
          "Workshops & collaborative projects",
          "Speaker sessions & discussions",
          "Entrepreneurship & startup initiatives",
          "Networking & student gatherings",
        ],
      },
      {
        id: "fellow-collaboration",
        type: "single-select",
        label:
          "Would you be interested in collaborating with students from other schools?",
        options: [
          "Yes, I am interested in cross-school collaboration.",
          "Depending on the project or opportunity.",
          "I would prefer to work independently.",
        ],
        layout: "vertical",
      },
      {
        id: "fellow-opportunities",
        type: "multi-select",
        label: "What opportunities are you looking for through Astra?",
        options: [
          "Finding collaborators",
          "Connecting with researchers and professionals",
          "Developing new ideas and projects",
          "Access to competitions and exhibitions",
          "Presenting and showcasing my work",
          "Entrepreneurial opportunities",
          "Expanding my professional and student network",
        ],
      },
    ],
  },
};
