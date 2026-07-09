import { useEffect, useMemo, useRef, useState } from 'react';
import InkCanvas from './components/InkCanvas.jsx';
import { useTypewriter } from './hooks/useTypewriter.js';
import { askDiary } from './modules/diaryApi.js';
import {
  clearMemory,
  makeMemoryEntry,
  readMemory,
  readSeal,
  writeMemory,
  writeSeal
} from './modules/memory.js';
import {
  corruptMemoryText,
  findSecretTrigger,
  getDailyPrompt,
  getDiaryBond,
  getMemoryFragments
} from './modules/diarySystems.js';
import { shareOmenCard } from './modules/shareCard.js';
import { playDiarySound, setAmbientSound, stopAmbient } from './modules/soundEngine.js';
import wandUrl from '../wand.png';

const READING_LINES = [
  'The diary is reading your words...',
  'The ink is listening...',
  'Something beneath the page has noticed...',
  'The page drinks the confession...'
];

const RESET_SPARKLES = [
  { x: 50, y: 45, size: 13, delay: 820, dx: -34, dy: -26, shape: 'star' },
  { x: 52, y: 48, size: 8, delay: 880, dx: 38, dy: -14, shape: 'dot' },
  { x: 47, y: 52, size: 11, delay: 940, dx: -55, dy: 18, shape: 'diamond' },
  { x: 56, y: 42, size: 7, delay: 1020, dx: 46, dy: 24, shape: 'dot' },
  { x: 44, y: 38, size: 9, delay: 1080, dx: -82, dy: -38, shape: 'star' },
  { x: 61, y: 54, size: 10, delay: 1120, dx: 92, dy: 34, shape: 'star' },
  { x: 38, y: 56, size: 6, delay: 1180, dx: -120, dy: 42, shape: 'dot' },
  { x: 65, y: 35, size: 8, delay: 1220, dx: 112, dy: -54, shape: 'diamond' },
  { x: 31, y: 29, size: 8, delay: 1260, dx: -54, dy: -38, shape: 'star' },
  { x: 72, y: 64, size: 9, delay: 1320, dx: 82, dy: 56, shape: 'star' },
  { x: 21, y: 61, size: 6, delay: 1380, dx: -38, dy: 36, shape: 'dot' },
  { x: 81, y: 27, size: 7, delay: 1420, dx: 42, dy: -42, shape: 'dot' },
  { x: 14, y: 23, size: 8, delay: 1480, dx: -26, dy: -28, shape: 'diamond' },
  { x: 89, y: 77, size: 9, delay: 1520, dx: 30, dy: 32, shape: 'star' },
  { x: 24, y: 80, size: 7, delay: 1570, dx: -20, dy: 46, shape: 'dot' },
  { x: 76, y: 15, size: 10, delay: 1610, dx: 24, dy: -36, shape: 'star' },
  { x: 42, y: 18, size: 6, delay: 1660, dx: -16, dy: -52, shape: 'dot' },
  { x: 57, y: 83, size: 8, delay: 1710, dx: 14, dy: 54, shape: 'diamond' },
  { x: 11, y: 48, size: 7, delay: 1760, dx: -46, dy: 0, shape: 'star' },
  { x: 92, y: 43, size: 6, delay: 1810, dx: 42, dy: 4, shape: 'dot' },
  { x: 34, y: 70, size: 10, delay: 1860, dx: -46, dy: 46, shape: 'star' },
  { x: 68, y: 76, size: 7, delay: 1920, dx: 52, dy: 48, shape: 'dot' },
  { x: 18, y: 36, size: 5, delay: 1980, dx: -52, dy: -18, shape: 'dot' },
  { x: 84, y: 56, size: 8, delay: 2040, dx: 62, dy: 22, shape: 'diamond' },
  { x: 29, y: 12, size: 6, delay: 2100, dx: -34, dy: -48, shape: 'star' },
  { x: 71, y: 9, size: 5, delay: 2160, dx: 38, dy: -46, shape: 'dot' },
  { x: 46, y: 91, size: 9, delay: 2220, dx: -14, dy: 62, shape: 'star' },
  { x: 60, y: 22, size: 6, delay: 2280, dx: 26, dy: -64, shape: 'dot' },
  { x: 36, y: 44, size: 7, delay: 2340, dx: -94, dy: -4, shape: 'diamond' },
  { x: 64, y: 48, size: 6, delay: 2400, dx: 110, dy: 8, shape: 'dot' },
  { x: 49, y: 31, size: 8, delay: 2460, dx: -10, dy: -78, shape: 'star' },
  { x: 54, y: 66, size: 7, delay: 2520, dx: 8, dy: 84, shape: 'diamond' },
  { x: 7, y: 74, size: 6, delay: 2580, dx: -32, dy: 42, shape: 'dot' },
  { x: 95, y: 20, size: 7, delay: 2640, dx: 36, dy: -38, shape: 'star' },
  { x: 23, y: 15, size: 5, delay: 2700, dx: -54, dy: -52, shape: 'dot' },
  { x: 79, y: 88, size: 8, delay: 2760, dx: 48, dy: 54, shape: 'diamond' },
  { x: 40, y: 62, size: 6, delay: 2820, dx: -80, dy: 46, shape: 'dot' },
  { x: 73, y: 38, size: 9, delay: 2880, dx: 98, dy: -12, shape: 'star' }
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
  const [resetPhase, setResetPhase] = useState('idle');
  const [hasInk, setHasInk] = useState(false);
  const [sealPreview, setSealPreview] = useState(() => readSeal());
  const [secretPulse, setSecretPulse] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [mood, setMood] = useState(() => latestDiaryEntry(readMemory())?.mood || 'ominous');
  const [effect, setEffect] = useState(() => latestDiaryEntry(readMemory())?.effect || 'mist');
  const [diaryReply, setDiaryReply] = useState(() => latestDiaryEntry(readMemory())?.text || '');
  const canvasRef = useRef(null);
  const resetTimersRef = useRef([]);

  const typedReply = useTypewriter(diaryReply, effect === 'whisper' ? 54 : 34);
  const memoryEchoes = useMemo(() => memory.slice(-6).reverse(), [memory]);
  const memoryFragments = useMemo(() => getMemoryFragments(memory), [memory]);
  const diaryBond = useMemo(() => getDiaryBond(memory), [memory]);
  const pendingSecret = useMemo(() => findSecretTrigger(message), [message]);
  const isResetting = resetPhase !== 'idle';
  const canSubmit = (message.trim().length > 0 || hasInk) && !isAsking && !isResetting;

  useEffect(() => {
    return () => {
      resetTimersRef.current.forEach(window.clearTimeout);
      stopAmbient();
    };
  }, []);

  const playSound = (type) => {
    if (soundEnabled) {
      playDiarySound(type);
    }
  };

  const openDiary = () => {
    playSound('open');
    setIsOpening(true);
    window.setTimeout(() => {
      setIsOpen(true);
    }, 1200);
  };

  const submitInscription = async () => {
    const inscription = message.trim();
    const drawingImage = canvasRef.current?.exportImage();
    const hasDrawing = Boolean(drawingImage);

    if ((!inscription && !hasDrawing) || isAsking || isResetting) {
      return;
    }

    const secret = findSecretTrigger(inscription);
    if (secret) {
      setSecretPulse(secret.key);
      setMood(secret.mood);
      setEffect(secret.effect);
      setStatusLine(secret.status);
      playSound('spark');
      window.setTimeout(() => setSecretPulse(null), 2400);
    }

    setIsAsking(true);
    setIsSinking(true);
    setStatusLine(secret?.status || READING_LINES[Math.floor(Math.random() * READING_LINES.length)]);
    playSound('sink');

    const userEntry = makeMemoryEntry(
      'user',
      inscription || 'A hand-drawn mark was offered to the diary.',
      {
        hasDrawing,
        secret: secret?.key || null
      }
    );

    try {
      await wait(secret ? 1150 : 900);
      const response = await askDiary({
        message: inscription,
        history: memory,
        drawingImage: drawingImage
          ? {
              mimeType: drawingImage.mimeType,
              data: drawingImage.data
            }
          : null
      });
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
      setHasInk(false);
      if (drawingImage) {
        setSealPreview(drawingImage.dataUrl);
        writeSeal(drawingImage.dataUrl);
      }
      canvasRef.current?.clear();
      setStatusLine(response.fallback ? 'The diary answered from its own buried ink.' : 'The page exhales.');
      playSound('reply');
    } catch (error) {
      setMood('angry');
      setEffect('scratch');
      setStatusLine(error.message);
    } finally {
      setIsSinking(false);
      setIsAsking(false);
    }
  };

  const openDailyPage = async () => {
    if (isAsking || isResetting) {
      return;
    }

    setIsAsking(true);
    setIsSinking(false);
    setMood('curious');
    setEffect('mist');
    setStatusLine('The diary turns to today without your hand.');
    playSound('open');

    const dailyPrompt = getDailyPrompt(memory);
    const userEntry = makeMemoryEntry('user', 'The daily page was opened.', {
      daily: true
    });

    try {
      await wait(650);
      const response = await askDiary({ message: dailyPrompt, history: memory });
      const diaryEntry = makeMemoryEntry('diary', response.reply, {
        mood: response.mood,
        effect: response.effect,
        daily: true
      });
      const nextMemory = [...memory, userEntry, diaryEntry].slice(-20);

      setMemory(nextMemory);
      writeMemory(nextMemory);
      setMood(response.mood);
      setEffect(response.effect);
      setDiaryReply(response.reply);
      setStatusLine(response.fallback ? 'The diary answered from its own buried ink.' : 'The daily omen has been written.');
      playSound('reply');
    } catch (error) {
      setMood('angry');
      setEffect('scratch');
      setStatusLine(error.message);
    } finally {
      setIsAsking(false);
    }
  };

  const toggleSound = async () => {
    const nextValue = !soundEnabled;
    await setAmbientSound(nextValue);
    setSoundEnabled(nextValue);
    setStatusLine(nextValue ? 'A low room-tone wakes beneath the page.' : 'The room falls silent again.');
    if (nextValue) {
      playDiarySound('spark');
    }
  };

  const shareLatestOmen = async () => {
    if (!diaryReply || isSharing) {
      return;
    }

    setIsSharing(true);
    try {
      const message = await shareOmenCard({
        reply: diaryReply,
        mood,
        effect,
        sealPreview
      });
      setStatusLine(message);
    } catch (error) {
      setStatusLine(error.message);
    } finally {
      setIsSharing(false);
    }
  };

  const resetDiary = () => {
    if (isAsking || isResetting) {
      return;
    }

    resetTimersRef.current.forEach(window.clearTimeout);
    resetTimersRef.current = [];

    setResetPhase('casting');
    setMood('calm');
    setEffect('glow');
    setStatusLine('The wand rises from below the page.');
    playSound('spark');

    scheduleReset(() => {
      setStatusLine('Its tip begins to draw a circle in the air.');
    }, 760);

    scheduleReset(() => {
      setResetPhase('sprinkling');
      clearMemory();
      setMemory([]);
      setMessage('');
      setDiaryReply('');
      setHasInk(false);
      setSealPreview('');
      canvasRef.current?.clear();
      setStatusLine('Silver dust unthreads the old ink.');
    }, 1520);

    scheduleReset(() => {
      setResetPhase('sealing');
      setStatusLine('The diary folds around its empty memory.');
    }, 3200);

    scheduleReset(() => {
      setResetPhase('reopening');
      setStatusLine('The cover opens to a clean page.');
    }, 4100);

    scheduleReset(() => {
      setResetPhase('idle');
      setEffect('fade');
      setStatusLine('A fresh page waits.');
      resetTimersRef.current = [];
    }, 5300);
  };

  const scheduleReset = (callback, delay) => {
    const timer = window.setTimeout(callback, delay);
    resetTimersRef.current.push(timer);
  };

  return (
    <main className={`app-shell mood-${mood} effect-${effect} ${secretPulse ? `secret-${secretPulse}` : ''}`}>
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
        <section
          className={`diary-stage ${isResetting ? 'reset-ritual-active' : ''}`}
          aria-label="Open living diary"
        >
          <div className="top-rail">
            <div>
              <p className="brand-mark">The Living Ink Diary</p>
              <p className="bond-caption">
                Bond: <span>{diaryBond.label}</span>
              </p>
            </div>
            <div className="rail-actions">
              <button className="daily-button" type="button" onClick={openDailyPage} disabled={isAsking || isResetting}>
                Daily Page
              </button>
              <button className="sound-button" type="button" onClick={toggleSound}>
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </button>
              <button className="memory-reset" type="button" onClick={resetDiary} disabled={isAsking || isResetting}>
                {isResetting ? 'Memory unbinding...' : 'Reset Diary Memory'}
              </button>
            </div>
          </div>

          <div className={`diary-book reset-${resetPhase}`}>
            <aside className="left-page" aria-label="Faint memory page">
              <div className="page-heading">
                <span>remembered ink</span>
                <strong>{Math.ceil(memory.length / 2)} echoes</strong>
              </div>

              <div className="bond-panel">
                <div className="bond-panel-copy">
                  <span>diary bond</span>
                  <strong>{diaryBond.label}</strong>
                  <p>{diaryBond.description}</p>
                </div>
                <div className="bond-orb" style={{ '--bond': `${diaryBond.pulse}%` }} />
              </div>

              {sealPreview && (
                <div className="seal-preview">
                  <span>last mark</span>
                  <img src={sealPreview} alt="Last hand-drawn diary mark" />
                </div>
              )}

              <div className="memory-list">
                {memoryEchoes.length === 0 ? (
                  <p className="empty-memory">No old words remain. The page waits with clean teeth.</p>
                ) : (
                  memoryEchoes.map((entry, index) => (
                    <p className={`memory-line memory-${entry.role}`} key={`${entry.createdAt}-${entry.text}`}>
                      <span>{entry.role === 'diary' ? 'Diary' : 'You'}</span>
                      {entry.role === 'user' ? corruptMemoryText(entry.text, index) : entry.text}
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
                    disabled={isResetting}
                  >
                    Write
                  </button>
                  <button
                    className={mode === 'draw' ? 'active' : ''}
                    type="button"
                    onClick={() => setMode('draw')}
                    disabled={isResetting}
                  >
                    Mark
                  </button>
                </div>
                <button
                  className="clear-button"
                  type="button"
                  onClick={() => canvasRef.current?.clear()}
                  disabled={isResetting}
                >
                  Clear marks
                </button>
              </div>

              <div className={`writing-surface ${mode === 'draw' ? 'drawing-mode' : ''}`}>
                {memoryFragments.map((fragment) => (
                  <span
                    className="page-fragment"
                    key={fragment.id}
                    style={{
                      '--x': `${fragment.x}%`,
                      '--y': `${fragment.y}%`,
                      '--rotate': `${fragment.rotate}deg`,
                      '--delay': fragment.delay
                    }}
                  >
                    {fragment.text}
                  </span>
                ))}
                <textarea
                  className={`ink-input ${isSinking ? 'is-sinking' : ''}`}
                  placeholder="Write what you should not have written..."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  disabled={isAsking || isResetting}
                />
                <InkCanvas
                  ref={canvasRef}
                  drawingEnabled={mode === 'draw' && !isAsking && !isResetting}
                  sinking={isSinking}
                  onInkChange={setHasInk}
                />
                <div className={`secret-veil ${pendingSecret ? 'is-awake' : ''}`}>
                  {pendingSecret ? pendingSecret.status : ''}
                </div>
              </div>

              <div className={`reply-field ${diaryReply ? 'has-reply' : ''}`}>
                <p className="reply-text">{typedReply}</p>
                {diaryReply && (
                  <button className="share-button" type="button" onClick={shareLatestOmen} disabled={isSharing}>
                    {isSharing ? 'Sealing...' : 'Share omen'}
                  </button>
                )}
              </div>

              <div className="ritual-row">
                <p className="status-line" aria-live="polite">
                  {statusLine ||
                    (hasInk
                      ? 'A mark has been made. The diary can read it.'
                      : mode === 'draw'
                        ? 'The ink follows your hand.'
                        : 'The page waits.')}
                </p>
                <button className="sink-button" type="button" onClick={submitInscription} disabled={!canSubmit}>
                  {isAsking ? 'The ink is sinking...' : hasInk && !message.trim() ? 'Let the mark sink' : 'Let the ink sink'}
                </button>
              </div>
            </section>

            {isResetting && (
              <div className="reset-ritual" aria-hidden="true">
                <div className="spell-wand">
                  <div className="wand-body">
                    <span className="wand-trail" />
                    <img className="wand-image" src={wandUrl} alt="" />
                    <span className="wand-tip-glow" />
                    <span className="wand-tip-ring" />
                  </div>
                </div>
                <div className="spell-circle">
                  <span />
                  <span />
                </div>
                <div className="clean-flash" />
                <div className="spark-field">
                  {RESET_SPARKLES.map((sparkle) => (
                    <span
                      className={`sparkle sparkle-${sparkle.shape || 'star'}`}
                      key={`${sparkle.x}-${sparkle.y}`}
                      style={{
                        '--x': `${sparkle.x}%`,
                        '--y': `${sparkle.y}%`,
                        '--size': `${sparkle.size}px`,
                        '--delay': `${sparkle.delay}ms`,
                        '--drift-x': `${sparkle.dx}px`,
                        '--drift-y': `${sparkle.dy}px`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
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
