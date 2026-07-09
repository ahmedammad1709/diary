import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDiaryReply, DiaryHttpError, getConfiguredModel } from './diaryCore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(express.json({ limit: '1mb' }));

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, model: getConfiguredModel() });
});

app.post('/api/diary-reply', async (request, response) => {
  try {
    const diaryResponse = await createDiaryReply(request.body);
    response.json(diaryResponse);
  } catch (error) {
    if (!(error instanceof DiaryHttpError)) {
      console.error('[diary-reply]', error);
    }
    const status = error instanceof DiaryHttpError ? error.status : 502;
    response.status(status).json({
      error:
        error instanceof DiaryHttpError
          ? error.message
          : 'The diary stayed silent. Check the server logs and Gemini API key.'
    });
  }
});

if (fs.existsSync(distDir)) {
  app.get(/.*/, (_request, response) => {
    response.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Living Ink Diary server listening on http://localhost:${port}`);
});
