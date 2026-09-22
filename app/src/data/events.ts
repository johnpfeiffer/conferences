import workosFixed from "./2026-08-12-workos-agent-night/fixed_transcript.txt?raw";
import workosFixedUrl from "./2026-08-12-workos-agent-night/fixed_transcript.txt?url";
import workosGlossary from "./2026-08-12-workos-agent-night/glossary.json";
import workosRaw from "./2026-08-12-workos-agent-night/youtube_raw.txt?raw";
import workosRawUrl from "./2026-08-12-workos-agent-night/youtube_raw.txt?url";
import aiewfFixed from "./aiewf/aie-2026-uber-eats-closed-loop-evals/fixed_transcript.txt?raw";
import aiewfFixedUrl from "./aiewf/aie-2026-uber-eats-closed-loop-evals/fixed_transcript.txt?url";
import aiewfGlossary from "./aiewf/aie-2026-uber-eats-closed-loop-evals/glossary.json";
import aiewfRaw from "./aiewf/aie-2026-uber-eats-closed-loop-evals/youtube_raw.txt?raw";
import aiewfRawUrl from "./aiewf/aie-2026-uber-eats-closed-loop-evals/youtube_raw.txt?url";
import glossaryAiTech from "./glossary.ai-tech.json";
import glossaryBiotech from "./glossary.biotech.json";
import { sessions as unlockSessions } from "./transcripts";
import type { Event, GlossaryEntry, Session } from "../models/event";

export const DEFAULT_EVENT_ID = "unlock2026";

const videoUrlFrom = (transcript: string) =>
  transcript.match(/^https?:\/\/\S+/m)?.[0] ?? "";

const workosSession: Session = {
  id: "workos-state-of-agents",
  eventId: "2026-08-12-workos-agent-night",
  number: "01",
  title: "Panel: The State of Agents",
  eyebrow: "Agents × work",
  description:
    "Jaya Gupta, Flo Crivello, and swyx debate open models, harness engineering, memory, context, and what agents will change next.",
  videoUrl: videoUrlFrom(workosRaw),
  transcript: workosRaw,
  transcriptFileName: "youtube_raw.txt",
  originalTranscriptUrl: workosRawUrl,
  fixedTranscript: workosFixed,
  fixedTranscriptFileName: "fixed_transcript.txt",
  fixedTranscriptUrl: workosFixedUrl,
  correctionCount: 75,
};

const aiewfSession: Session = {
  id: "aiewf-closed-loop-evals",
  eventId: "aiewf",
  number: "01",
  title: "Building Closed-Loop Evals for a Multimodal Agent at Scale",
  eyebrow: "Evals × multimodal agents",
  description:
    "Soumya Gupta and Jai Chopra explain how Uber evaluates and tunes a food-image enhancement agent without rewarding unsafe shortcuts.",
  videoUrl: videoUrlFrom(aiewfRaw),
  transcript: aiewfRaw,
  transcriptFileName: "youtube_raw.txt",
  originalTranscriptUrl: aiewfRawUrl,
  fixedTranscript: aiewfFixed,
  fixedTranscriptFileName: "fixed_transcript.txt",
  fixedTranscriptUrl: aiewfFixedUrl,
  correctionCount: 13,
};

export const events: Event[] = [
  {
    id: DEFAULT_EVENT_ID,
    name: "UNLOCK 2026",
    type: "BIOTECH",
    sourceUrl: "https://www.unlockscience.ai/",
    sourceLabel: "Official event site",
    date: "April 22, 2026",
    location: "City View at Metreon · San Francisco",
    mark: "UNLOCK/26",
    eyebrow: "AI × SCIENCE",
    headline: "Where AI meets the wet lab.",
    description:
      "A one-day summit on how AI is changing drug discovery and life sciences—where the field is advancing and where hard problems remain.",
    accent: "success",
    collectionUrl: "https://www.youtube.com/playlist?list=PLl02HFGbrh1wB221w2FEYufzDjFbyn4w2",
    collectionLabel: "Full UNLOCK 2026 playlist",
    suggestions: [
      "Where is AI in biology overhyped—and underhyped?",
      "What has changed in pharma–AI dealmaking?",
      "Why might AlphaFold-style scaling fail for biology?",
      "What makes a trustworthy scientific eval?",
    ],
    sessions: unlockSessions,
    glossary: [
      ...glossaryBiotech.terms,
      ...glossaryAiTech.terms,
    ] as GlossaryEntry[],
  },
  {
    id: "2026-08-12-workos-agent-night",
    name: "WorkOS Agent Night",
    type: "AI",
    sourceUrl: "https://workos.com/blog/agent-night-panel-recap",
    sourceLabel: "WorkOS panel recap",
    date: "August 12, 2026",
    location: "Regency Ballroom · San Francisco",
    mark: "WORKOS / AGENT NIGHT",
    eyebrow: "THE STATE OF AGENTS",
    headline: "AGI arrived — or it is a skill issue.",
    description:
      "A candid panel about rapidly rising AI spend, open-source models, agent harnesses, organizational context, memory, and the road to December.",
    accent: "primary",
    suggestions: [
      "Why did AI tooling spend rise so quickly?",
      "Do better models or better harnesses matter more?",
      "What is a context graph?",
      "Will one general agent beat many specialist agents?",
    ],
    sessions: [workosSession],
    glossary: workosGlossary.terms as GlossaryEntry[],
  },
  {
    id: "aiewf",
    name: "AI Engineer World's Fair",
    type: "AI",
    sourceUrl: "https://ai.engineer/worldsfair/2026",
    sourceLabel: "Official event site",
    date: "June 29 – July 2, 2026",
    location: "Moscone West · San Francisco",
    mark: "AI ENGINEER / WORLD'S FAIR",
    eyebrow: "PRODUCTION AI",
    headline: "The engineering behind useful agents.",
    description:
      "A practical look at closed-loop evaluation for a multimodal production agent, grounded in how Uber improves food photography at marketplace scale.",
    accent: "warning",
    suggestions: [
      "How does the food enhancement agent work?",
      "What does reward hacking look like in image editing?",
      "How are online and offline evaluation signals combined?",
      "How does Uber balance creativity and safety?",
    ],
    sessions: [aiewfSession],
    glossary: aiewfGlossary.terms as GlossaryEntry[],
  },
];

export const sessions = events.flatMap((event) => event.sessions);

export function getEvent(eventId: string): Event | undefined {
  return events.find(({ id }) => id === eventId);
}
