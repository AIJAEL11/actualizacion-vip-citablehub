"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Send, Loader2, CheckCircle, MessageSquare, HelpCircle, Bug, Lightbulb, Mail } from 'lucide-react';
import { toast } from 'sonner';

const TOPICS = [
  { value: 'general', label: 'General Inquiry', icon: MessageSquare },
  { value: 'support', label: 'Technical Support', icon: HelpCircle },
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb },
  { value: 'partnership', label: 'Partnership / Business', icon: Mail },
  { value: 'privacy', label: 'Privacy / Data Request', icon: Mail },
];

/**
 * Interactive contact form. Rendered as a client island inside the SSR
 * /contact page so the surrounding heading, contact info, and JSON-LD stay
 * server-rendered and crawlable.
 */
export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), topic, message: message.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="py-16 text-center space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-extrabold font-display">Message Sent!</h2>
        <p className="text-muted-foreground text-sm">Thank you for reaching out. We typically respond within 24-48 hours.</p>
        <Link href="/" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold">Name <span className="text-red-400">*</span></label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold">Email <span className="text-red-400">*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold">Topic</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TOPICS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTopic(t.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  topic === t.value
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/20'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold">Message <span className="text-red-400">*</span></label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's on your mind..."
          rows={6}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send Message</>}
      </button>
    </form>
  );
}
