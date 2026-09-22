import {
  type FormEvent,
  Fragment,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { conferenceOptionLabel, eventPath, sessionPath } from "../controllers/routes";
import { events } from "../data/events";
import { askConference, type ConversationTurn } from "../lib/chat";
import {
  buildTranscriptIndex,
  retrieveSources,
  videoAtTimestamp,
  type TranscriptChunk,
} from "../lib/retrieval";
import type { Event, Session } from "../models/event";
import { internalLinkHandler, type Navigate } from "./navigation";
import "./unlock.css";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: TranscriptChunk[];
  error?: boolean;
};

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function SendIcon() {
  return <span aria-hidden="true">↑</span>;
}

function AnswerText({ text, messageId }: { text: string; messageId: number }) {
  return text.split(/(\[\d+\])/g).map((part, index) => {
    const citation = part.match(/^\[(\d+)\]$/);
    return citation ? (
      <a
        className="citation"
        href={`#source-${messageId}-${citation[1]}`}
        key={`${part}-${index}`}
        aria-label={`Jump to source ${citation[1]}`}
      >
        {part}
      </a>
    ) : <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function TranscriptLinks({
  event,
  session,
  onNavigate,
}: {
  event: Event;
  session: Session;
  onNavigate: Navigate;
}) {
  const path = sessionPath(event.id, session.id);
  return (
    <div className="session-resources" aria-label={`${session.title} resources`}>
      <a href={session.videoUrl} target="_blank" rel="noreferrer">
        Watch video <span aria-hidden="true">↗</span>
      </a>
      <a
        className="fixed-transcript-link"
        href={path}
        onClick={internalLinkHandler(onNavigate, path)}
      >
        Read transcript
        <small>Fixed + original</small>
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}

export default function UnlockLandingPage({ event, onNavigate }: { event: Event; onNavigate: Navigate }) {
  const transcriptIndex = useMemo(() => buildTranscriptIndex(event.sessions), [event.sessions]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messageId = useRef(0);
  const conversationEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "UNLOCK 2026 — Grounded transcript archive";
  }, []);

  const submitQuestion = async (nextQuestion: string) => {
    const trimmed = nextQuestion.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: ++messageId.current,
      role: "user",
      content: trimmed,
    };
    const sources = retrieveSources(trimmed, transcriptIndex);
    const history: ConversationTurn[] = messages
      .filter((message) => !message.error)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsLoading(true);
    requestAnimationFrame(() => conversationEnd.current?.scrollIntoView({ behavior: "smooth" }));

    try {
      const answer = await askConference(trimmed, sources, history, undefined, event.name);
      setMessages((current) => [
        ...current,
        {
          id: ++messageId.current,
          role: "assistant",
          content: answer,
          sources,
        },
      ]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setMessages((current) => [
        ...current,
        {
          id: ++messageId.current,
          role: "assistant",
          content: detail.includes("configured") || detail.includes("503")
            ? "The conference guide is not connected right now. Its server-side LLM configuration is unavailable."
            : "I couldn’t reach the conference guide. Please try that question again in a moment.",
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => conversationEnd.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  const onSubmit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    void submitQuestion(question);
  };

  const onComposerKeyDown = (keyEvent: KeyboardEvent<HTMLTextAreaElement>) => {
    if (keyEvent.key === "Enter" && !keyEvent.shiftKey) {
      keyEvent.preventDefault();
      void submitQuestion(question);
    }
  };

  return (
    <div className="unlock-site">
      <header className="topbar">
        <div className="unlock-identity">
          <a className="wordmark" href="#top" aria-label="UNLOCK 2026 home">
            UNLOCK<span>/26</span>
          </a>
          <span className="unlock-discipline">AI × SCIENCE</span>
        </div>
        <div className="conference-picker">
          <label htmlFor="unlock-conference-selector">Choose a conference</label>
          <select
            id="unlock-conference-selector"
            className="event-picker"
            aria-label="Conference selector"
            value={event.id}
            onChange={(changeEvent) => onNavigate(eventPath(changeEvent.target.value))}
          >
            {events.map((option) => (
              <option key={option.id} value={option.id}>{conferenceOptionLabel(option)}</option>
            ))}
          </select>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="unlock-hero-title">
          <div className="hero-kicker">
            <span>APRIL 22, 2026</span>
            <span>SAN FRANCISCO</span>
            <span>{event.sessions.length} SELECTED TRANSCRIPTS</span>
          </div>
          <h1 id="unlock-hero-title">
            The day AI met
            <br />
            <em>the wet lab.</em>
          </h1>
          <p className="hero-copy">
            A one-day summit on how AI is changing drug discovery and life sciences. Ask the
            highlight transcripts where the field is genuinely advancing—and where challenges remain.
          </p>
        </section>

        <section className="chat-section" aria-labelledby="unlock-chat-title">
          <div className="chat-heading">
            <div>
              <span className="section-index">01 / ASK THE ARCHIVE</span>
              <h2 id="unlock-chat-title">What do you want to unlock?</h2>
            </div>
            <p>
              Answers use relevant excerpts from the supplied transcripts and link back to the
              exact moments in each session.
            </p>
          </div>

          <div className="chat-frame">
            <div className="chat-toolbar">
              <span className="status-pill"><i /> TRANSCRIPT GROUNDED</span>
              <span>{transcriptIndex.length} searchable excerpts</span>
            </div>

            <div className={`conversation ${messages.length ? "has-messages" : ""}`} aria-live="polite">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <span className="spark">✳</span>
                  <p>Start with a theme, a claim, a company, or a question you wish you’d asked in the room.</p>
                  <div className="suggestions" aria-label="Suggested questions">
                    {event.suggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => void submitQuestion(suggestion)}>
                        <span>{suggestion}</span>
                        <ArrowIcon />
                      </button>
                    ))}
                  </div>
                </div>
              ) : messages.map((message) => (
                <article className={`message ${message.role} ${message.error ? "error" : ""}`} key={message.id}>
                  <div className="message-label">
                    {message.role === "user" ? "YOU" : "UNLOCK ARCHIVE"}
                  </div>
                  <div className="message-content">
                    <AnswerText text={message.content} messageId={message.id} />
                  </div>
                  {message.sources && (
                    <div className="source-list" aria-label="Sources used in this answer">
                      <span className="source-list-title">SOURCE MOMENTS</span>
                      {message.sources.map((source, index) => (
                        <a
                          id={`source-${message.id}-${index + 1}`}
                          className="source-card"
                          href={videoAtTimestamp(source.videoUrl, source.seconds)}
                          target="_blank"
                          rel="noreferrer"
                          key={source.id}
                        >
                          <span className="source-number">[{index + 1}]</span>
                          <span className="source-detail">
                            <strong>{source.sessionTitle}</strong>
                            <small>{source.timestamp} · {source.text.slice(0, 150)}…</small>
                          </span>
                          <ArrowIcon />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
              {isLoading && (
                <div className="thinking" role="status">
                  <span /><span /><span /> Searching the conversations
                </div>
              )}
              <div ref={conversationEnd} />
            </div>

            <form className="composer" onSubmit={onSubmit}>
              <label htmlFor="unlock-question">Ask about UNLOCK 2026</label>
              <div className="composer-row">
                <textarea
                  id="unlock-question"
                  value={question}
                  onChange={(changeEvent) => setQuestion(changeEvent.target.value.slice(0, 1_000))}
                  onKeyDown={onComposerKeyDown}
                  placeholder="What did the speakers say about…"
                  rows={2}
                  disabled={isLoading}
                />
                <button type="submit" disabled={!question.trim() || isLoading} aria-label="Send question">
                  <SendIcon />
                </button>
              </div>
              <div className="composer-note">
                <span>ENTER TO SEND · SHIFT + ENTER FOR A NEW LINE</span>
                <span>{question.length}/1000</span>
              </div>
            </form>
          </div>
        </section>

        <section className="sessions-section" id="sessions" aria-labelledby="unlock-sessions-title">
          <div className="sessions-heading">
            <span className="section-index">02 / SELECTED HIGHLIGHTS</span>
            <h2 id="unlock-sessions-title">{event.sessions.length} talks<br />worth replaying.</h2>
            <p>
              These selected sessions are searchable in the chat, with answers linked back to exact
              moments. Every session includes both the original automatic transcript and a fixed version.
            </p>
          </div>
          <div className="session-list">
            {event.sessions.map((session) => (
              <article className="session-row" key={session.id}>
                <span className="session-number">{session.number}</span>
                <div className="session-main">
                  <small>{session.eyebrow}</small>
                  <strong>{session.title}</strong>
                  <p>{session.description}</p>
                  <TranscriptLinks event={event} session={session} onNavigate={onNavigate} />
                </div>
              </article>
            ))}
            {event.collectionUrl && (
              <a className="playlist-link" href={event.collectionUrl} target="_blank" rel="noreferrer">
                <span>Browse Every UNLOCK Video</span>
                <ArrowIcon />
              </a>
            )}
            <details className="unlock-glossary">
              <summary>Explore the UNLOCK glossary <span>{event.glossary.length} terms</span></summary>
              <div className="glossary-grid">
                {event.glossary.slice(0, 24).map((term) => (
                  <div key={`${term.category}-${term.term}`}>
                    <strong>{term.term}</strong>
                    <small>{term.category}</small>
                    <p>{term.definition}</p>
                  </div>
                ))}
              </div>
              <p className="glossary-note">Showing 24 of {event.glossary.length} event terms.</p>
            </details>
          </div>
        </section>
      </main>

      <footer>
        <a className="wordmark" href="#top">UNLOCK<span>/26</span></a>
        <p>April 22, 2026 · City View at Metreon · San Francisco</p>
        <div className="footer-links">
          <a href={event.sourceUrl} target="_blank" rel="noreferrer">Official site ↗</a>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}
