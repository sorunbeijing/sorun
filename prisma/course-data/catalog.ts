import { DOMAINS_A } from "./domains-a";
import { DOMAINS_B } from "./domains-b";
import { buildDomainLessons } from "./builder";
import type { DomainSpec, GeneratedLessonPayload } from "./types";

export const ALL_DOMAINS: DomainSpec[] = [...DOMAINS_A, ...DOMAINS_B];

export function getAllGeneratedLessons(): GeneratedLessonPayload[] {
  return ALL_DOMAINS.flatMap((domain) => buildDomainLessons(domain));
}

export const EXPECTED_LESSON_COUNT = ALL_DOMAINS.length * 5;
