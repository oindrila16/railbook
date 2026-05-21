import api from './api';

const SESSION_KEY = 'railbook_chat_session';

export function getStoredSessionId() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || '';
  } catch {
    return '';
  }
}

export function storeSessionId(id) {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id);
  } catch {
    /* ignore */
  }
}

export async function fetchWelcome() {
  const sessionId = getStoredSessionId();
  const { data } = await api.get('/chat/welcome', {
    params: sessionId ? { sessionId } : {},
  });
  if (data.data?.sessionId) storeSessionId(data.data.sessionId);
  return data.data;
}

export async function sendChatMessage(message) {
  const sessionId = getStoredSessionId();
  const { data } = await api.post('/chat/message', {
    message,
    sessionId: sessionId || undefined,
  });
  if (data.data?.sessionId) storeSessionId(data.data.sessionId);
  return data.data;
}
