import { useMemo, useRef, useState } from 'react';
import InkCanvas from './components/InkCanvas.jsx';
import { useTypewriter } from './hooks/useTypewriter.js';
import { askDiary } from './modules/diaryApi.js';
import { clearMemory, makeMemoryEntry, readMemory, writeMemory } from './modules/memory.js';

const READING_LINES = [
  'The diary is reading your words...',
  'The ink is listening...',
  'Something beneath the page has noticed...',
  'The page drinks the confession...'
];

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [mode, setMode] = useState('write');
  const [message, setMessage] = useState('');
  const [memory, setMemory] = useState(() => readMemory());
  const [statusLine, setStatusLine] = useState('');
  const [isSinking, setIsSinking] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [mood, setMood] = useState(() => latestDiaryEntry(readMemory())?.mood || 'ominous');
  const [effect, setEffect] = useState(() => latestDiaryEntry(readMemory())?.effect || 'mist');
  const [diaryReply, setDiaryReply] = useState(() => latestDiaryEntry(readMemory())?.text || '');
  const canvasRef = useRef(null);

  const typedReply = useTypewriter(diaryReply, effect === 'whisper' ? 54 : 34);
  const memoryEchoes = useMemo(() => memory.slice(-6).reverse(), [memory]);
  const canSubmit = message.trim().length > 0 && !isAsking;

  const openDiary = () => {
    setIsOpening(true);
    window.setTimeout(() => {
      setIsOpen(true);
    }, 1200);
  };

  const submitInscription = async () => {
    const inscription = message.trim();
    if (!inscription || isAsking) {
      return;
    }

    setIsAsking(true);
    setIsSinking(true);
    setStatusLine(READING_LINES[Math.floor(Math.random() * READING_LINES.length)]);

    const userEntry = makeMemoryEntry('user', inscription);

    try {
      await wait(900);
      const response = await askDiary({ message: inscription, history: memory });
      const diaryEntry = makeMemoryEntry('diary', response.reply, {
        mood: response.mood,
        effect: response.effect
      });
      const nextMemory = [...memory, userEntry, diaryEntry].slice(-20);

      setMemory(nextMemory);
      writeMemory(nextMemory);
      setMood(response.mood);
      setEffect(response.effect);
      setDiaryReply(response.reply);
      setMessage('');
      canvasRef.current?.clear();
      setStatusLine('The page exhales.');
    } catch (error) {
      setMood('angry');
      setEffect('scratch');
      setStatusLine(error.message);
    } finally {
      setIsSinking(false);
      setIsAsking(false);
    }
  };

  const resetDiary = () => {
    clearMemory();
    setMemory([]);
    setMessage('');
    setDiaryReply('');
    setMood('calm');
    setEffect('fade');
    setStatusLine('The old memory goes cold.');
    canvasRef.current?.clear();
  };

  return (
    <main className={`app-shell mood-${mood} effect-${effect}`}>
      {!isOpen ? (
        <section className={`cover-scene ${isOpening ? 'is-opening' : ''}`} aria-label="Closed diary">
          <div className="closed-diary" role="img" aria-label="A closed dark diary">
            <div className="cover-half cover-left" />
            <div className="cover-spine" />
            <div className="cover-half cover-right" />
            <div className="cover-title">
              <span>The Living</span>
              <strong>Ink Diary</strong>
            </div>
          </div>
          <button className="open-button" type="button" onClick={openDiary} disabled={isOpening}>
            {isOpening ? 'The cover gives way...' : 'Open the diary'}
          </button>
        </section>
      ) : (
        <section className="diary-stage" aria-label="Open living diary">
          <div className="top-rail">
            <p className="brand-mark">The Living Ink Diary</p>
            <button className="memory-reset" type="button" onClick={resetDiary}>
              Reset Diary Memory
            </button>
          </div>

          <div className="diary-book">
            <aside className="left-page" aria-label="Faint memory page">
              <div className="page-heading">
                <span>remembered ink</span>
                <strong>{Math.ceil(memory.length / 2)} echoes</strong>
              </div>

              <div className="memory-list">
                {memoryEchoes.length === 0 ? (
                  <p className="empty-memory">No old words remain. The page waits with clean teeth.</p>
                ) : (
                  memoryEchoes.map((entry) => (
                    <p className={`memory-line memory-${entry.role}`} key={`${entry.createdAt}-${entry.text}`}>
                      <span>{entry.role === 'diary' ? 'Diary' : 'You'}</span>
                      {entry.text}
                    </p>
                  ))
                )}
              </div>
            </aside>

            <section className="right-page" aria-label="Writing page">
              <div className="tool-row">
                <div className="mode-switch" aria-label="Writing mode">
                  <button
                    className={mode === 'write' ? 'active' : ''}
                    type="button"
                    onClick={() => setMode('write')}
                  >
                    Write
                  </button>
                  <button
                    className={mode === 'draw' ? 'active' : ''}
                    type="button"
                    onClick={() => setMode('draw')}
                  >
                    Mark
                  </button>
                </div>
                <button className="clear-button" type="button" onClick={() => canvasRef.current?.clear()}>
                  Clear marks
                </button>
              </div>

              <div className={`writing-surface ${mode === 'draw' ? 'drawing-mode' : ''}`}>
                <textarea
                  className={`ink-input ${isSinking ? 'is-sinking' : ''}`}
                  placeholder="Write what you should not have written..."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  disabled={isAsking}
                />
                <InkCanvas ref={canvasRef} drawingEnabled={mode === 'draw' && !isAsking} sinking={isSinking} />
              </div>

              <div className={`reply-field ${diaryReply ? 'has-reply' : ''}`}>
                <p className="reply-text">{typedReply}</p>
              </div>

              <div className="ritual-row">
                <p className="status-line" aria-live="polite">
                  {statusLine || (mode === 'draw' ? 'The ink follows your hand.' : 'The page waits.')}
                </p>
                <button className="sink-button" type="button" onClick={submitInscription} disabled={!canSubmit}>
                  {isAsking ? 'The ink is sinking...' : 'Let the ink sink'}
                </button>
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}

function latestDiaryEntry(entries) {
  return entries
    .slice()
    .reverse()
    .find((entry) => entry.role === 'diary');
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default App;
