# Lessons from Conferences 

A conference recap and transcript-grounded chat experience.

The eight transcripts are presented as selected highlights. The interface also links to the full UNLOCK 2026 YouTube playlist and the official event site.

## How the chat works

- The supplied `unlock-2026-*.txt` transcripts live in `app/src/data/transcripts` and are bundled.
- `app/src/lib/retrieval.ts` breaks them into timestamped excerpts and selects relevant passages in the browser.
- `app/src/lib/chat.ts` sends only those excerpts to `/api/cerebras/chat/completions` using `gemma-4-31b`.
- The shared Cloudflare middleware keeps `CEREBRAS_API_KEY` server-side and pins the allowed model.


# To develop or build

Run `npm run dev` or `npm run build` from the `app/` directory.

# To test

Run `npm test` from the `app/` directory.

# To add data

To add a session, add its transcript file and metadata entry in `app/src/data/transcripts.ts`.

The conference knowledge graph lives in `app/src/data/graph` and is exported through `app/src/data/graph/index.ts` for use by the app.

`app/src/data/glossary.json` contains canonical scientific and AI terminology from the transcripts.

`app/src/data/proposed-transcript-fixes.json` records traceable correction proposals without changing the original transcript text.

Each session has a dedicated reading view that starts with the fixed transcript and can overlay the original automatic transcript line by line. Both versions remain downloadable.
