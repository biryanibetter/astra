export type ChapterStatus = "unconfirmed" | "interest" | "founding" | "active";

export const CHAPTER_STATUSES: Record<ChapterStatus, string> = {
  unconfirmed: "No confirmed Astra chapter",
  interest: "Student interest recorded",
  founding: "Founding team in development",
  active: "School-approved active chapter",
};

export type School = {
  slug: string;
  name: string;
  location: string;
  website: string;
  description: string;
  sources: { label: string; url: string }[];
  coordinates?: { longitude: number; latitude: number; source: string };
  chapterStatus: ChapterStatus;
};

// Directory inclusion is not affiliation. Statuses change only against actual
// chapter records; location sources describe campuses, not Astra participation.
export const SCHOOLS: School[] = [
  {
    slug: "birla-public-school",
    name: "Birla Public School",
    location: "Street 1011, Mesaimeer, Doha",
    website: "https://www.bpsdoha.edu.qa/",
    description:
      "An English-medium, co-educational school in Doha following the CBSE curriculum, with classes from kindergarten to Class XII.",
    sources: [
      {
        label: "Official school contact and campus address",
        url: "https://www.bpsdoha.edu.qa/contact-us",
      },
      {
        label: "Official school introduction",
        url: "https://bpsdoha.edu.qa/about-us/the-bps/23-birla-public-school/primary-school",
      },
      {
        label: "OpenStreetMap: Street 1011 campus",
        url: "https://www.openstreetmap.org/way/242713202",
      },
    ],
    coordinates: {
      latitude: 25.2111054,
      longitude: 51.5227159,
      source: "https://www.openstreetmap.org/way/242713202",
    },
    chapterStatus: "unconfirmed",
  },
  {
    slug: "doha-college",
    name: "Doha College",
    location: "Al Niser Street, Doha",
    website: "https://www.dohacollege.com/",
    description:
      "A British, not-for-profit school in Qatar serving students aged 3–18.",
    sources: [
      { label: "Official school website", url: "https://www.dohacollege.com/" },
      {
        label: "Official school contact",
        url: "https://www.dohacollege.com/contact",
      },
    ],
    chapterStatus: "unconfirmed",
  },
  {
    slug: "qatar-academy-doha",
    name: "Qatar Academy Doha",
    location: "Education City, Al Luqta Street, Doha",
    website: "https://qad.edu.qa/",
    description:
      "A Qatar Foundation school in Education City. The map pin identifies its Senior School, as linked from the school's contact page.",
    sources: [
      {
        label: "Official contact and Senior School map link",
        url: "https://qad.edu.qa/contact-us/",
      },
      {
        label: "Qatar Foundation school listing",
        url: "https://www.qf.org.qa/education/Qatar-Academy-Doha",
      },
    ],
    coordinates: {
      latitude: 25.315984,
      longitude: 51.4285275,
      source: "https://goo.gl/maps/1zk9gQ1bZe6wNDjH9",
    },
    chapterStatus: "unconfirmed",
  },
  {
    slug: "american-school-of-doha",
    name: "American School of Doha",
    location: "Al Bustan Street, Al Waab / Al Soudan, Doha",
    website: "https://asd.sch.qa/",
    description:
      "An independent, co-educational, nonprofit day school in Doha offering education from pre-kindergarten through Grade 12.",
    sources: [
      {
        label: "Official school contact",
        url: "https://asd.sch.qa/contact-us",
      },
      {
        label: "US Department of State school fact sheet",
        url: "https://www.state.gov/american-school-of-doha-fact-sheet/",
      },
      {
        label: "Wikipedia campus coordinates",
        url: "https://en.wikipedia.org/wiki/American_School_of_Doha",
      },
    ],
    coordinates: {
      latitude: 25.26333,
      longitude: 51.48111,
      source: "https://en.wikipedia.org/wiki/American_School_of_Doha",
    },
    chapterStatus: "unconfirmed",
  },
  {
    slug: "dps-modern-indian-school",
    name: "DPS Modern Indian School",
    location: "Doha, Qatar",
    website: "https://website.dpsmisdoha.com/",
    description:
      "A school in Doha, Qatar. A current campus coordinate has not yet been verified for this directory.",
    sources: [
      {
        label: "Official school website",
        url: "https://website.dpsmisdoha.com/",
      },
    ],
    chapterStatus: "unconfirmed",
  },
];

export function getSchool(slug: string): School | undefined {
  return SCHOOLS.find((school) => school.slug === slug);
}

export function filterSchools(
  query: string,
  status: ChapterStatus | "all" = "all",
): School[] {
  const normalized = query.trim().toLowerCase();
  return SCHOOLS.filter(
    (school) =>
      (status === "all" || school.chapterStatus === status) &&
      [school.name, school.location].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
  );
}
