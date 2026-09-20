export type EventType = "AI" | "BIOTECH";

export type GlossaryEntry = {
  term: string;
  category: string;
  definition: string;
  aliases?: string[];
  sources?: string[];
};

export type Session = {
  id: string;
  eventId: string;
  number: string;
  title: string;
  eyebrow: string;
  description: string;
  videoUrl: string;
  transcript: string;
  transcriptFileName: string;
  originalTranscriptUrl: string;
  fixedTranscript: string;
  fixedTranscriptFileName: string;
  fixedTranscriptUrl?: string;
  correctionCount: number;
};

export type Event = {
  id: string;
  name: string;
  type: EventType;
  sourceUrl: string;
  sourceLabel: string;
  date: string;
  location: string;
  mark: string;
  eyebrow: string;
  headline: string;
  description: string;
  accent: "primary" | "secondary" | "success" | "warning";
  collectionUrl?: string;
  collectionLabel?: string;
  suggestions: string[];
  sessions: Session[];
  glossary: GlossaryEntry[];
};
