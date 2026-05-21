import { formatChatText } from '../../utils/formatChatText';

function ChatText({ text, className = '' }) {
  const segments = formatChatText(text);
  return (
    <span className={className}>
      {segments.map((seg) =>
        seg.type === 'bold' ? (
          <strong key={seg.key} className="font-semibold text-ink">
            {seg.text}
          </strong>
        ) : (
          <span key={seg.key}>{seg.text}</span>
        )
      )}
    </span>
  );
}

export default function ChatMessage({ role, text, time }) {
  const isUser = role === 'user';

  return (
    <div className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--bot'}`}>
      <div className="chat-msg-bubble">
        <ChatText text={text} />
      </div>
      {time && <p className="chat-msg-time">{time}</p>}
    </div>
  );
}
