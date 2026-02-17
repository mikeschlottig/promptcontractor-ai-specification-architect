import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useContractStore } from '@/store/contract-store';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
export function ContractEditor() {
  const activeId = useContractStore((s) => s.activeId);
  const contracts = useContractStore((s) => s.contracts);
  const updateContract = useContractStore((s) => s.updateContract);
  const contract = contracts.find((c) => c.id === activeId);
  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <span className="text-4xl">📄</span>
        </div>
        <p>Select or create a contract to get started</p>
      </div>
    );
  }
  const handleChange = (field: keyof typeof contract, value: string) => {
    updateContract(contract.id, { [field]: value });
  };
  const Section = ({ title, field, value, placeholder }: { 
    title: string; 
    field: keyof typeof contract; 
    value: string; 
    placeholder: string 
  }) => (
    <div className="space-y-3 group">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </h3>
      </div>
      <TextareaAutosize
        value={value}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-none focus:ring-0 resize-none text-base leading-relaxed placeholder:text-muted-foreground/30"
      />
    </div>
  );
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <TextareaAutosize
          value={contract.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Untitled Contract"
          className="w-full bg-transparent border-none focus:ring-0 text-4xl md:text-5xl font-bold tracking-tight resize-none placeholder:text-muted-foreground/20"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Last edited {new Date(contract.updatedAt).toLocaleString()}</span>
        </div>
      </div>
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
          placeholder="List technical limitations, style requirements, or 'never' rules..."
        />
        <Separator className="opacity-50" />
        <Section 
          title="3. Output Format" 
          field="format" 
          value={contract.format}
          placeholder="Define the exact structure (JSON, Markdown, Code, etc.)..."
        />
        <Separator className="opacity-50" />
        <Section 
          title="4. Failure Conditions" 
          field="failureConditions" 
          value={contract.failureConditions}
          placeholder="What should the AI do if it cannot fulfill the request?"
        />
      </div>
      <div className="h-32" /> {/* Bottom spacing */}
    </div>
  );
}