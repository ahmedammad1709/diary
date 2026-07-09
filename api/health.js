import { getConfiguredModel } from '../server/diaryCore.js';

export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Only GET is allowed.' });
    return;
  }

  response.status(200).json({ ok: true, model: getConfiguredModel(), runtime: 'vercel' });
}
