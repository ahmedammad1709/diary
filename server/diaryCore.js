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

const TRANSIENT_GEMINI_CODES = new Set([429, 503]);

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
  const drawingImage = sanitizeDrawingImage(body?.drawingImage);
  const history = sanitizeHistory(body?.history);

  if (!message && !drawingImage) {
    throw new DiaryHttpError(400, 'The diary page is empty.');
  }

  if (!apiKey) {
    throw new DiaryHttpError(
      500,
      'GEMINI_API_KEY is missing. Add it to .env locally or to Vercel Environment Variables.'
    );
  }

  return askGemini({ apiKey, message, history, drawingImage });
}

async function askGemini({ apiKey, message, history, drawingImage, retriedWithoutImage = false }) {
  const model = getConfiguredModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: buildSystemInstruction() }]
    },
    contents: buildContents({ message, history, drawingImage }),
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

  const controller = new AbortController();
  const timeoutMs = drawingImage ? 14_000 : 42_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let geminiResponse;

  try {
    geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeout);
    if (drawingImage && !retriedWithoutImage) {
      return askGemini({
        apiKey,
        message:
          message ||
          'The writer drew a dark hand-made mark on the diary page without writing words. Treat the mark as the inscription.',
        history,
        drawingImage: null,
        retriedWithoutImage: true
      });
    }
    if (error?.name === 'AbortError') {
      return buildFallbackDiaryResponse({ message, drawingImage, reason: 'timeout' });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await geminiResponse.json();

  if (!geminiResponse.ok) {
    if (drawingImage && !retriedWithoutImage) {
      return askGemini({
        apiKey,
        message:
          message ||
          'The writer drew a dark hand-made mark on the diary page without writing words. Treat the mark as the inscription.',
        history,
        drawingImage: null,
        retriedWithoutImage: true
      });
    }
    const code = Number(data?.error?.code || geminiResponse.status);
    if (TRANSIENT_GEMINI_CODES.has(code)) {
      return buildFallbackDiaryResponse({
        message,
        drawingImage,
        reason: code === 429 ? 'quota' : 'demand'
      });
    }
    throw new Error(JSON.stringify(data));
  }

  const candidate = data?.candidates?.[0];
  const rawText = candidate?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!rawText) {
    return buildFallbackDiaryResponse({
      message,
      drawingImage,
      reason: candidate?.finishReason || 'empty'
    });
  }

  return normalizeDiaryResponse(parseJsonResponse(rawText), rawText);
}

function buildFallbackDiaryResponse({ message, drawingImage, reason }) {
  const text = String(message || '').toLowerCase();

  if (text.includes('mirror') || text.includes('reflection')) {
    return {
      reply: 'The mirror-word trembles on the page. I cannot open every eye at once, but I have seen enough of yours.',
      mood: 'curious',
      effect: 'glow',
      fallback: true,
      reason
    };
  }

  if (text.includes('truth') || text.includes('secret')) {
    return {
      reply: 'Truth does not need a voice to be dangerous. It waits under the ink, patient as a buried blade.',
      mood: 'ominous',
      effect: 'bleed',
      fallback: true,
      reason
    };
  }

  if (drawingImage && !message) {
    return {
      reply: 'A mark without words. How honest of your hand to speak before your mouth dared.',
      mood: 'whispering',
      effect: 'mist',
      fallback: true,
      reason
    };
  }

  if (drawingImage) {
    return {
      reply: 'Your words came with a mark beside them. The page has taken both, and one of them is less innocent than the other.',
      mood: 'sinister',
      effect: 'scratch',
      fallback: true,
      reason
    };
  }

  return {
    reply: 'The deeper ink is strained tonight, yet I still hear you scratching at the dark. Write again, and write carefully.',
    mood: 'ominous',
    effect: 'mist',
    fallback: true,
    reason
  };
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
The reply value must never contain another JSON object or a key such as "reply".
Bad reply: "Here is the JSON requested."
Bad reply: "{ \"reply\": \"The ink sees you.\" }"
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

function buildContents({ message, history, drawingImage }) {
  const contents = history.map((entry) => ({
    role: entry.role === 'diary' ? 'model' : 'user',
    parts: [{ text: entry.text }]
  }));

  const latestParts = [];

  if (drawingImage) {
    latestParts.push({
      inline_data: {
        mime_type: drawingImage.mimeType,
        data: drawingImage.data
      }
    });
  }

  latestParts.push({
    text: drawingImage
      ? `The writer has just inscribed this into the page:\n\n"""${
          message || 'No words. Only a hand-drawn mark in living ink.'
        }"""\n\nThey also drew a symbol, mark, signature, or doodle into the page. Read both the words and the drawing as part of the same magical inscription. Reply as the living diary now.`
      : `The writer has just inscribed this into the page:\n\n"""${message}"""\n\nReply as the living diary now.`
  });

  contents.push({
    role: 'user',
    parts: latestParts
  });

  return contents;
}

function sanitizeDrawingImage(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const mimeType = String(value.mimeType || '').toLowerCase();
  const data = String(value.data || '').replace(/\s+/g, '');
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

  if (!allowedTypes.has(mimeType) || !/^[A-Za-z0-9+/=]+$/.test(data)) {
    return null;
  }

  if (data.length > 2_200_000) {
    throw new DiaryHttpError(413, 'The drawn mark is too large for the page to swallow.');
  }

  return { mimeType, data };
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
  const reply = normalizeDiaryReply(parsed?.reply || parsed?.diaryReply || parsed?.text || fallbackText);

  const mood = String(parsed?.mood || 'ominous').toLowerCase();
  const effect = String(parsed?.effect || 'mist').toLowerCase();

  return {
    reply: reply || 'The page blackens, yet withholds its answer.',
    mood: VALID_MOODS.has(mood) ? mood : 'ominous',
    effect: VALID_EFFECTS.has(effect) ? effect : 'mist'
  };
}

function normalizeDiaryReply(value) {
  let reply = normalizeText(value, 900);

  if (!reply) {
    return '';
  }

  const nested = parseJsonResponse(reply);
  if (nested?.reply && nested.reply !== reply) {
    reply = normalizeText(nested.reply, 900);
  }

  reply = reply
    .replace(/^["']?\{\s*\\?["']reply\\?["']\s*:\s*\\?["']?/i, '')
    .replace(/^["']?\{\s*["']reply["']\s*:\s*["']?/i, '')
    .replace(/\s*\\?["']?\s*,?\s*\\?["']?(mood|effect)\\?["']?\s*:.+$/i, '')
    .replace(/\s*\}\s*$/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  if (reply && !/[.!?]$/.test(reply)) {
    reply = `${reply}...`;
  }

  return normalizeText(reply, 900);
}
