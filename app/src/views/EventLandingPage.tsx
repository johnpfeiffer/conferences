import {
  type FormEvent,
  Fragment,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
  createTheme,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { sessionPath } from "../controllers/routes";
import { askConference, type ConversationTurn } from "../lib/chat";
import {
  buildTranscriptIndex,
  retrieveSources,
  videoAtTimestamp,
  type TranscriptChunk,
} from "../lib/retrieval";
import type { Event } from "../models/event";
import EventNavigation, { internalLinkHandler, type Navigate } from "./navigation";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: TranscriptChunk[];
  error?: boolean;
};

const WORKOS_EVENT_ID = "2026-08-12-workos-agent-night";
const AIEWF_EVENT_ID = "aiewf";
const genericTheme = createTheme();

const workosTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#625cf6", light: "#eceaff", dark: "#453fd0" },
    secondary: { main: "#4f9bea" },
    background: { default: "#fbfbff", paper: "#ffffff" },
    text: { primary: "#202b33", secondary: "#6f7692" },
    divider: "rgba(63, 69, 99, 0.18)",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    MuiButton: { styleOverrides: { root: { fontWeight: 700, textTransform: "none" } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
  },
});

const aiewfTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ffffff", contrastText: "#050505" },
    warning: { main: "#f3d36b", light: "#ffe69a", dark: "#b99b3c", contrastText: "#080807" },
    background: { default: "#050505", paper: "#0d0d0c" },
    text: { primary: "#f8f8f6", secondary: "#aaa9a4" },
    divider: "rgba(255, 255, 255, 0.16)",
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  components: {
    MuiButton: { styleOverrides: { root: { fontWeight: 800 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiCard: { styleOverrides: { root: { backgroundImage: "none" } } },
  },
});

function WorkOSHero({ event }: { event: Event }) {
  const [headlineLead, headlineAccent = ""] = event.headline.split("—");

  return (
    <Box
      component="header"
      sx={{
        position: "relative",
        overflow: "hidden",
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "#fff",
        backgroundImage: "radial-gradient(circle at 79% 48%, rgba(86, 134, 255, 0.15), transparent 29%), radial-gradient(circle at 68% 70%, rgba(137, 91, 255, 0.12), transparent 27%)",
      }}
    >
      <Container maxWidth="lg" sx={{ minHeight: { md: 650 }, py: { xs: 8, md: 11 }, display: "grid", alignItems: "center" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.08fr 0.92fr" }, gap: { xs: 7, md: 5 }, alignItems: "center" }}>
          <Stack spacing={4} sx={{ position: "relative", zIndex: 1 }}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
              <Chip label={event.type} color="primary" />
              <Chip label={event.date} variant="outlined" />
              <Chip label={event.location} variant="outlined" />
            </Stack>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: "0.11em" }}>
                {event.eyebrow}
              </Typography>
              <Typography
                component="h1"
                aria-label={event.headline}
                sx={{ mt: 2, fontSize: { xs: "2.775rem", sm: "4.05rem", md: "4.95rem" }, fontWeight: 650, lineHeight: 0.92, letterSpacing: "-0.075em" }}
              >
                <Box component="span" sx={{ display: "block" }}>{headlineLead.trim()} — </Box>
                <Box
                  component="span"
                  sx={{
                    display: "block",
                    color: "transparent",
                    background: "linear-gradient(94deg, #8d72f4 3%, #4d9eea 92%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                  }}
                >
                  {headlineAccent.trim()}
                </Box>
              </Typography>
            </Box>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 690, lineHeight: 1.6 }}>
              {event.description}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
              <Button component="a" variant="contained" href="#sessions" size="large" sx={{ px: 3.5, borderRadius: 999 }}>
                Browse the session
              </Button>
              <Button component="a" href={event.sourceUrl} target="_blank" rel="noreferrer" size="large">
                {event.sourceLabel} ↗
              </Button>
            </Stack>
          </Stack>

          <Box
            aria-hidden="true"
            sx={{
              position: "relative",
              minHeight: { xs: 360, md: 500 },
              borderRadius: 6,
              backgroundImage: "repeating-linear-gradient(90deg, rgba(94, 123, 255, 0.3) 0 4px, transparent 4px 12px)",
              maskImage: "linear-gradient(90deg, transparent, black 18%, black 78%, transparent)",
            }}
          >
            {[
              ["MODEL ACCESS", "READY", "8%", 0.34],
              ["AGENT HARNESS", "ENABLED", "24%", 1],
              ["CONTEXT GRAPH", "CONNECTED", "43%", 1],
              ["LONG-TERM MEMORY", "INDEXED", "62%", 0.7],
            ].map(([label, state, top, opacity]) => (
              <Paper
                key={label}
                elevation={5}
                sx={{
                  position: "absolute",
                  top,
                  right: 0,
                  width: { xs: "88%", md: "96%" },
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: { xs: 2, md: 2.5 },
                  opacity,
                  border: 1,
                  borderColor: "rgba(83, 91, 132, 0.12)",
                  borderRadius: 3,
                  boxShadow: "0 16px 38px rgba(72, 76, 113, 0.16)",
                }}
              >
                <Box sx={{ width: 54, height: 30, p: "3px", borderRadius: 999, bgcolor: label === "MODEL ACCESS" ? "#d8dbe6" : "#26343b" }}>
                  <Box sx={{ width: 24, height: 24, ml: label === "MODEL ACCESS" ? 0 : 3, borderRadius: "50%", bgcolor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
                </Box>
                <Typography sx={{ flexGrow: 1, fontWeight: 800 }}>{label}</Typography>
                <Chip label={state} size="small" color="primary" variant="outlined" />
              </Paper>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function AiewfHero({ event }: { event: Event }) {
  return (
    <Box
      component="header"
      sx={{
        position: "relative",
        overflow: "hidden",
        borderBottom: 1,
        borderColor: "divider",
        backgroundColor: "#050505",
        backgroundImage: "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px), radial-gradient(ellipse at 50% 78%, rgba(214, 179, 74, .2), transparent 48%)",
        backgroundSize: "128px 128px, 128px 128px, 100% 100%",
      }}
    >
      <Container maxWidth="lg" sx={{ minHeight: { md: 700 }, py: { xs: 8, md: 10 }, display: "grid", placeItems: "center", textAlign: "center" }}>
        <Stack spacing={4} sx={{ position: "relative", zIndex: 1, alignItems: "center" }}>
          <Box sx={{ display: "inline-grid", border: 2, borderColor: "text.primary", px: 2.5, py: 1, lineHeight: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>AI Engineer</Typography>
            <Typography sx={{ fontSize: { xs: "1.6rem", sm: "2.2rem" }, fontWeight: 900, letterSpacing: "-0.05em" }}>World&apos;s Fair</Typography>
          </Box>
          <Typography sx={{ color: "warning.main", fontWeight: 800, letterSpacing: { xs: "0.08em", sm: "0.16em" }, textTransform: "uppercase" }}>
            {event.date} • {event.location}
          </Typography>
          <Typography
            component="h1"
            aria-label={event.headline}
            sx={{ maxWidth: 1120, fontSize: { xs: "2.625rem", sm: "4.2rem", md: "5.55rem" }, fontWeight: 900, lineHeight: 0.92, letterSpacing: "-0.065em" }}
          >
            <Box component="span" sx={{ display: "block" }}>The engineering behind </Box>
            <Box component="span" sx={{ display: "block", color: "warning.main", textShadow: "0 0 30px rgba(243, 211, 107, .2)" }}>useful agents.</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 850, lineHeight: 1.6 }}>
            {event.description}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component="a" variant="contained" color="primary" href="#sessions" size="large" sx={{ px: 4 }}>
              Browse the session
            </Button>
            <Button component="a" variant="outlined" color="warning" href={event.sourceUrl} target="_blank" rel="noreferrer" size="large" sx={{ px: 4 }}>
              {event.sourceLabel} ↗
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function GenericHero({ event }: { event: Event }) {
  return (
    <Box component="header" sx={{ bgcolor: `${event.accent}.light`, borderBottom: 1, borderColor: "divider" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 12 } }}>
        <Stack spacing={4}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
            <Chip label={event.type} color={event.accent} />
            <Chip label={event.date} variant="outlined" />
            <Chip label={event.location} variant="outlined" />
          </Stack>
          <Box sx={{ maxWidth: 920 }}>
            <Typography variant="overline" color="text.secondary">{event.eyebrow}</Typography>
            <Typography component="h1" variant="h1" sx={{ mt: 1, fontSize: { xs: "3.1rem", sm: "4.6rem", md: "6rem" }, letterSpacing: "-0.055em" }}>
              {event.headline}
            </Typography>
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.6 }}>
            {event.description}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button component="a" variant="contained" color={event.accent} href="#sessions" size="large">
              Browse {event.sessions.length === 1 ? "the session" : `${event.sessions.length} sessions`}
            </Button>
            <Button component="a" href={event.sourceUrl} target="_blank" rel="noreferrer" size="large">
              {event.sourceLabel} ↗
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function EventHero({ event }: { event: Event }) {
  if (event.id === WORKOS_EVENT_ID) return <WorkOSHero event={event} />;
  if (event.id === AIEWF_EVENT_ID) return <AiewfHero event={event} />;
  return <GenericHero event={event} />;
}

function AnswerText({ text, messageId }: { text: string; messageId: number }) {
  return text.split(/(\[\d+\])/g).map((part, index) => {
    const citation = part.match(/^\[(\d+)\]$/);
    return citation ? (
      <Link href={`#source-${messageId}-${citation[1]}`} key={`${part}-${index}`}>
        {part}
      </Link>
    ) : <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

export default function EventLandingPage({ event, onNavigate }: { event: Event; onNavigate: Navigate }) {
  const transcriptIndex = useMemo(() => buildTranscriptIndex(event.sessions), [event.sessions]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllTerms, setShowAllTerms] = useState(false);
  const messageId = useRef(0);
  const conversationEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `${event.name} — Grounded transcript archive`;
  }, [event.name]);

  const submitQuestion = async (nextQuestion: string) => {
    const trimmed = nextQuestion.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { id: ++messageId.current, role: "user", content: trimmed };
    const sources = retrieveSources(trimmed, transcriptIndex);
    const history: ConversationTurn[] = messages
      .filter((message) => !message.error)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      const answer = await askConference(trimmed, sources, history, undefined, event.name);
      setMessages((current) => [
        ...current,
        { id: ++messageId.current, role: "assistant", content: answer, sources },
      ]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setMessages((current) => [
        ...current,
        {
          id: ++messageId.current,
          role: "assistant",
          content: detail.includes("configured") || detail.includes("503")
            ? "The archive guide is not connected right now. Its server-side LLM configuration is unavailable."
            : "I couldn’t reach the archive guide. Please try again in a moment.",
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

  const onComposerKeyDown = (keyEvent: KeyboardEvent<HTMLDivElement>) => {
    if (keyEvent.key === "Enter" && !keyEvent.shiftKey) {
      keyEvent.preventDefault();
      void submitQuestion(question);
    }
  };

  const visibleTerms = showAllTerms ? event.glossary : event.glossary.slice(0, 12);
  const theme = event.id === WORKOS_EVENT_ID
    ? workosTheme
    : event.id === AIEWF_EVENT_ID ? aiewfTheme : genericTheme;

  return (
    <ThemeProvider theme={theme}>
      <Box id="top" sx={{ minHeight: "100vh", color: "text.primary", bgcolor: "background.default" }}>
        <EventNavigation event={event} onNavigate={onNavigate} />
        <EventHero event={event} />

        <Container component="main" maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={{ xs: 8, md: 12 }}>
          <Box component="section" aria-labelledby="ask-title">
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="overline" color="text.secondary">Grounded Q&amp;A</Typography>
              <Typography id="ask-title" component="h2" variant="h3">Ask this event</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
                Answers use only this event’s transcript excerpts. Every source card links to the exact video moment.
              </Typography>
            </Stack>

            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.5 }}>
                <Chip label="Transcript grounded" color={event.accent} size="small" variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  {transcriptIndex.length} searchable excerpts
                </Typography>
              </Stack>
              <Divider />
              {isLoading && <LinearProgress color={event.accent} aria-label="Searching the transcripts" />}
              <Stack spacing={0} aria-live="polite">
                {messages.length === 0 ? (
                  <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                    <Typography sx={{ mb: 2 }}>Start with a theme, claim, company, or practical question.</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1 }}>
                      {event.suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outlined"
                          color={event.accent}
                          onClick={() => void submitQuestion(suggestion)}
                          sx={{ justifyContent: "space-between", textAlign: "left", minHeight: 54 }}
                        >
                          {suggestion} <span aria-hidden="true">→</span>
                        </Button>
                      ))}
                    </Box>
                  </Box>
                ) : messages.map((message) => (
                  <Box
                    component="article"
                    key={message.id}
                    sx={{ p: { xs: 2.5, sm: 4 }, bgcolor: message.role === "user" ? "action.hover" : "background.paper", borderTop: 1, borderColor: "divider" }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      {message.role === "user" ? "You" : `${event.name} archive`}
                    </Typography>
                    {message.error ? (
                      <Alert severity="error" sx={{ mt: 1 }}>{message.content}</Alert>
                    ) : (
                      <Typography sx={{ mt: 1, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                        <AnswerText text={message.content} messageId={message.id} />
                      </Typography>
                    )}
                    {message.sources && (
                      <Stack spacing={1} sx={{ mt: 3 }} aria-label="Sources used in this answer">
                        <Typography variant="overline" color="text.secondary">Source moments</Typography>
                        {message.sources.map((source, index) => (
                          <Card
                            component="a"
                            href={videoAtTimestamp(source.videoUrl, source.seconds)}
                            target="_blank"
                            rel="noreferrer"
                            variant="outlined"
                            id={`source-${message.id}-${index + 1}`}
                            key={source.id}
                            sx={{ color: "inherit", textDecoration: "none" }}
                          >
                            <CardContent sx={{ display: "flex", gap: 2, alignItems: "baseline", "&:last-child": { pb: 2 } }}>
                              <Typography color={`${event.accent}.main`}>[{index + 1}]</Typography>
                              <Box>
                                <Typography variant="subtitle2">{source.sessionTitle} · {source.timestamp}</Typography>
                                <Typography variant="body2" color="text.secondary">{source.text.slice(0, 190)}…</Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Box>
                ))}
                <div ref={conversationEnd} />
              </Stack>
              <Divider />
              <Box component="form" onSubmit={onSubmit} sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: "stretch" }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label={`Ask about ${event.name}`}
                    value={question}
                    onChange={(changeEvent) => setQuestion(changeEvent.target.value.slice(0, 1_000))}
                    onKeyDown={onComposerKeyDown}
                    disabled={isLoading}
                    helperText={`${question.length}/1000 · Enter to send · Shift+Enter for a new line`}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color={event.accent}
                    disabled={!question.trim() || isLoading}
                    sx={{ minWidth: 112 }}
                  >
                    Ask
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Box>

          <Box component="section" id="sessions" aria-labelledby="sessions-title" sx={{ scrollMarginTop: 90 }}>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="overline" color="text.secondary">Sessions</Typography>
              <Typography id="sessions-title" component="h2" variant="h3">
                {event.sessions.length === 1 ? "One grounded session" : `${event.sessions.length} selected highlights`}
              </Typography>
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: event.sessions.length > 1 ? "1fr 1fr" : "minmax(0, 760px)" }, gap: 2 }}>
              {event.sessions.map((session) => {
                const path = sessionPath(event.id, session.id);
                return (
                  <Card variant="outlined" key={session.id} sx={{ display: "flex", flexDirection: "column" }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Chip label={session.number} color={event.accent} size="small" />
                        <Typography variant="overline" color="text.secondary">{session.eyebrow}</Typography>
                      </Stack>
                      <Typography component="h3" variant="h5" gutterBottom>{session.title}</Typography>
                      <Typography color="text.secondary">{session.description}</Typography>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button component="a" href={path} onClick={internalLinkHandler(onNavigate, path)} color={event.accent}>
                        Read fixed + original
                      </Button>
                      <Button component="a" href={session.videoUrl} target="_blank" rel="noreferrer">
                        Video ↗
                      </Button>
                    </CardActions>
                  </Card>
                );
              })}
            </Box>
            {event.collectionUrl && (
              <Button component="a" href={event.collectionUrl} target="_blank" rel="noreferrer" sx={{ mt: 2 }}>
                {event.collectionLabel} ↗
              </Button>
            )}
          </Box>

          <Box component="section" aria-labelledby="glossary-title">
            <Accordion variant="outlined">
              <AccordionSummary expandIcon={<span aria-hidden="true">＋</span>}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Event glossary</Typography>
                  <Typography id="glossary-title" component="h2" variant="h5">
                    {event.glossary.length} people, organizations, and terms
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack divider={<Divider flexItem />}>
                  {visibleTerms.map((term) => (
                    <Box key={`${term.category}-${term.term}`} sx={{ py: 2 }}>
                      <Typography variant="subtitle1">{term.term}</Typography>
                      <Typography variant="caption" color="text.secondary">{term.category}</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{term.definition}</Typography>
                    </Box>
                  ))}
                </Stack>
                {event.glossary.length > 12 && (
                  <Button onClick={() => setShowAllTerms((current) => !current)} sx={{ mt: 2 }}>
                    {showAllTerms ? "Show fewer terms" : `Show all ${event.glossary.length} terms`}
                  </Button>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        </Stack>
        </Container>

        <Divider />
        <Container component="footer" maxWidth="lg" sx={{ py: 5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", gap: 2 }}>
            <Box>
              <Typography variant="subtitle2">{event.name}</Typography>
              <Typography variant="body2" color="text.secondary">{event.date} · {event.location}</Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Link href={event.sourceUrl} target="_blank" rel="noreferrer">Source ↗</Link>
              <Link href="#top">Back to top ↑</Link>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
