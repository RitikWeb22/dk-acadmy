export interface FounderKeyFact {
  label: string;
  value: string;
}

export interface FounderCta {
  label: string;
  to: string;
}

export interface FounderData {
  name: string;
  roleBadge: string;
  sectionLabel: string;
  initials: string;
  photo: string;
  photoAlt: string;
  bio: string[];
  credentials: string[];
  quote: string;
  keyFacts: FounderKeyFact[];
  primaryCta: FounderCta;
  secondaryCta: FounderCta;
}

export const founderData: FounderData;
export default founderData;
