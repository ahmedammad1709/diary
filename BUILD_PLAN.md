# The Living Ink Diary - Module Build Plan

This project should feel like a cursed object, not a chatbot. The first milestone is a polished 30-second demo: open the diary, write on parchment, let the ink sink, and watch the diary answer in cursed handwriting.

## Module 1 - Project Foundation

- React app with Vite.
- Express API server for Gemini requests.
- `.env`-based Gemini configuration.
- Local dev command that runs client and server together.

## Module 2 - Diary Opening Experience

- Closed dark diary on first screen.
- Horizontal cover-opening animation.
- Transition into old parchment diary spread.
- No chatbot UI patterns.

## Module 3 - Living Page Input

- Large parchment writing area.
- Text input for the main message.
- Canvas drawing layer for mouse, touch, and stylus marks.
- Write/draw mode switch so typing and drawing do not fight each other.
- Clear marks action.

## Module 4 - Ink Ritual

- Button copy: `Let the ink sink`.
- User text and drawn marks darken, blur, spread, and fade.
- Magical status lines while the diary reads.
- No loading spinner.

## Module 5 - Gemini Diary Mind

- Server endpoint: `POST /api/diary-reply`.
- Reads `GEMINI_API_KEY` from `.env`.
- Uses `geminipersonality.md` as the diary personality source.
- Sends recent local memory plus the latest user message.
- Expects strict JSON: `reply`, `mood`, and `effect`.

## Module 6 - Memory

- Store conversation history in `localStorage`.
- Send recent history to the server with every new inscription.
- Reset button clears all saved memory through a wand, sparkle, and diary-reopening ritual.
- Keep memory subtle and atmospheric, not like a chat transcript.

## Module 7 - Cursed Reply Rendering

- Diary reply writes itself letter by letter.
- Mood controls atmosphere.
- Effect controls animation: fade, bleed, scratch, shake, glow, mist, or whisper.
- Replies stay short, cinematic, and unsettling.

## Module 8 - Polish Pass

- Better parchment texture and ink edges.
- Ambient sound toggle.
- Stronger mobile layout.
- Optional generated image textures for the cover and page.
- Optional Gemini image input for analyzing the drawing layer.

## Current MVP Scope

The first build includes Modules 1 through 7. Module 8 is reserved for the polish round after we test the core loop.
