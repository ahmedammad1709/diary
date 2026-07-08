export async function askDiary({ message, history }) {
  const response = await fetch('/api/diary-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'The diary refused to answer.');
  }

  return data;
}
