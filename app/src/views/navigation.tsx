import type { MouseEvent } from "react";
import {
  AppBar,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { eventPath } from "../controllers/routes";
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
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Container maxWidth="lg" disableGutters>
        <Toolbar sx={{ gap: 2, minHeight: { xs: 72, sm: 80 }, px: { xs: 2, sm: 3 } }}>
          <Typography
            component="a"
            href={eventPath(event.id)}
            onClick={internalLinkHandler(onNavigate, eventPath(event.id))}
            variant="subtitle1"
            color="text.primary"
            sx={{ fontWeight: 800, letterSpacing: "-0.02em", textDecoration: "none", flexGrow: 1 }}
          >
            {event.mark}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <TextField
              select
              size="small"
              label="Event"
              value={event.id}
              onChange={(changeEvent) => onNavigate(eventPath(changeEvent.target.value))}
              slotProps={{ select: { MenuProps: { disableScrollLock: true } } }}
              sx={{ minWidth: { xs: 140, sm: 220 } }}
            >
              {events.map((option) => (
                <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
              ))}
            </TextField>
            <Button
              component="a"
              href={event.sourceUrl}
              target="_blank"
              rel="noreferrer"
              size="small"
              color={event.accent}
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              Source ↗
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
