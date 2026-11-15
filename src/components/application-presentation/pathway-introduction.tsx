"use client";

import type { Pathway } from "../pathway-questions";
import { ApplicationIntroduction } from "./application-introduction";

export function PathwayIntroduction({ track }: { track: Pathway }) {
  return <ApplicationIntroduction track={track} />;
}
