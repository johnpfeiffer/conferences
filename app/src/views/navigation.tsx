import type { MouseEvent } from "react";
import {
  AppBar,
  Box,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { conferenceOptionLabel, eventPath } from "../controllers/routes";
import { events } from "../data/events";
import type { Event } from "../models/event";

export type Navigate = (path: string) => void;

export function internalLinkHandler(onNavigate: Navigate, path: string) {
  return (event: MouseEvent<HTMLElement>) => {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return;

    event.preventDefault();
    onNavigate(path);
  };
}

export default function EventNavigation({ event, onNavigate }: { event: Event; onNavigate: Navigate }) {
  return (
    <AppBar
      component="nav"
      aria-label="Conference navigation"
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Container maxWidth="lg" disableGutters>
        <Toolbar
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: 1.5, sm: 2 },
            minHeight: { xs: 72, sm: 80 },
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 0 },
          }}
        >
          <Typography
            component="a"
            href={eventPath(event.id)}
            onClick={internalLinkHandler(onNavigate, eventPath(event.id))}
            variant="subtitle1"
            color="text.primary"
            sx={{ color: "text.primary", fontWeight: 800, letterSpacing: "-0.02em", textDecoration: "none", flexGrow: { sm: 1 } }}
          >
            {event.mark}
          </Typography>
          <Stack spacing={0.5} sx={{ width: { xs: "100%", sm: "auto" }, alignItems: "stretch" }}>
            <Typography
              component="label"
              htmlFor="conference-selector"
              variant="caption"
              sx={{ fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              Choose a conference
            </Typography>
            <Box
              component="select"
              id="conference-selector"
              aria-label="Conference selector"
              value={event.id}
              onChange={(changeEvent) => onNavigate(eventPath(changeEvent.target.value))}
              sx={{
                width: { xs: "100%", sm: 360 },
                height: 46,
                px: 1.5,
                border: 1.5,
                borderColor: "currentColor",
                borderRadius: 1,
                color: "text.primary",
                bgcolor: "background.paper",
                fontSize: { xs: "0.72rem", sm: "0.84rem" },
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {events.map((option) => (
                <option key={option.id} value={option.id}>{conferenceOptionLabel(option)}</option>
              ))}
            </Box>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
