import React, { useEffect, useRef, useState } from 'react';
import { Bot, CheckCircle2, Send, Sparkles, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService } from '@/lib/chat';
import { cn } from '@/lib/utils';
import { useContractStore } from '@/store/contract-store';
import type { ContractDraft, Message } from '../../../worker/types';
export function AssistantPanel() {
  const activeId = useContractStore((s) => s.activeId);
  const updateContract = useContractStore((s) => s.updateContract);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestDraft, setLatestDraft] = useState<ContractDraft | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const loadMessages = async () => {
    if (!activeId) return;
    setError(null);
    try {
      const res = await chatService.getMessages();
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to load messages.');
        return;
      }
      setMessages(res.data.messages ?? []);
      setLatestDraft(res.data.latestDraft ?? null);
    } catch (e) {
      console.error('[AssistantPanel] loadMessages failed:', e);
      setError('Failed to load messages.');
    }
  };
  useEffect(() => {
    if (!activeId) return;
    chatService.switchSession(activeId);
    void loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isTyping, error]);
  const handleSend = async () => {
    if (!activeId) {
      setError('Select a contract to start chatting.');
      return;
    }
    if (!input.trim() || isTyping) return;
    setError(null);
    const messageText = input.trim();
    const optimisticUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInput('');
    setIsTyping(true);
    try {
      // Non-streaming: we need the JSON state back to update messages + latestDraft reliably.
      const res = await chatService.sendMessage(messageText);
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to send message.');
        return;
      }
      setMessages(res.data.messages ?? []);
      setLatestDraft(res.data.latestDraft ?? null);
    } catch (e) {
      console.error('[AssistantPanel] sendMessage failed:', e);
      setError('Failed to send message.');
    } finally {
      setIsTyping(false);
    }
  };
  const applyDraft = async () => {
    if (!latestDraft || !activeId) return;
    setError(null);
    updateContract(activeId, {
      goal: latestDraft.goal,
      constraints: latestDraft.constraints,
      format: latestDraft.format,
      failureConditions: latestDraft.failureConditions,
    });
    // Optimistically hide it locally, then clear server-side so it doesn't reappear.
    setLatestDraft(null);
    try {
      const res = await chatService.clearDraft();
      if (!res.success) {
        setError(res.error || 'Applied, but could not dismiss the draft on the server. It may reappear.');
        return;
      }
      setLatestDraft(res.data?.latestDraft ?? null);
    } catch (e) {
      console.error('[AssistantPanel] clearDraft failed:', e);
      setError('Applied, but could not dismiss the draft on the server. It may reappear.');
    }
  };
  return (
    <div className="flex flex-col h-full bg-muted/30 border-l">
      <div className="p-4 border-b bg-background flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Contract Assistant</h2>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">
          v1.0
        </Badge>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border bg-background p-3 text-xs">
              <div className="flex items-start justify-between gap-3">
                <p className="text-foreground">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => void loadMessages()}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border'
                )}
                aria-hidden="true"
              >
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl p-3 text-sm shadow-sm whitespace-pre-wrap break-words',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 animate-pulse" aria-live="polite">
              <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center" aria-hidden="true">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-background border rounded-2xl p-3 text-sm">Drafting…</div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      {latestDraft && (
        <div className="p-4 bg-accent/50 border-t border-b animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              New Contract Draft Available
            </div>
            <Button size="sm" onClick={() => void applyDraft()} className="h-8">
              Apply to Editor
            </Button>
          </div>
        </div>
      )}
      <div className="p-4 bg-background border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="relative"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your prompt goal…"
            className="pr-12 py-6 rounded-xl bg-muted/50 focus-visible:ring-1"
            aria-label="Message the assistant"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping || !activeId}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg w-8 h-8"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="mt-2 text-[10px] text-center text-muted-foreground">AI can make mistakes. Review drafts carefully.</p>
      </div>
    </div>
  );
}