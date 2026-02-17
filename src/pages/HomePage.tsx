import React, { useEffect } from 'react';
import { Plus, FileText, Trash2, PanelRightClose, PanelRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ContractEditor } from '@/components/editor/ContractEditor';
import { AssistantPanel } from '@/components/chat/AssistantPanel';
import { useContractStore } from '@/store/contract-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
export function HomePage() {
  const contracts = useContractStore((s) => s.contracts);
  const activeId = useContractStore((s) => s.activeId);
  const addContract = useContractStore((s) => s.addContract);
  const setActiveId = useContractStore((s) => s.setActiveId);
  const deleteContract = useContractStore((s) => s.deleteContract);
  const [showAssistant, setShowAssistant] = React.useState(true);
  const createNew = () => {
    const id = crypto.randomUUID();
    addContract({
      id,
      title: 'Untitled Contract',
      goal: '',
      constraints: '',
      format: '',
      failureConditions: '',
      updatedAt: Date.now()
    });
  };
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Custom Sidebar for Notion Feel */}
      <aside className="w-64 border-r bg-muted/20 flex flex-col shrink-0">
        <div className="p-4 flex items-center justify-between">
          <h1 className="font-bold text-sm tracking-tight flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-[10px] text-primary-foreground">PC</div>
            PromptContractor
          </h1>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={createNew}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-2">
            {contracts.map((c) => (
              <div key={c.id} className="group relative">
                <button
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                    activeId === c.id ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50 text-muted-foreground"
                  )}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{c.title || 'Untitled'}</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteContract(c.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t text-[10px] text-muted-foreground">
          <p>PromptContractor v1.0</p>
          <p className="mt-1">Limits apply to AI requests.</p>
        </div>
      </aside>
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-14 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Workspace</span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-medium truncate max-w-[200px]">
              {contracts.find(c => c.id === activeId)?.title || 'No Contract Selected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-8">Export</Button>
            <Separator orientation="vertical" className="h-4" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setShowAssistant(!showAssistant)}
            >
              {showAssistant ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-8 md:py-10 lg:py-12">
                <ContractEditor />
              </div>
            </div>
          </div>
          {showAssistant && (
            <div className="w-96 shrink-0 h-full animate-in slide-in-from-right duration-300">
              <AssistantPanel />
            </div>
          )}
        </div>
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}