const SECRET_TRIGGERS = [
  {
    key: 'mirror',
    words: ['mirror', 'reflection'],
    status: 'The page reflects something that is not behind you.',
    mood: 'curious',
    effect: 'glow'
  },
  {
    key: 'truth',
    words: ['truth', 'secret', 'confess'],
    status: 'The truth stains faster than ink.',
    mood: 'ominous',
    effect: 'bleed'
  },
  {
    key: 'name',
    words: ['name', 'called me', 'who am i'],
    status: 'Names are hooks. The diary has felt yours move.',
    mood: 'whispering',
    effect: 'whisper'
  },
  {
    key: 'forget',
    words: ['forget', 'forgot', 'erase', 'memory'],
    status: 'The old words refuse to stay buried.',
    mood: 'mocking',
    effect: 'mist'
  },
  {
    key: 'blood',
    words: ['blood', 'bleed', 'red'],
    status: 'The page warms beneath the word.',
    mood: 'sinister',
    effect: 'bleed'
  },
  {
    key: 'open',
    words: ['open', 'unlock', 'door'],
    status: 'Something in the spine unlatches.',
    mood: 'curious',
    effect: 'shake'
  }
];

const FRAGMENT_POSITIONS = [
  { x: 7, y: 18, rotate: -8 },
  { x: 61, y: 13, rotate: 5 },
  { x: 12, y: 72, rotate: 7 },
  { x: 70, y: 68, rotate: -5 },
  { x: 43, y: 86, rotate: 3 },
  { x: 78, y: 34, rotate: 8 }
];

export function findSecretTrigger(text) {
  const value = String(text || '').toLowerCase();
  return SECRET_TRIGGERS.find((trigger) => trigger.words.some((word) => value.includes(word))) || null;
}

export function getDiaryBond(memory) {
  const diaryReplies = memory.filter((entry) => entry.role === 'diary').length;

  if (diaryReplies >= 10) {
    return {
      label: 'Bound',
      description: 'The diary knows the weight of your hand.',
      pulse: 92
    };
  }

  if (diaryReplies >= 6) {
    return {
      label: 'Possessive',
      description: 'The ink waits for your return.',
      pulse: 74
    };
  }

  if (diaryReplies >= 3) {
    return {
      label: 'Watching',
      description: 'The page has begun to recognize you.',
      pulse: 52
    };
  }

  if (diaryReplies >= 1) {
    return {
      label: 'Awake',
      description: 'Something behind the parchment has opened an eye.',
      pulse: 31
    };
  }

  return {
    label: 'Dormant',
    description: 'The book is quiet, but not empty.',
    pulse: 12
  };
}

export function getMemoryFragments(memory) {
  return memory
    .filter((entry) => entry.role === 'user')
    .slice(-6)
    .map((entry, index) => {
      const phrase = makeFragment(entry.text);
      const position = FRAGMENT_POSITIONS[index % FRAGMENT_POSITIONS.length];
      return {
        id: `${entry.createdAt || index}-${phrase}`,
        text: phrase,
        ...position,
        delay: `${index * 0.34}s`
      };
    })
    .filter((fragment) => fragment.text.length > 0);
}

export function getDailyPrompt(memory) {
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  const remembered = memory
    .filter((entry) => entry.role === 'user')
    .slice(-3)
    .map((entry) => entry.text)
    .join(' | ');

  return `Open the daily page for ${dateLabel}. Speak as the living diary, using any relevant remembered fragments subtly. Recent marks: ${
    remembered || 'none'
  }.`;
}

export function corruptMemoryText(text, index) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return '';
  }

  const clipped = clean.length > 92 ? `${clean.slice(0, 89)}...` : clean;
  if (index % 3 === 0) {
    return clipped.replace(/\bI\b/g, 'you').replace(/\bmy\b/gi, 'your');
  }
  if (index % 3 === 1) {
    return clipped.replace(/[aeiou]/gi, (letter, offset) => (offset % 4 === 0 ? '.' : letter));
  }
  return clipped;
}

function makeFragment(text) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s'.-]/g, '')
    .trim();

  if (!clean) {
    return '';
  }

  const words = clean.split(' ').filter(Boolean);
  if (words.length <= 5) {
    return clean;
  }

  const start = Math.max(0, words.length - 5);
  return words.slice(start).join(' ');
}
