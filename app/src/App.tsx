import {
  FormEvent,
  Fragment,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { sessions, type Session } from "./data/transcripts";
import { askConference, type ConversationTurn } from "./lib/chat";
import {
  buildTranscriptIndex,
  retrieveSources,
  timestampToSeconds,
  videoAtTimestamp,
  type TranscriptChunk,
} from "./lib/retrieval";
import { buildTranscriptRows, diffTranscriptWords, type DiffToken } from "./lib/transcriptView";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: TranscriptChunk[];
  error?: boolean;
};

const suggestions = [
  "Where is AI in biology overhyped—and underhyped?",
  "What has changed in pharma–AI dealmaking?",
  "Why might AlphaFold-style scaling fail for biology?",
  "What makes a trustworthy scientific eval?",
];

const PLAYLIST_URL =
  "https://www.youtube.com/playlist?list=PLl02HFGbrh1wB221w2FEYufzDjFbyn4w2";
const OFFICIAL_SITE_URL = "https://www.unlockscience.ai/";
const APP_SLUG = "conferences";

type AppRoute =
  | { kind: "landing" }
  | { kind: "talk"; sessionId: string };

type Navigate = (event: ReactMouseEvent<HTMLAnchorElement>, path: string) => void;

const appBasePath = () => {
  if (typeof window === "undefined") return "";
  return window.location.pathname.split("/").filter(Boolean)[0] === APP_SLUG
    ? `/${APP_SLUG}`
    : "";
};

const landingPath = () => appBasePath() || "/";
const talkPath = (sessionId: string) => `${appBasePath()}/talk/${sessionId}`;

const routeFromLocation = (): AppRoute => {
  if (typeof window === "undefined") return { kind: "landing" };
  const base = appBasePath();
  const relativePath = base
    ? window.location.pathname.slice(base.length)
    : window.location.pathname;
  const match = relativePath.match(/^\/talk\/([^/]+)\/?$/);
  return match
    ? { kind: "talk", sessionId: decodeURIComponent(match[1]) }
    : { kind: "landing" };
};

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function SendIcon() {
  return <span aria-hidden="true">↑</span>;
}

