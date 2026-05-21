/**
 * Lightweight **bold** formatting for chatbot replies (trusted server content).
 */
export function formatChatText(text) {
  if (!text) return '';
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return { type: 'bold', text: part.slice(2, -2), key: i };
    }
    return { type: 'text', text: part, key: i };
  });
}
