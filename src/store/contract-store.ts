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
interface ContractStore {
  contracts: Contract[];
  activeId: string | null;
  // Actions
  setContracts: (contracts: Contract[]) => void;
  setActiveId: (id: string | null) => void;
  addContract: (contract: Contract) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
}
export const useContractStore = create<ContractStore>()(
  persist(
    (set) => ({
      contracts: [],
      activeId: null,
      setContracts: (contracts) => set({ contracts }),
      setActiveId: (id) => set({ activeId: id }),
      addContract: (contract) => set((state) => ({ 
        contracts: [contract, ...state.contracts],
        activeId: contract.id 
      })),
      updateContract: (id, updates) => set((state) => ({
        contracts: state.contracts.map((c) => 
          c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
        )
      })),
      deleteContract: (id) => set((state) => ({
        contracts: state.contracts.filter((c) => c.id !== id),
        activeId: state.activeId === id ? (state.contracts[0]?.id || null) : state.activeId
      })),
    }),
    {
      name: 'prompt-contractor-storage',
    }
  )
);