function TranscriptLinks({ session, onNavigate }: { session: Session; onNavigate: Navigate }) {
  const transcriptPath = talkPath(session.id);
  return (
    <div className="session-resources" aria-label={`${session.title} resources`}>
      <a href={session.videoUrl} target="_blank" rel="noreferrer">
        Watch video <span aria-hidden="true">↗</span>
      </a>
      <a
        className="fixed-transcript-link"
        href={transcriptPath}
        onClick={(event) => onNavigate(event, transcriptPath)}
      >
        Read transcript
        <small>Fixed + original</small>
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}

function DiffText({ tokens, kind }: { tokens: DiffToken[]; kind: "original" | "fixed" }) {
  return tokens.map((token, index) => (
    <Fragment key={`${token.text}-${index}`}>
      {token.changed ? <mark className={`diff-${kind}`}>{token.text}</mark> : token.text}
    </Fragment>
  ));
}

function TranscriptLine({
  row,
  showOriginal,
  videoUrl,
}: {
  row: ReturnType<typeof buildTranscriptRows>[number];
  showOriginal: boolean;
  videoUrl: string;
}) {
  const diff = row.changed ? diffTranscriptWords(row.original, row.fixed) : null;

  return (
    <article className={`reader-line ${row.changed ? "is-changed" : ""}`}>
      <a
        className="reader-timestamp"
        href={videoAtTimestamp(videoUrl, timestampToSeconds(row.timestamp))}
        target="_blank"
        rel="noreferrer"
        aria-label={`Watch video at ${row.timestamp}`}
      >
        {row.timestamp}
      </a>
      <div className="reader-copy">
        {showOriginal && row.changed && diff && (
          <div className="original-overlay">
            <span>Original</span>
            <p><DiffText tokens={diff.original} kind="original" /></p>
          </div>
        )}
        <div className={row.changed ? "fixed-line" : ""}>
          {row.changed && <span className="line-version">Fixed</span>}
          <p>
            {diff
              ? <DiffText tokens={diff.fixed} kind="fixed" />
              : row.fixed}
          </p>
        </div>
      </div>
    </article>
  );
}

function TranscriptView({ session, onNavigate }: { session: Session; onNavigate: Navigate }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const rows = useMemo(
    () => buildTranscriptRows(session.transcript, session.fixedTranscript),
    [session.transcript, session.fixedTranscript],
  );
  const changedLineCount = useMemo(() => rows.filter(({ changed }) => changed).length, [rows]);
  const [fixedTranscriptUrl, setFixedTranscriptUrl] = useState("#");
  const archivePath = landingPath();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${session.title} — UNLOCK 2026`;
    return () => {
      document.title = previousTitle;
    };
  }, [session.title]);

  useEffect(() => {
    const url = URL.createObjectURL(
      new Blob([session.fixedTranscript], { type: "text/plain;charset=utf-8" }),
    );
    setFixedTranscriptUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [session.fixedTranscript]);

  return (
    <div className="talk-shell">
      <header className="talk-topbar">
        <a
          className="wordmark"
          href={archivePath}
          onClick={(event) => onNavigate(event, archivePath)}
          aria-label="UNLOCK 2026 transcript archive"
        >
          UNLOCK<span>/26</span>
        </a>
        <a className="back-link" href={archivePath} onClick={(event) => onNavigate(event, archivePath)}>
          <span aria-hidden="true">←</span> Back to the archive
        </a>
      </header>

      <main className="talk-main">
        <section className="talk-hero" aria-labelledby="talk-title" data-number={session.number}>
          <div className="talk-hero-index">TALK {session.number} / {session.eyebrow}</div>
          <h1 id="talk-title">{session.title}</h1>
          <p>{session.description}</p>
          <div className="talk-facts" aria-label="Transcript details">
            <span><strong>{rows.at(-1)?.timestamp ?? "—"}</strong> runtime</span>
            <span><strong>{session.correctionCount}</strong> corrections</span>
            <span><strong>{changedLineCount}</strong> improved lines</span>
          </div>
          <div className="talk-actions">
            <a className="primary-talk-action" href={session.videoUrl} target="_blank" rel="noreferrer">
              Watch the talk <span aria-hidden="true">↗</span>
            </a>
            <a href={session.originalTranscriptUrl} download={session.transcriptFileName}>
              Download original <span aria-hidden="true">↓</span>
            </a>
            <a href={fixedTranscriptUrl} download={session.fixedTranscriptFileName}>
              Download fixed <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section className="transcript-reader" aria-labelledby="reader-title">
          <div className="reader-toolbar">
            <div>
              <span className="reader-eyebrow">READING VIEW</span>
              <h2 id="reader-title">Fixed transcript</h2>
            </div>
            <button
              className={`compare-toggle ${showOriginal ? "is-active" : ""}`}
              type="button"
              role="switch"
              aria-checked={showOriginal}
              onClick={() => setShowOriginal((current) => !current)}
            >
              <span className="toggle-track" aria-hidden="true"><i /></span>
              <span>
                Compare with original
                <small>{showOriginal ? "Original shown above fixed" : `${changedLineCount} changed lines`}</small>
              </span>
            </button>
          </div>

          <div className="reader-legend" aria-hidden="true">
            <span><i className="legend-fixed" /> Fixed text</span>
            {showOriginal && <span><i className="legend-original" /> Original automatic transcript</span>}
            <span>Click a timestamp to watch that moment</span>
          </div>

          <div className="reader-lines">
            {rows.map((row) => (
              <TranscriptLine
                key={row.id}
                row={row}
                showOriginal={showOriginal}
                videoUrl={session.videoUrl}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
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
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    );
  });
}

function LandingPage({ onNavigate }: { onNavigate: Navigate }) {
  const transcriptIndex = useMemo(() => buildTranscriptIndex(sessions), []);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messageId = useRef(0);
  const conversationEnd = useRef<HTMLDivElement>(null);

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
      const answer = await askConference(trimmed, sources, history);
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
          content:
            detail.includes("configured") || detail.includes("503")
              ? "The conference guide is not connected right now. The Cerebras API key needs to be configured in the deployment environment."
              : "I couldn’t reach the conference guide. Please try that question again in a moment.",
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => conversationEnd.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitQuestion(question);
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitQuestion(question);
    }
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="UNLOCK 2026 home">
          UNLOCK<span>/26</span>
        </a>
        <div className="topbar-meta">
          <span>AI × SCIENCE</span>
          <span className="live-dot">TRANSCRIPT ARCHIVE</span>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-kicker">
            <span>APRIL 22, 2026</span>
            <span>SAN FRANCISCO</span>
            <span>{sessions.length} SELECTED TRANSCRIPTS</span>
          </div>
          <h1 id="hero-title">
            The day AI met
            <br />
            <em>the wet lab.</em>
          </h1>
          <p className="hero-copy">
            A one-day summit on how AI is changing drug discovery and life sciences. Ask the
            highlight transcripts where the field is genuinely advancing—and where challenges remain.
          </p>
        </section>

        <section className="chat-section" aria-labelledby="chat-title">
          <div className="chat-heading">
            <div>
              <span className="section-index">01 / ASK THE ARCHIVE</span>
              <h2 id="chat-title">What do you want to unlock?</h2>
            </div>
            <p>
              Answers use relevant excerpts from the supplied transcripts and link back to the
              exact moments in each session.
            </p>
          </div>

          <div className="chat-frame">
            <div className="chat-toolbar">
              <span className="status-pill"><i /> GEMMA 4 · CEREBRAS</span>
              <span>{transcriptIndex.length} searchable excerpts</span>
            </div>

            <div className={`conversation ${messages.length ? "has-messages" : ""}`} aria-live="polite">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <span className="spark">✳</span>
                  <p>Start with a theme, a claim, a company, or a question you wish you’d asked in the room.</p>
                  <div className="suggestions" aria-label="Suggested questions">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => void submitQuestion(suggestion)}>
                        <span>{suggestion}</span>
                        <ArrowIcon />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
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
                ))
              )}
              {isLoading && (
                <div className="thinking" role="status">
                  <span /><span /><span /> Searching the conversations
                </div>
              )}
              <div ref={conversationEnd} />
            </div>

            <form className="composer" onSubmit={onSubmit}>
              <label htmlFor="conference-question">Ask about the conference</label>
              <div className="composer-row">
                <textarea
                  id="conference-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value.slice(0, 1_000))}
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

        <section className="sessions-section" id="sessions" aria-labelledby="sessions-title">
          <div className="sessions-heading">
            <span className="section-index">02 / SELECTED HIGHLIGHTS</span>
            <h2 id="sessions-title">{sessions.length} talks<br />worth replaying.</h2>
            <p>
              These selected sessions are currently searchable in the chat, with answers linked back
              to exact moments in each conversation. Every session includes both the original automatic
              transcript and a fixed version with reviewed terminology corrections.
            </p>
          </div>
          <div className="session-list">
            {sessions.map((session) => (
              <article className="session-row" key={session.id}>
                <span className="session-number">{session.number}</span>
                <div className="session-main">
                  <small>{session.eyebrow}</small>
                  <strong>{session.title}</strong>
                  <p>{session.description}</p>
                  <TranscriptLinks session={session} onNavigate={onNavigate} />
                </div>
              </article>
            ))}
            <a className="playlist-link" href={PLAYLIST_URL} target="_blank" rel="noreferrer">
              <span>Browse Every UNLOCK Video</span>
              <ArrowIcon />
            </a>
          </div>
        </section>
      </main>

      <footer>
        <a className="wordmark" href="#top">UNLOCK<span>/26</span></a>
        <p>April 22, 2026 · City View at Metreon · San Francisco</p>
        <div className="footer-links">
          <a href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer">Official site ↗</a>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => routeFromLocation());

  useEffect(() => {
    const updateRoute = () => {
      setRoute(routeFromLocation());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  const navigate: Navigate = (event, path) => {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return;

    event.preventDefault();
    window.history.pushState(null, "", path);
    setRoute(routeFromLocation());
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  if (route.kind === "talk") {
    const session = sessions.find(({ id }) => id === route.sessionId);
    if (session) return <TranscriptView session={session} onNavigate={navigate} />;
  }

  return <LandingPage onNavigate={navigate} />;
}
