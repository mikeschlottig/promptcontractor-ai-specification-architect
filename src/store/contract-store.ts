import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export interface Contract {
  id: string;
  title: string;
  goal: string;
  constraints: string;
  format: string;
  failureConditions: string;
  updatedAt: number;
}
type PersistedV1State = {
  contracts?: Contract[];
  activeId?: string | null;
};
interface ContractStore {
  // NOTE: Stored as a JSON string so components can select a single primitive field (store law).
  contractsJson: string;
  activeId: string | null;
  // Actions
  setActiveId: (id: string | null) => void;
  addContract: (contract: Contract) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
}
function safeParseContracts(json: string): Contract[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as Contract[]) : [];
  } catch (e) {
    console.error('[contract-store] Failed to parse contractsJson:', e);
    return [];
  }
}
function serializeContracts(contracts: Contract[]): string {
  try {
    return JSON.stringify(contracts);
  } catch (e) {
    console.error('[contract-store] Failed to serialize contracts:', e);
    return '[]';
  }
}
export const useContractStore = create<ContractStore>()(
  persist(
    (set) => ({
      contractsJson: '[]',
      activeId: null,
      setActiveId: (id) => set({ activeId: id }),
      addContract: (contract) =>
        set((state) => {
          const contracts = safeParseContracts(state.contractsJson);
          const next = [contract, ...contracts];
          return {
            contractsJson: serializeContracts(next),
            activeId: contract.id,
          };
        }),
      updateContract: (id, updates) =>
        set((state) => {
          const contracts = safeParseContracts(state.contractsJson);
          const next = contracts.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          );
          return { contractsJson: serializeContracts(next) };
        }),
      deleteContract: (id) =>
        set((state) => {
          const contracts = safeParseContracts(state.contractsJson);
          const remaining = contracts.filter((c) => c.id !== id);
          const nextActiveId =
            state.activeId === id ? (remaining[0]?.id ?? null) : state.activeId;
          return {
            contractsJson: serializeContracts(remaining),
            activeId: nextActiveId,
          };
        }),
    }),
    {
      name: 'prompt-contractor-storage',
      version: 2,
      migrate: (persistedState: unknown) => {
        const ps = (persistedState || {}) as PersistedV1State & Partial<ContractStore>;
        // v2 shape preferred
        if (typeof ps.contractsJson === 'string') {
          return {
            contractsJson: ps.contractsJson,
            activeId: ps.activeId ?? null,
          };
        }
        // v1 -> v2 migration (contracts array -> contractsJson string)
        const v1Contracts = Array.isArray(ps.contracts) ? ps.contracts : [];
        return {
          contractsJson: serializeContracts(v1Contracts),
          activeId: ps.activeId ?? (v1Contracts[0]?.id ?? null),
        };
      },
    }
  )
);