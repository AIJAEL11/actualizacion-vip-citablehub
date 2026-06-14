"use client";

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

/** Small client island that copies a code snippet to the clipboard. */
export default function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select and copy manually.');
    }
  };

  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-card border border-border rounded-lg px-3 py-1.5 hover:border-primary/40 hover:text-primary transition cursor-pointer"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}
