"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Loader2, ExternalLink, ArrowRight, Copy, Check, Quote, Search, Rocket } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface ChatViewProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
  projects: any[];
  initialQuery?: string;
}

export default function ChatView({ onNavigate, projects, initialQuery }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitRef = useRef(false);

  useEffect(() => {
    if (initialQuery && !hasInitRef.current) {
      hasInitRef.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: scrollRef.current?.scrollHeight ?? 0, behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (messageText?: string) => {
    const text = messageText || input;
    if (!text?.trim() || isLoading) return;

    const newCount = interactionCount + 1;
    setInteractionCount(newCount);

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    setMessages((prev: ChatMessage[]) => [...(prev ?? []), userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages ?? [],
          interactionCount: newCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let partialRead = '';

      setMessages((prev: ChatMessage[]) => [...(prev ?? []), { role: 'model', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          partialRead += decoder.decode(value, { stream: true });
          const lines = partialRead.split('\n');
          partialRead = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed?.choices?.[0]?.delta?.content ?? '';
                if (content) {
                  fullText += content;
                  const currentText = fullText;
                  setMessages((prev: ChatMessage[]) => {
                    const arr = [...(prev ?? [])];
                    if (arr.length > 0) {
                      arr[arr.length - 1] = { role: 'model', content: currentText };
                    }
                    return arr;
                  });
                }
              } catch {}
            }
          }
        }
      }

      if (!fullText) {
        setMessages((prev: ChatMessage[]) => {
          const arr = [...(prev ?? [])];
          if (arr.length > 0) {
            arr[arr.length - 1] = { role: 'model', content: 'I wasn\'t able to find a verified match for that specific intent in our current index. Try broadening your search, or if you know a project that fits \u2014 **[submit it for verification \u2192](/submit)**.' };
          }
          return arr;
        });
      }
    } catch (error: any) {
      setMessages((prev: ChatMessage[]) => [
        ...(prev ?? []),
        { role: 'model', content: 'Something went wrong while processing your request. Please try again in a moment.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, interactionCount]);

  const extractProjectCitations = (text: string): string[] => {
    const regex = /\[([^\]]+)\]\(\/p\/([a-zA-Z0-9_-]+)\)/g;
    const citations: string[] = [];
    const seen = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      const name = match[1];
      const slug = match[2];
      if (seen.has(slug)) continue;
      seen.add(slug);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://citablehub.com';
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      citations.push(`${name}. CitableHub Verified Software Index. ${baseUrl}/p/${slug}. Accessed ${date}.`);
    }
    return citations;
  };

  const handleCopyCitation = async (msgIndex: number, text: string) => {
    const citations = extractProjectCitations(text);
    const fullCitation = citations.length > 0
      ? citations.join('\n')
      : `CitableHub Discovery AI. ${typeof window !== 'undefined' ? window.location.origin : 'https://citablehub.com'}. Accessed ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`;

    try {
      await navigator.clipboard.writeText(fullCitation);
      setCopiedIndex(msgIndex);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = fullCitation;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedIndex(msgIndex);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const renderContent = (text: string) => {
    if (!text) return null;

    // Split into lines for structured rendering
    const lines = text.split('\n');
    const elements: any[] = [];
    let idx = 0;

    for (const line of lines) {
      // Parse inline links [Label](/p/slug)
      const linkRegex = /\[([^\]]+)\]\((\/p\/[a-zA-Z0-9_-]+|\/submit|\/boost|\/discover)\)/g;
      const parts: any[] = [];
      let lastIndex = 0;
      let linkMatch;

      while ((linkMatch = linkRegex.exec(line)) !== null) {
        if (linkMatch.index > lastIndex) {
          parts.push(<span key={`s-${idx++}`}>{line.substring(lastIndex, linkMatch.index)}</span>);
        }
        const label = linkMatch[1];
        const path = linkMatch[2];
        parts.push(
          <button
            key={`l-${idx++}`}
            onClick={() => onNavigate(path)}
            className="text-primary font-semibold hover:underline cursor-pointer inline-flex items-center gap-0.5 bg-primary/8 px-2 py-0.5 rounded-md border border-primary/15 transition-colors hover:bg-primary/15"
          >
            {label}
            <ExternalLink className="h-3 w-3 ml-0.5" />
          </button>
        );
        lastIndex = linkRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(<span key={`s-${idx++}`}>{line.substring(lastIndex)}</span>);
      }

      // Handle horizontal rules (---) as subtle separators
      if (line.trim() === '---') {
        elements.push(<hr key={`hr-${idx++}`} className="border-border/50 my-3" />);
      } else if (line.trim() === '') {
        elements.push(<div key={`br-${idx++}`} className="h-2" />);
      } else {
        // Bold text rendering
        const boldProcessed = parts.length > 0 ? parts : [<span key={`t-${idx++}`}>{line}</span>];
        elements.push(
          <div key={`line-${idx++}`} className="leading-relaxed">
            {boldProcessed}
          </div>
        );
      }
    }

    return elements;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background" style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background)) 85%, rgba(56,189,248,0.03) 100%)' }}>
      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 py-6 space-y-5">
        {(messages ?? []).length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(56,189,248,0.25), 0 4px 16px rgba(16,185,129,0.2)', transform: 'perspective(800px) rotateX(2deg)' }}>
              <img src="/logo.png" alt="CitableHub" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold font-display" style={{ textShadow: '0 2px 12px rgba(56,189,248,0.15)' }}>Discovery AI Analyst</h2>
              <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                Ask about any business need or technical challenge. I'll match you with
                verified, evidence-backed software from our curated index.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              {[
                'I need a CI/CD pipeline tool',
                'Find me an AI task manager',
                'Show me fintech solutions',
                'What makes CitableHub different?',
              ].map((q: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="group text-left bg-card border border-border rounded-xl p-3.5 text-xs hover:border-primary/30 transition-all duration-200 cursor-pointer flex items-center gap-2"
                  style={{ boxShadow: '0 2px 8px rgba(56,189,248,0.08), 0 1px 4px rgba(16,185,129,0.06)', transform: 'perspective(600px) rotateX(1deg)' }}
                >
                  <Search className="h-3.5 w-3.5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(messages ?? []).map((msg: ChatMessage, i: number) => (
          <div
            key={i}
            className={`flex ${msg?.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`w-full space-y-2`}>
              {/* Analyst label */}
              {msg?.role === 'model' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Discovery Analyst</span>
                </div>
              )}

              <div
                className={`rounded-2xl px-5 py-4 text-[15px] leading-[1.75] ${
                  msg?.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md max-w-[75%] ml-auto'
                    : 'bg-card border border-border rounded-bl-md'
                }`}
                style={msg?.role === 'user'
                  ? { boxShadow: '0 4px 20px rgba(124,58,237,0.3), 0 2px 8px rgba(56,189,248,0.15)', transform: 'perspective(800px) rotateY(-0.5deg) rotateX(0.5deg)' }
                  : { boxShadow: '0 4px 24px rgba(56,189,248,0.12), 0 2px 12px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.05)', transform: 'perspective(800px) rotateY(0.3deg) rotateX(0.3deg)' }
                }
              >
                {msg?.role === 'model' ? (
                  <div className="space-y-0.5">{renderContent(msg?.content ?? '')}</div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg?.content ?? ''}</span>
                )}
              </div>

              {/* Citation + Copy buttons — AI responses only, not while loading */}
              {msg?.role === 'model' && msg?.content && !isLoading && (
                <div className="flex items-center gap-2 pl-1">
                  <button
                    onClick={() => handleCopyCitation(i, msg.content)}
                    className={`group inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                      copiedIndex === i
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border'
                    }`}
                  >
                    {copiedIndex === i ? (
                      <><Check className="h-3 w-3" /> Citation Copied!</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy Citation</>
                    )}
                  </button>
                  {extractProjectCitations(msg.content).length > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Quote className="h-2.5 w-2.5" />
                      {extractProjectCitations(msg.content).length} verified source{extractProjectCitations(msg.content).length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Analyzing index...</span>
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3" style={{ boxShadow: '0 4px 24px rgba(56,189,248,0.12), 0 2px 12px rgba(16,185,129,0.08)' }}>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4 sm:px-8 md:px-12 lg:px-20 xl:px-32" style={{ boxShadow: '0 -4px 24px rgba(56,189,248,0.06), 0 -2px 12px rgba(16,185,129,0.04)' }}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e: any) => setInput(e?.target?.value ?? '')}
              onKeyDown={(e: any) => e?.key === 'Enter' && handleSend()}
              placeholder="Describe what you're looking for..."
              className="flex-1 bg-card border border-border rounded-xl px-5 py-3.5 text-[15px] outline-none focus:ring-2 focus:ring-primary/30 transition"
              style={{ boxShadow: 'inset 0 2px 6px rgba(56,189,248,0.06), 0 2px 8px rgba(56,189,248,0.08)' }}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input?.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground p-3.5 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 4px 16px rgba(124,58,237,0.35), 0 2px 8px rgba(56,189,248,0.2)', transform: 'perspective(400px) rotateX(2deg)' }}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            All recommendations are sourced exclusively from the verified CitableHub index. Citations are machine-readable.
          </p>
        </div>
      </div>
    </div>
  );
}
