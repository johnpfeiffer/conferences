
# Goal
The app now supports multiple "Events" - it could be a conference or a podcast interview.

The underlying "grounded transcript" approach is critical.

The creation of fixed transcripts is a separate workflow not in scope here.

# Milestone 1

Each event has a landing page, a source, and one or more sessions (each with a fixed transcript).

The existing app right now defaults to the UNLOCK one (the root of the app "conferences").

The layout will be: app/src/data/ 

- Event name should just be UNLOCK 2026
- Event type should be BIOTECH
- "unlock2026" , https://www.unlockscience.ai/

- Event name should be WorkOS Agent Night
- Event type should be AI
- 2026-08-12-workos-agent-night , https://workos.com/blog/agent-night-panel-recap
- this event only has a single session


- Event name should be AI Engineer World's Fair
- Event type should be AI
- aiewf/ , https://ai.engineer/worldsfair/2026
- - currently only a single session (but more to come)
- - - aie-2026-uber-eats-closed-loop-evals/

## Details

The knowledge graphs should actually span all events - these are facts of the world.
The glossary is per Event. These tend to be domain or event specific.

# Design

Build the landing pages to resemble the style of the source (as an homage). The work done on the existing app for UNLOCK is a perfect example.


