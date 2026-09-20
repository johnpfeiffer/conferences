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
} from "@mui/material";
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

const heroBackground = {
  primary: "primary.light",
  secondary: "secondary.light",
  success: "success.light",
  warning: "warning.light",
} as const;

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

  return (
    <Box id="top">
      <EventNavigation event={event} onNavigate={onNavigate} />
      <Box
        component="header"
        sx={{ bgcolor: heroBackground[event.accent], borderBottom: 1, borderColor: "divider" }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 7, md: 12 } }}>
          <Stack spacing={4}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
              <Chip label={event.type} color={event.accent} />
              <Chip label={event.date} variant="outlined" />
              <Chip label={event.location} variant="outlined" />
            </Stack>
            <Box sx={{ maxWidth: 920 }}>
              <Typography variant="overline" color="text.secondary">{event.eyebrow}</Typography>
              <Typography
                component="h1"
                variant="h1"
                sx={{ mt: 1, fontSize: { xs: "3.1rem", sm: "4.6rem", md: "6rem" }, letterSpacing: "-0.055em" }}
              >
                {event.headline}
              </Typography>
            </Box>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.6 }}>
              {event.description}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
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
  );
}
