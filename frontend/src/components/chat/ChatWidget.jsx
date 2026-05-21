import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ChatMessage from './ChatMessage';
import { ChatMascotFace } from '../characters/CartoonCharacters';
import { IconChevronDown } from '../icons/Icons';
import * as chatService from '../../services/chatService';

function formatTime(date = new Date()) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  }, []);

  const bootstrap = useCallback(async () => {
    if (initialized) return;
    try {
      const data = await chatService.fetchWelcome();
      setMessages([{ role: 'assistant', text: data.reply, time: formatTime() }]);
      setSuggestions(data.suggestions || []);
      setInitialized(true);
    } catch {
      setMessages([
        {
          role: 'assistant',
          text: 'Hi! I can help with bookings, PNR, prices, and cancellations. Ask me anything.',
          time: formatTime(),
        },
      ]);
      setSuggestions([
        { label: 'How do I book?', path: null },
        { label: 'Help page', path: '/help' },
      ]);
      setInitialized(true);
    }
  }, [initialized]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, messages, scrollToBottom]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError('');
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: trimmed, time: formatTime() }]);
    setSuggestions([]);
    setLoading(true);
    scrollToBottom();

    try {
      const data = await chatService.sendChatMessage(trimmed);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply, time: formatTime() },
      ]);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err.message || 'Could not reach support chat. Is the backend running?');
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (item) => {
    if (item.path) {
      setOpen(false);
      navigate(item.path);
      return;
    }
    sendMessage(item.label);
  };

  return (
    <div className="chat-widget" aria-live="polite">
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="chat-panel"
            role="dialog"
            aria-label="RailBook support chat"
          >
            <header className="chat-panel-header">
              <div className="flex items-center gap-3">
                <span className="chat-panel-avatar flex items-center justify-center">
                  <ChatMascotFace size={36} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">RailBook Support</p>
                  <p className="text-xs text-ink-faint">Usually replies instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="chat-panel-close"
                aria-label="Close chat"
              >
                <IconChevronDown size={20} />
              </button>
            </header>

            <div ref={listRef} className="chat-panel-messages">
              {messages.map((msg, i) => (
                <ChatMessage key={`${msg.time}-${i}`} role={msg.role} text={msg.text} time={msg.time} />
              ))}
              {loading && (
                <div className="chat-msg chat-msg--bot">
                  <div className="chat-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              {error && <p className="chat-error">{error}</p>}
            </div>

            {suggestions.length > 0 && !loading && (
              <div className="chat-suggestions">
                {suggestions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSuggestion(item)}
                    className="chat-suggestion-chip"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="chat-panel-form">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about booking, PNR, fares…"
                maxLength={500}
                className="chat-input"
                disabled={loading}
                aria-label="Your message"
              />
              <button type="submit" className="chat-send" disabled={loading || !input.trim()}>
                Send
              </button>
            </form>

            <p className="chat-panel-footer">
              <Link to="/help" className="text-ink-faint hover:text-ink-muted" onClick={() => setOpen(false)}>
                Help centre
              </Link>
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="chat-fab"
        aria-expanded={open}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        {open ? (
          <IconChevronDown size={22} className="rotate-180" />
        ) : (
          <ChatMascotFace size={30} />
        )}
      </motion.button>
    </div>
  );
}
