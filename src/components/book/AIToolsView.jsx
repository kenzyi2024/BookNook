import { useState } from 'react';
import { BookOpen, Search, MessageSquare, ArrowLeft, Send, RotateCcw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import BookLoader from '../ui/BookLoader';
import Typewriter from '../ui/Typewriter';

/**
 * AI companion tools for a single book: Smart Recap, Analysis Kit, and
 * (once finished) a Socratic Seminar chat. Recap and analysis are cached on the
 * book document so they don't re-hit the API unnecessarily.
 */
export default function AIToolsView({ book, onUpdate }) {
  const api = useApi();
  const [activeTool, setActiveTool] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  // Seminar chat is persisted on the book, so it survives reopening the tool.
  const [chatHistory, setChatHistory] = useState(book.seminarChat || []);
  const [chatInput, setChatInput] = useState('');

  const restartChat = () => {
    setChatHistory([]);
    onUpdate({ seminarChat: [] });
  };

  const handleRecap = async () => {
    setActiveTool('recap');

    // Cache hit: same recap, same page → no API call.
    if (book.smartRecap && book.recapPage === book.currentPage) {
      setResult(book.smartRecap);
      return;
    }

    setLoading(true);
    setResult('');
    try {
      const prompt = `Give me a spoiler-safe recap of the novel "${book.title}" by ${book.author}. I am currently on page ${book.currentPage} of ${book.totalPages}. Summarize ONLY what has happened up to roughly my current page so I can jump back in — do NOT reveal anything that happens after this point. Keep it to 2-3 short paragraphs.`;
      const text = await api.generateAI(prompt);
      setResult(text);
      onUpdate({ smartRecap: text, recapPage: book.currentPage });
    } catch (err) {
      console.error('Error generating recap:', err);
      setResult(err.message || 'Oops! Something went wrong generating your recap.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysis = async () => {
    setActiveTool('analysis');

    if (book.aiAnalysis) {
      setResult(book.aiAnalysis);
      return;
    }

    setLoading(true);
    setResult('');
    try {
      const prompt = `Create a concise literary "analysis kit" for "${book.title}" by ${book.author}. Include: (1) 3-4 major themes, (2) key motifs and symbols to watch for, and (3) one thought-provoking question to keep in mind while reading. Use **bold** headers. Avoid major plot spoilers.`;
      const text = await api.generateAI(prompt);
      setResult(text);
      onUpdate({ aiAnalysis: text });
    } catch (err) {
      console.error('Error generating analysis:', err);
      setResult(err.message || 'Oops! Something went wrong generating the analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', content: chatInput }];
    setChatHistory(newHistory);
    setChatInput('');
    setLoading(true);

    const context = newHistory.map((m) => `${m.role}: ${m.content}`).join('\n');
    const prompt = `You are leading a Socratic Seminar about "${book.title}" by ${book.author}. The user has finished the book. Keep responses concise, ask probing questions, and encourage deep literary analysis.\n\nChat History:\n${context}\n\nAI:`;

    try {
      const res = await api.generateAI(prompt);
      const final = [...newHistory, { role: 'ai', content: res }];
      setChatHistory(final);
      onUpdate({ seminarChat: final }); // persist so the chat is saved
    } catch (err) {
      setChatHistory([
        ...newHistory,
        { role: 'ai', content: err.message || 'Sorry, I could not respond just now.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const tools = [
    {
      id: 'recap',
      onClick: handleRecap,
      icon: <BookOpen size={26} />,
      title: 'Story So Far',
      desc: `Get caught up to page ${book.currentPage || 0} without spoilers.`,
      tone: 'bg-brand-50 border-brand-100 text-brand-700 hover:bg-brand-100',
      iconBg: 'bg-brand-100 text-brand-700',
    },
    {
      id: 'analysis',
      onClick: handleAnalysis,
      icon: <Search size={26} />,
      title: 'Marginalia',
      desc: 'Themes, motifs, and symbols to watch for as you read.',
      tone: 'bg-surface border-stone-200 text-ink hover:border-brand-300',
      iconBg: 'bg-brand-100 text-brand-700',
    },
  ];

  return (
    <div className="animate-in fade-in">
      {!activeTool ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={t.onClick}
              className={`flex flex-col items-center text-center p-8 rounded-2xl border transition-colors group ${t.tone}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${t.iconBg}`}>
                {t.icon}
              </div>
              <h4 className="font-display font-bold text-lg mb-2">{t.title}</h4>
              <p className="text-sm opacity-90">{t.desc}</p>
            </button>
          ))}

          <button
            onClick={() => setActiveTool('seminar')}
            disabled={book.status !== 'read'}
            className={`flex flex-col items-center text-center p-8 rounded-2xl border transition-colors group ${
              book.status === 'read'
                ? 'bg-surface border-stone-200 hover:border-brand-300 cursor-pointer'
                : 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${
                book.status === 'read'
                  ? 'bg-brand-100 text-brand-700 group-hover:scale-110'
                  : 'bg-stone-200 text-stone-400'
              }`}
            >
              <MessageSquare size={26} />
            </div>
            <h4 className={`font-display font-bold text-lg mb-2 ${book.status === 'read' ? 'text-ink' : 'text-stone-500'}`}>
              The Reading Circle
            </h4>
            <p className={`text-sm ${book.status === 'read' ? 'text-stone-500' : 'text-stone-400'}`}>
              {book.status === 'read'
                ? 'Discuss the ending and deeper meanings with AI.'
                : 'Finish the book first to unlock discussion!'}
            </p>
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setActiveTool(null)}
              className="flex items-center gap-2 text-stone-500 hover:text-ink text-sm font-medium"
            >
              <ArrowLeft size={16} /> Back to Tools
            </button>
            {activeTool === 'seminar' && chatHistory.length > 0 && (
              <button
                onClick={restartChat}
                className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-status-dnf transition-colors"
              >
                <RotateCcw size={14} /> Restart chat
              </button>
            )}
          </div>

          <div className="bg-stone-50 p-6 md:p-8 rounded-2xl border border-stone-200 min-h-[300px]">
            {loading && !result && chatHistory.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <BookLoader
                  label={
                    activeTool === 'recap'
                      ? 'Turning back to your page…'
                      : activeTool === 'analysis'
                        ? 'Reading between the lines…'
                        : 'Gathering thoughts…'
                  }
                />
              </div>
            ) : activeTool === 'seminar' ? (
              <div className="flex flex-col h-[400px]">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-stone-500 mt-10 italic">
                      Start the discussion! What did you think of the ending?
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-brand-500 text-white rounded-tr-sm'
                            : 'bg-surface border border-stone-200 text-ink rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-surface border border-stone-200 p-4 rounded-2xl rounded-tl-sm flex gap-2">
                        <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  )}
                </div>
                <form onSubmit={handleChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="flex-1 bg-surface border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                  />
                  <button
                    type="submit"
                    disabled={loading || !chatInput.trim()}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 rounded-xl transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="aged-paper rounded-2xl p-6 md:p-8 font-serif leading-relaxed text-[15px]">
                <Typewriter key={`${activeTool}|${result.length}`} text={result} className="space-y-3" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
