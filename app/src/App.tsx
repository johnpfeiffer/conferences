import { useEffect, useState } from "react";
import { Alert, Box, Button, Container, CssBaseline, Stack, Typography } from "@mui/material";
import { DEFAULT_EVENT_ID, getEvent } from "./data/events";
import { eventPath, parseAppRoute } from "./controllers/routes";
import EventLandingPage from "./views/EventLandingPage";
import TranscriptView from "./views/TranscriptView";
import UnlockLandingPage from "./views/UnlockLandingPage";

export default function App() {
  const [route, setRoute] = useState(() => parseAppRoute(window.location.pathname));

  useEffect(() => {
    const updateRoute = () => {
      setRoute(parseAppRoute(window.location.pathname));
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState(null, "", path);
    setRoute(parseAppRoute(path));
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const event = route.kind === "not-found" ? undefined : getEvent(route.eventId);

  if (event && route.kind === "session") {
    const session = event.sessions.find(({ id }) => id === route.sessionId);
    if (session) {
      return (
        <>
          <CssBaseline />
          <TranscriptView
            key={`${event.id}:${session.id}`}
            event={event}
            session={session}
            onNavigate={navigate}
          />
        </>
      );
    }
  }

  if (event && route.kind === "event") {
    return (
      <>
        <CssBaseline />
        {event.id === DEFAULT_EVENT_ID ? (
          <UnlockLandingPage key={event.id} event={event} onNavigate={navigate} />
        ) : (
          <EventLandingPage key={event.id} event={event} onNavigate={navigate} />
        )}
      </>
    );
  }

  return (
    <>
      <CssBaseline />
      <Container component="main" maxWidth="sm" sx={{ py: 12 }}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h3">Archive page not found</Typography>
          <Alert severity="info">
            This route does not match an event or transcript in the archive.
          </Alert>
          <Box>
            <Button variant="contained" href={eventPath("unlock2026")} onClick={(clickEvent) => {
              clickEvent.preventDefault();
              navigate(eventPath("unlock2026"));
            }}>
              Open UNLOCK 2026
            </Button>
          </Box>
        </Stack>
      </Container>
    </>
  );
}
