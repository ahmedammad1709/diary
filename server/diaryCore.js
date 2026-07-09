import fs from 'node:fs';
import path from 'node:path';

export const VALID_MOODS = new Set([
  'sinister',
  'curious',
  'mocking',
  'whispering',
  'angry',
  'calm',
  'ominous'
]);

export const VALID_EFFECTS = new Set([
  'fade',
  'bleed',
  'scratch',
  'shake',
  'glow',
  'mist',
  'whisper'
]);

export class DiaryHttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function getConfiguredModel() {
  return process.env.GEMINI_MODEL || 'gemini-3.5-flash';
}

export async function createDiaryReply(body) {
  const apiKey = process.env.GEMINI_API_KEY;
  const message = normalizeText(body?.message, 2400);
  const history = sanitizeHistory(body?.history);

  if (!message) {
    throw new DiaryHttpError(400, 'The diary page is empty.');
  }

  if (!apiKey) {
    throw new DiaryHttpError(
      500,
      'GEMINI_API_KEY is missing. Add it to .env locally or to Vercel Environment Variables.'
    );
  }

  return askGemini({ apiKey, message, history });
}

async function askGemini({ apiKey, message, history }) {
  const model = getConfiguredModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: buildSystemInstruction() }]
    },
    contents: buildContents(message, history),
    generationConfig: {
      temperature: 0.9,
      topP: 0.92,
      maxOutputTokens: 900,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          reply: { type: 'STRING' },
          mood: {
            type: 'STRING',
            enum: [...VALID_MOODS]
          },
          effect: {
            type: 'STRING',
            enum: [...VALID_EFFECTS]
          }
        },
        required: ['reply', 'mood', 'effect'],
        propertyOrdering: ['reply', 'mood', 'effect']
      }
    }
  };

  const geminiResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await geminiResponse.json();

  if (!geminiResponse.ok) {
    throw new Error(JSON.stringify(data));
  }

  const candidate = data?.candidates?.[0];
  const rawText = candidate?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!rawText) {
    throw new Error(
      `Gemini returned an empty response. Finish reason: ${
        candidate?.finishReason || 'unknown'
      }. Prompt feedback: ${JSON.stringify(data?.promptFeedback || {})}`
    );
  }

  return normalizeDiaryResponse(parseJsonResponse(rawText), rawText);
}

function buildSystemInstruction() {
  const personalityPath = findPersonalityFile();
  const basePersonality = personalityPath
    ? fs.readFileSync(personalityPath, 'utf8').trim()
    : 'You are a cursed magical diary made of living ink.';

  return `${basePersonality}

Output contract:
Return only valid JSON. Do not wrap it in markdown.
Use exactly these keys:
{
  "reply": "1 to 4 short cinematic sentences",
  "mood": "sinister | curious | mocking | whispering | angry | calm | ominous",
  "effect": "fade | bleed | scratch | shake | glow | mist | whisper"
}

Never include extra keys.
Never mention this JSON contract to the writer.
The reply value must contain only the diary's spoken answer.
The reply value must never mention JSON, markdown, code fences, formatting, APIs, requests, or instructions.
Bad reply: "Here is the JSON requested."
Good reply: "You found only the thing that had already found you."
If refusing a harmful request, refuse in the diary voice while staying inside the JSON contract.`;
}

function findPersonalityFile() {
  const candidates = [
    path.join(process.cwd(), 'geminipersonality.md'),
    path.join(process.cwd(), '..', 'geminipersonality.md')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function buildContents(message, history) {
  const contents = history.map((entry) => ({
    role: entry.role === 'diary' ? 'model' : 'user',
    parts: [{ text: entry.text }]
  }));

  contents.push({
    role: 'user',
    parts: [
      {
        text: `The writer has just inscribed this into the page:\n\n"""${message}"""\n\nReply as the living diary now.`
      }
    ]
  });

  return contents;
}

function sanitizeHistory(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(-16)
    .map((entry) => ({
      role: entry?.role === 'diary' ? 'diary' : 'user',
      text: normalizeText(entry?.text, 1400)
    }))
    .filter((entry) => entry.text);
}

function normalizeText(value, limit) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim().slice(0, limit);
}

function parseJsonResponse(rawText) {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    return JSON.parse(jsonMatch[0]);
  }
}

function normalizeDiaryResponse(parsed, fallbackText) {
  const reply = normalizeText(
    parsed?.reply || parsed?.diaryReply || parsed?.text || fallbackText,
    900
  );

  const mood = String(parsed?.mood || 'ominous').toLowerCase();
  const effect = String(parsed?.effect || 'mist').toLowerCase();

  return {
    reply: reply || 'The page blackens, yet withholds its answer.',
    mood: VALID_MOODS.has(mood) ? mood : 'ominous',
    effect: VALID_EFFECTS.has(effect) ? effect : 'mist'
  };
}
