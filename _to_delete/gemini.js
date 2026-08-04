/**
 * Thin wrapper around the Gemini generateContent endpoint.
 *
 * NOTE: the API key is exposed to the browser via VITE_GEMINI_API_KEY. That's
 * fine for a personal project, but for anything public you should proxy these
 * calls through your Express backend so the key never ships to the client.
 */
const MODEL = 'gemini-2.5-flash';

export async function callGemini(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return '**Error:** Missing VITE_GEMINI_API_KEY. Add it to your .env and restart the dev server.';
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      return `**Error from Google:** ${errorData.error?.message || 'Request failed. Check the console.'}`;
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '**Error:** Empty response from the AI.';
  } catch (err) {
    console.error('Gemini fetch error:', err);
    return `**Network Error:** ${err.message}`;
  }
}

/** Turn very light markdown (**bold**, *italic*, newlines) into HTML for AI output. */
export function renderMarkdown(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}
