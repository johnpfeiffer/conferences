import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { eventPath } from "../controllers/routes";
import { timestampToSeconds, videoAtTimestamp } from "../lib/retrieval";
import { buildTranscriptRows, diffTranscriptWords, type DiffToken } from "../lib/transcriptView";
import type { Event, Session } from "../models/event";
import EventNavigation, { internalLinkHandler, type Navigate } from "./navigation";

function DiffText({ tokens, kind }: { tokens: DiffToken[]; kind: "original" | "fixed" }) {
  return tokens.map((token, index) => token.changed ? (
    <Box
      component="mark"
      key={`${token.text}-${index}`}
      sx={{
        color: "inherit",
        bgcolor: kind === "fixed" ? "success.light" : "error.light",
        textDecoration: kind === "original" ? "line-through" : "none",
      }}
    >
      {token.text}
    </Box>
  ) : <Fragment key={`${token.text}-${index}`}>{token.text}</Fragment>);
}

export default function TranscriptView({
  event,
  session,
  onNavigate,
}: {
  event: Event;
  session: Session;
  onNavigate: Navigate;
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [fixedTranscriptUrl, setFixedTranscriptUrl] = useState(session.fixedTranscriptUrl ?? "#");
  const rows = useMemo(
    () => buildTranscriptRows(session.transcript, session.fixedTranscript),
    [session.transcript, session.fixedTranscript],
  );
  const changedLineCount = useMemo(() => rows.filter(({ changed }) => changed).length, [rows]);
  const backPath = eventPath(event.id);

  useEffect(() => {
    document.title = `${session.title} — ${event.name}`;
  }, [event.name, session.title]);

  useEffect(() => {
    if (session.fixedTranscriptUrl) {
      setFixedTranscriptUrl(session.fixedTranscriptUrl);
      return;
    }
    const url = URL.createObjectURL(new Blob([session.fixedTranscript], { type: "text/plain;charset=utf-8" }));
    setFixedTranscriptUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [session.fixedTranscript, session.fixedTranscriptUrl]);

  return (
    <Box>
      <EventNavigation event={event} onNavigate={onNavigate} />
      <Container component="main" maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
        <Button
          component="a"
          href={backPath}
          onClick={internalLinkHandler(onNavigate, backPath)}
          color={event.accent}
          sx={{ mb: 3 }}
        >
          ← Back to {event.name}
        </Button>

        <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, mb: 4 }}>
          <Stack spacing={3}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
              <Chip label={`Session ${session.number}`} color={event.accent} />
              <Chip label={session.eyebrow} variant="outlined" />
            </Stack>
            <Typography component="h1" variant="h2" sx={{ fontSize: { xs: "2.5rem", md: "3.75rem" }, letterSpacing: "-0.04em" }}>
              {session.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {session.description}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button component="a" variant="contained" color={event.accent} href={session.videoUrl} target="_blank" rel="noreferrer">
                Watch video ↗
              </Button>
              <Button component="a" href={session.originalTranscriptUrl} download={session.transcriptFileName}>
                Original transcript ↓
              </Button>
              <Button component="a" href={fixedTranscriptUrl} download={session.fixedTranscriptFileName}>
                Fixed transcript ↓
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
              p: { xs: 2.5, md: 3 },
              position: "sticky",
              top: { xs: 72, sm: 80 },
              bgcolor: "background.paper",
              zIndex: 1,
            }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">Reading view</Typography>
              <Typography component="h2" variant="h5">Fixed transcript</Typography>
              <Typography variant="body2" color="text.secondary">
                {session.correctionCount} corrections · {changedLineCount} changed lines · timestamps open the video
              </Typography>
            </Box>
            <FormControlLabel
              control={(
                <Switch
                  color={event.accent}
                  checked={showOriginal}
                  onChange={(changeEvent) => setShowOriginal(changeEvent.target.checked)}
                  slotProps={{ input: { "aria-label": "Compare with original" } }}
                />
              )}
              label="Compare with original"
            />
          </Stack>
          <Divider />
          <Box>
            {rows.map((row) => {
              const diff = row.changed ? diffTranscriptWords(row.original, row.fixed) : null;
              return (
                <Box
                  component="article"
                  key={row.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "56px minmax(0, 1fr)", sm: "76px minmax(0, 1fr)" },
                    gap: 2,
                    p: { xs: 2, sm: 2.5 },
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: row.changed ? "action.hover" : "background.paper",
                  }}
                >
                  <Link
                    href={videoAtTimestamp(session.videoUrl, timestampToSeconds(row.timestamp))}
                    target="_blank"
                    rel="noreferrer"
                    variant="caption"
                    aria-label={`Watch video at ${row.timestamp}`}
                    sx={{ pt: 0.5 }}
                  >
                    {row.timestamp}
                  </Link>
                  <Stack spacing={showOriginal && row.changed ? 1.5 : 0}>
                    {showOriginal && row.changed && diff && (
                      <Box sx={{ p: 1.5, bgcolor: "error.light", border: 1, borderColor: "error.main" }}>
                        <Typography variant="overline" color="error">Original</Typography>
                        <Typography sx={{ lineHeight: 1.75 }}>
                          <DiffText tokens={diff.original} kind="original" />
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      {row.changed && <Typography variant="overline" color="success.main">Fixed</Typography>}
                      <Typography sx={{ lineHeight: 1.75 }}>
                        {diff ? <DiffText tokens={diff.fixed} kind="fixed" /> : row.fixed}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
