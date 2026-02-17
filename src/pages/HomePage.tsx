import React, { useCallback, useEffect, useMemo } from 'react';
import { FileText, PanelRight, PanelRightClose, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AssistantPanel } from '@/components/chat/AssistantPanel';
import { ContractEditor } from '@/components/editor/ContractEditor';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import type { Contract } from '@/store/contract-store';
import { useContractStore } from '@/store/contract-store';
function safeParseContracts(json: string): Contract[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as Contract[]) : [];
  } catch (e) {
    console.error('[HomePage] Failed to parse contractsJson:', e);
    return [];
  }
}
function contractToMarkdown(contract: Contract): string {
  const title = (contract.title || 'Untitled Contract').trim();
  return [
    `# ${title}`,
    ``,
    `## 1. Goal`,
    contract.goal?.trim() ? contract.goal.trim() : `_Not set_`,
    ``,
    `## 2. Constraints`,
    contract.constraints?.trim() ? contract.constraints.trim() : `_Not set_`,
    ``,
    `## 3. Output Format`,
    contract.format?.trim() ? contract.format.trim() : `_Not set_`,
    ``,
    `## 4. Failure Conditions`,
    contract.failureConditions?.trim() ? contract.failureConditions.trim() : `_Not set_`,
    ``,
  ].join('\n');
}
export function HomePage() {
  const contractsJson = useContractStore((s) => s.contractsJson);
  const activeId = useContractStore((s) => s.activeId);
  const addContract = useContractStore((s) => s.addContract);
  const setActiveId = useContractStore((s) => s.setActiveId);
  const deleteContract = useContractStore((s) => s.deleteContract);
  const [showAssistant, setShowAssistant] = React.useState(true);
  const contracts = useMemo(() => safeParseContracts(contractsJson), [contractsJson]);
  const activeContract = useMemo(
    () => contracts.find((c) => c.id === activeId) ?? null,
    [contracts, activeId]
  );
  const createNew = useCallback(() => {
    const id = crypto.randomUUID();
    addContract({
      id,
      title: 'Untitled Contract',
      goal: '',
      constraints: '',
      format: '',
      failureConditions: '',
      updatedAt: Date.now(),
    });
  }, [addContract]);
  // First-run initialization: always start with one contract (blueprint journey).
  useEffect(() => {
    if (contracts.length === 0) createNew();
  }, [contracts.length, createNew]);
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (e) {
      console.error('[HomePage] clipboard write failed:', e);
      toast.error('Copy failed. Your browser may block clipboard access.');
    }
  }, []);
  const exportMarkdown = useCallback(async () => {
    if (!activeContract) return;
    const md = contractToMarkdown(activeContract);
    await copyToClipboard(md);
  }, [activeContract, copyToClipboard]);
  const exportJson = useCallback(async () => {
    if (!activeContract) return;
    const payload = {
      id: activeContract.id,
      title: activeContract.title,
      goal: activeContract.goal,
      constraints: activeContract.constraints,
      format: activeContract.format,
      failureConditions: activeContract.failureConditions,
      updatedAt: activeContract.updatedAt,
    };
    await copyToClipboard(JSON.stringify(payload, null, 2));
  }, [activeContract, copyToClipboard]);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Custom Sidebar for Notion Feel */}
      <aside className="w-64 border-r bg-muted/20 flex flex-col shrink-0">
        <div className="p-4 flex items-center justify-between">
          <h1 className="font-bold text-sm tracking-tight flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-[10px] text-primary-foreground">
              PC
            </div>
            PromptContractor
          </h1>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={createNew} aria-label="New contract">
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
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    activeId === c.id
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'hover:bg-accent/50 text-muted-foreground'
                  )}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{c.title || 'Untitled'}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteContract(c.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-destructive focus-visible:text-destructive focus-visible:opacity-100 transition-opacity rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Delete contract"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {contracts.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No contracts yet. Create one to get started.
              </div>
            )}
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
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted-foreground shrink-0">Workspace</span>
            <span className="text-xs text-muted-foreground shrink-0">/</span>
            <span className="text-xs font-medium truncate max-w-[240px]">
              {activeContract?.title || 'No Contract Selected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs h-8" disabled={!activeContract}>
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Copy to clipboard</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void exportMarkdown()} disabled={!activeContract}>
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void exportJson()} disabled={!activeContract}>
                  JSON (.json)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Separator orientation="vertical" className="h-4" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowAssistant((v) => !v)}
              aria-label={showAssistant ? 'Hide assistant panel' : 'Show assistant panel'}
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