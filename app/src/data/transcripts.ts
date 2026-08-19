import dealmakingRaw from "./transcripts/unlock-2026-dealmaking-and-partnerships.txt?raw";
import trainingRaw from "./transcripts/unlock-2026-how-to-train-an-ai-for-science.txt?raw";
import noetikRaw from "./transcripts/unlock-2026-noetik.txt?raw";
import proofRaw from "./transcripts/unlock-2026-predictions-to-proof.txt?raw";
import hypeRaw from "./transcripts/unlock-2026-what-is-hype-and-what-is-real.txt?raw";
import astraZenecaRaw from "./transcripts/unlock-2026-astrazeneca-ai-playbook.txt?raw";
import agentsRaw from "./transcripts/unlock-2026-agents-for-scientific-discovery.txt?raw";
import xairaXCellRaw from "./transcripts/unlock-2026-xaira-x-cell-drug-discovery.txt?raw";
import dealmakingUrl from "./transcripts/unlock-2026-dealmaking-and-partnerships.txt?url";
import trainingUrl from "./transcripts/unlock-2026-how-to-train-an-ai-for-science.txt?url";
import noetikUrl from "./transcripts/unlock-2026-noetik.txt?url";
import proofUrl from "./transcripts/unlock-2026-predictions-to-proof.txt?url";
import hypeUrl from "./transcripts/unlock-2026-what-is-hype-and-what-is-real.txt?url";
import astraZenecaUrl from "./transcripts/unlock-2026-astrazeneca-ai-playbook.txt?url";
import agentsUrl from "./transcripts/unlock-2026-agents-for-scientific-discovery.txt?url";
import xairaXCellUrl from "./transcripts/unlock-2026-xaira-x-cell-drug-discovery.txt?url";
import { applyProposedTranscriptFixes } from "./transcriptFixes";

export type Session = {
  id: string;
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
  correctionCount: number;
};

const videoUrlFrom = (transcript: string) =>
  transcript.match(/^https?:\/\/\S+/m)?.[0] ?? "";

type SessionInput = Omit<
  Session,
  "videoUrl" | "transcriptFileName" | "fixedTranscript" | "fixedTranscriptFileName" | "correctionCount"
> & {
  transcriptFileName: string;
};

const createSession = ({ transcriptFileName, transcript, ...session }: SessionInput): Session => {
  const fixed = applyProposedTranscriptFixes(transcript, transcriptFileName);

  return {
    ...session,
    transcript,
    transcriptFileName,
    videoUrl: videoUrlFrom(transcript),
    fixedTranscript: fixed.text,
    fixedTranscriptFileName: transcriptFileName.replace(/\.txt$/, "-fixed.txt"),
    correctionCount: fixed.correctionCount,
  };
};

export const sessions: Session[] = [
  createSession({
    id: "dealmaking",
    number: "01",
    title: "Dealmaking & partnerships",
    eyebrow: "AI × pharma",
    description:
      "How model companies, biotechs, and pharma are changing the shape of partnerships, data sharing, and platform deals.",
    transcript: dealmakingRaw,
    transcriptFileName: "unlock-2026-dealmaking-and-partnerships.txt",
    originalTranscriptUrl: dealmakingUrl,
  }),
  createSession({
    id: "training",
    number: "02",
    title: "How to train an AI for science",
    eyebrow: "Models × biology",
    description:
      "A debate about biological data, new architectures, interpretability, experimental velocity, and the limits of scaling alone.",
    transcript: trainingRaw,
    transcriptFileName: "unlock-2026-how-to-train-an-ai-for-science.txt",
    originalTranscriptUrl: trainingUrl,
  }),
  createSession({
    id: "noetik",
    number: "03",
    title: "Noetik: models of human biology",
    eyebrow: "Company session",
    description:
      "A case for multimodal foundation models that connect tissue, cells, molecular data, and clinical outcomes in oncology.",
    transcript: noetikRaw,
    transcriptFileName: "unlock-2026-noetik.txt",
    originalTranscriptUrl: noetikUrl,
  }),
  createSession({
    id: "proof",
    number: "04",
    title: "From predictions to proof",
    eyebrow: "Evals × automation",
    description:
      "What is already real in AI drug discovery—and why trustworthy experiments and closed-loop evaluation may be the next frontier.",
    transcript: proofRaw,
    transcriptFileName: "unlock-2026-predictions-to-proof.txt",
    originalTranscriptUrl: proofUrl,
  }),
  createSession({
    id: "hype",
    number: "05",
    title: "What is hype—and what is real?",
    eyebrow: "Reality check",
    description:
      "Operators from Arc Institute, Ginkgo Bioworks, and NewLimit test the industry’s biggest claims against what the science supports today.",
    transcript: hypeRaw,
    transcriptFileName: "unlock-2026-what-is-hype-and-what-is-real.txt",
    originalTranscriptUrl: hypeUrl,
  }),
  createSession({
    id: "astrazeneca",
    number: "06",
    title: "AstraZeneca's AI playbook",
    eyebrow: "Pharma strategy",
    description:
      "How domain-specific frontier models, clinical-trial data, and organizational focus shape AstraZeneca's approach to AI across discovery and development.",
    transcript: astraZenecaRaw,
    transcriptFileName: "unlock-2026-astrazeneca-ai-playbook.txt",
    originalTranscriptUrl: astraZenecaUrl,
  }),
  createSession({
    id: "agents-for-sci",
    number: "07",
    title: "Agents for scientific discovery",
    eyebrow: "AI scientists",
    description:
      "Andrew White on Edison Scientific, Kosmos, and the shift from coding agents toward systems that can complete long-horizon scientific research.",
    transcript: agentsRaw,
    transcriptFileName: "unlock-2026-agents-for-scientific-discovery.txt",
    originalTranscriptUrl: agentsUrl,
  }),
  createSession({
    id: "xaira-x-cell",
    number: "08",
    title: "Xaira X-Cell",
    eyebrow: "Virtual cells",
    description:
      "A technical look at X-Cell, Xaira's predictive-biology platform for learning perturbation effects from causal data and generalizing to human biology.",
    transcript: xairaXCellRaw,
    transcriptFileName: "unlock-2026-xaira-x-cell-drug-discovery.txt",
    originalTranscriptUrl: xairaXCellUrl,
  }),
];
