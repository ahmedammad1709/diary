# The Living Ink Diary

A React + Gemini web app that behaves like a cursed magical diary instead of a normal chatbot.

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` in the project root:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash
   PORT=8787
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open:

   ```text
   http://localhost:5173/
   ```

## Project Shape

- `src/App.jsx` - main diary experience and interaction state.
- `src/components/InkCanvas.jsx` - mouse, touch, and stylus drawing layer.
- `src/modules/diaryApi.js` - frontend API client.
- `src/modules/memory.js` - localStorage memory helpers.
- `src/hooks/useTypewriter.js` - cursed reply writing effect.
- `server/server.js` - Express endpoint that talks to Gemini with the private `.env` key.
- `geminipersonality.md` - diary character rules used by the server.
- `BUILD_PLAN.md` - module-by-module roadmap.

## Current MVP

The first version includes the closed diary opening, parchment spread, typing, drawing, ink-sinking ritual, local memory, Gemini endpoint, structured mood/effect responses, and animated diary replies.

## Vercel Deployment

This project supports Vercel:

- Frontend: Vite builds to `dist`.
- Production API: Vercel Functions live in `api/`.
- Local API: Express still runs from `server/server.js`.
- Shared Gemini logic: `server/diaryCore.js`.

Set these Vercel Environment Variables before deploying:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```

`vercel.json` includes `geminipersonality.md` in the serverless function bundle so the deployed diary keeps the same personality as local development.
