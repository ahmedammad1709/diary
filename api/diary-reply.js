import { createDiaryReply, DiaryHttpError } from '../server/diaryCore.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Only POST is allowed.' });
    return;
  }

  try {
    const body = await readBody(request);
    const diaryResponse = await createDiaryReply(body);
    response.status(200).json(diaryResponse);
  } catch (error) {
    if (!(error instanceof DiaryHttpError)) {
      console.error('[vercel diary-reply]', error);
    }
    const status = error instanceof DiaryHttpError ? error.status : 502;
    response.status(status).json({
      error:
        error instanceof DiaryHttpError
          ? error.message
          : 'The diary stayed silent. Check the Vercel function logs and Gemini API key.'
    });
  }
}

async function readBody(request) {
  if (Buffer.isBuffer(request.body)) {
    return JSON.parse(request.body.toString('utf8') || '{}');
  }

  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  if (typeof request.body === 'string') {
    return JSON.parse(request.body || '{}');
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}
