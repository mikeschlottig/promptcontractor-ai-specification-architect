import React, { useMemo } from 'react';
import { useContractStore } from '@/store/contract-store';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { Contract } from '@/store/contract-store';
function safeParseContracts(json: string): Contract[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as Contract[]) : [];
  } catch (e) {
    console.error('[ContractEditor] Failed to parse contractsJson:', e);
    return [];
  }
}
type EditableField = 'title' | 'goal' | 'constraints' | 'format' | 'failureConditions';
export function ContractEditor() {
  const activeId = useContractStore((s) => s.activeId);
  const contractsJson = useContractStore((s) => s.contractsJson);
  const updateContract = useContractStore((s) => s.updateContract);
  const contracts = useMemo(() => safeParseContracts(contractsJson), [contractsJson]);
  const contract = useMemo(
    () => contracts.find((c) => c.id === activeId) ?? null,
    [contracts, activeId]
  );
  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
        <div className="p-4 rounded-full bg-muted" aria-hidden="true">
          <span className="text-4xl">📄</span>
        </div>
        <p>Select or create a contract to get started</p>
      </div>
    );
  }
  const handleChange = (field: EditableField, value: string) => {
    updateContract(contract.id, { [field]: value });
  };
  function Section(props: {
    title: string;
    field: EditableField;
    value: string;
    placeholder: string;
  }) {
    const { title, field, value, placeholder } = props;
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </h3>
        <Textarea
          value={value}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          className="min-h-[120px] w-full resize-none bg-transparent border-0 px-0 shadow-none text-base leading-relaxed placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label={title}
        />
      </section>
    );
  }
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-4">
        <Textarea
          value={contract.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Untitled Contract"
          className="min-h-[56px] w-full resize-none bg-transparent border-0 px-0 shadow-none text-4xl md:text-5xl font-bold tracking-tight placeholder:text-muted-foreground/20 focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Contract title"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Last edited {new Date(contract.updatedAt).toLocaleString()}</span>
        </div>
      </header>
      <div className="grid gap-12">
        <Section
          title="1. Goal"
          field="goal"
          value={contract.goal}
          placeholder="What is the primary objective of this prompt?"
        />
        <Separator className="opacity-50" />
        <Section
          title="2. Constraints"
          field="constraints"
          value={contract.constraints}
          placeholder="List technical limitations, style requirements, or 'never' rules…"
        />
        <Separator className="opacity-50" />
        <Section
          title="3. Output Format"
          field="format"
          value={contract.format}
          placeholder="Define the exact structure (JSON, Markdown, Code, etc.)…"
        />
        <Separator className="opacity-50" />
        <Section
          title="4. Failure Conditions"
          field="failureConditions"
          value={contract.failureConditions}
          placeholder="What should the AI do if it cannot fulfill the request?"
        />
      </div>
      <div className="h-32" />
    </div>
  );
}