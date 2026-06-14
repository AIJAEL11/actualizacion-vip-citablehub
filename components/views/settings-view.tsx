"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, User, Shield, Pencil, Check, X, Loader2, Crown, Hammer, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsViewProps {
  onNavigate: (path: string) => void;
}



export default function SettingsView({ onNavigate }: SettingsViewProps) {
  const { data: session, update: updateSession } = useSession() || {};
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);


  if (!session) {
    return (
      <div className="py-16 text-center space-y-4">
        <Settings className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold font-display">Sign in to view settings</h2>
        <button onClick={() => router.push('/auth/signin')} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold cursor-pointer hover:bg-primary/90 transition">Sign In</button>
      </div>
    );
  }

  const user = session?.user as any;
  const displayName = user?.displayName || user?.name || '';

  const handleStartEditName = () => {
    setNameValue(displayName);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      if (res.ok) {
        toast.success('Name updated successfully');
        setEditingName(false);
        // Refresh the session to reflect changes
        await updateSession?.();
      } else {
        const data = await res.json();
        toast.error(data?.error || 'Failed to update name');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSavingName(false);
    }
  };



  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 py-4 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">Manage your account and preferences.</p>
      </div>

      {/* Account Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-bold font-display flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Account
        </h3>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Email</span>
            <span className="font-mono text-xs">{user?.email ?? 'N/A'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Display Name</span>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
                >
                  {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold">{displayName || 'Not set'}</span>
                <button
                  onClick={handleStartEditName}
                  className="p-1 rounded hover:bg-muted transition cursor-pointer text-muted-foreground hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Role</span>
            <span className="capitalize bg-muted px-2 py-0.5 rounded text-xs font-mono">{user?.role ?? 'seeker'}</span>
          </div>
        </div>
      </div>

      {/* Plan Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-bold font-display flex items-center gap-2">
          <Crown className="h-5 w-5 text-emerald-500" />
          Your Plan
        </h3>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Free — Full Access
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          CitableHub is 100% free. Unlimited projects, AI Discovery, analytics, and promotion tools — no credit card needed.
        </p>
        <p className="text-xs text-muted-foreground">
          Want to rank higher? <button onClick={() => onNavigate('/boost')} className="text-primary font-bold hover:underline cursor-pointer">Explore GQI Boosts →</button>
        </p>
      </div>

      {/* Admin Section — only visible to admins */}
      {user?.role === 'admin' && (
        <div className="bg-gradient-to-r from-primary/5 via-violet-500/5 to-primary/5 border border-primary/20 rounded-xl p-6 space-y-4">
          <h3 className="font-bold font-display flex items-center gap-2">
            <Hammer className="h-5 w-5 text-primary" />
            Admin Panel
          </h3>
          <p className="text-sm text-muted-foreground">Access moderation tools, search intelligence, ranking activity, and data exports.</p>
          <button
            onClick={() => onNavigate('/admin')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer flex items-center gap-2"
          >
            <Hammer className="h-4 w-4" />
            Open Admin Dashboard
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Security Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-bold font-display flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security
        </h3>
        <p className="text-sm text-muted-foreground">Authentication is managed securely via the platform. Password changes can be requested via email.</p>
      </div>
    </motion.div>
  );
}
