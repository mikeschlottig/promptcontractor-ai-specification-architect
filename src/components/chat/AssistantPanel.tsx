import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { chatService } from '@/lib/chat';
import { useContractStore } from '@/store/contract-store';
import { cn } from '@/lib/utils';
import type { Message, ChatState } from '../../../worker/types';
export function AssistantPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [latestDraft, setLatestDraft] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeId = useContractStore((s) => s.activeId);
  const updateContract = useContractStore((s) => s.updateContract);
  useEffect(() => {
    if (activeId) {
      chatService.switchSession(activeId);
      loadMessages();
    }
  }, [activeId]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);
  const loadMessages = async () => {
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      setMessages(res.data.messages);
      // @ts-ignore - latestDraft is custom extension
      if (res.data.latestDraft) setLatestDraft(res.data.latestDraft);
    }
  };
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    const res = await chatService.sendMessage(input, undefined, (chunk) => {
      // Handle streaming if needed, but for now we'll just wait for complete
    });
    if (res.success && res.data) {
      setMessages(res.data.messages);
      // @ts-ignore
      if (res.data.latestDraft) setLatestDraft(res.data.latestDraft);
    }
    setIsTyping(false);
  };
  const applyDraft = () => {
    if (!latestDraft || !activeId) return;
    updateContract(activeId, {
      goal: latestDraft.goal,
      constraints: latestDraft.constraints,
      format: latestDraft.format,
      failureConditions: latestDraft.failureConditions
    });
    setLatestDraft(null);
  };
  return (
    <div className="flex flex-col h-full bg-muted/30 border-l">
      <div className="p-4 border-b bg-background flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Contract Assistant</h2>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">v1.0</Badge>
      </div>
      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        <div className="space-y-6">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", 
                m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted border")}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn("max-w-[85%] rounded-2xl p-3 text-sm shadow-sm",
                m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-background border")}>
                {m.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-background border rounded-2xl p-3 text-sm">Drafting...</div>
            </div>
          )}
        </div>
      </ScrollArea>
      {latestDraft && (
        <div className="p-4 bg-accent/50 border-t border-b animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              New Contract Draft Available
            </div>
            <Button size="sm" onClick={applyDraft} className="h-8">Apply to Editor</Button>
          </div>
        </div>
      )}
      <div className="p-4 bg-background border-t">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your prompt goal..."
            className="pr-12 py-6 rounded-xl bg-muted/50 focus-visible:ring-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg w-8 h-8"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="mt-2 text-[10px] text-center text-muted-foreground">
          AI can make mistakes. Review drafts carefully.
        </p>
      </div>
    </div>
  );
}