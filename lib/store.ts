import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface GasPoint {
  timestamp: number
  baseFee: number
  priorityFee: number
  totalFee: number
  usdPrice: number
  costUSD: number
}

export interface ChainData {
  baseFee: number
  priorityFee: number
  totalFee: number
  history: GasPoint[]
  lastUpdated: number
  isConnected: boolean
}

export interface SimulationData {
  transactionValue: number // in ETH/MATIC
  gasLimit: number
  costUSD: number
}

export interface AppState {
  // Mode management
  mode: 'live' | 'simulation'
  
  // Chain data
  chains: {
    ethereum: ChainData
    polygon: ChainData
    arbitrum: ChainData
  }
  
  // USD pricing
  usdPrice: number
  lastUsdUpdate: number
  
  // Simulation data
  simulation: {
    ethereum: SimulationData
    polygon: SimulationData
    arbitrum: SimulationData
  }
  
  // Actions
  setMode: (mode: 'live' | 'simulation') => void
  updateChainData: (chain: keyof AppState['chains'], data: Partial<ChainData>) => void
  updateUsdPrice: (price: number) => void
  addGasPoint: (chain: keyof AppState['chains'], point: GasPoint) => void
  updateSimulation: (chain: keyof AppState['chains'], data: Partial<SimulationData>) => void
  calculateSimulationCosts: () => void
}

const initialChainData: ChainData = {
  baseFee: 0,
  priorityFee: 0,
  totalFee: 0,
  history: [],
  lastUpdated: 0,
  isConnected: false,
}

const initialSimulationData: SimulationData = {
  transactionValue: 0,
  gasLimit: 21000,
  costUSD: 0,
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      mode: 'live',
      
      chains: {
        ethereum: { ...initialChainData },
        polygon: { ...initialChainData },
        arbitrum: { ...initialChainData },
      },
      
      usdPrice: 0,
      lastUsdUpdate: 0,
      
      simulation: {
        ethereum: { ...initialSimulationData },
        polygon: { ...initialSimulationData },
        arbitrum: { ...initialSimulationData },
      },
      
      setMode: (mode) => set({ mode }),
      
      updateChainData: (chain, data) =>
        set((state) => ({
          chains: {
            ...state.chains,
            [chain]: {
              ...state.chains[chain],
              ...data,
            },
          },
        })),
      
      updateUsdPrice: (price) =>
        set({
          usdPrice: price,
          lastUsdUpdate: Date.now(),
        }),
      
      addGasPoint: (chain, point) =>
        set((state) => {
          const chainData = state.chains[chain]
          const history = [...chainData.history, point]
          
          // Keep only last 96 points (24 hours at 15-min intervals)
          if (history.length > 96) {
            history.splice(0, history.length - 96)
          }
          
          return {
            chains: {
              ...state.chains,
              [chain]: {
                ...chainData,
                history,
              },
            },
          }
        }),
      
      updateSimulation: (chain, data) =>
        set((state) => ({
          simulation: {
            ...state.simulation,
            [chain]: {
              ...state.simulation[chain],
              ...data,
            },
          },
        })),
      
      calculateSimulationCosts: () => {
        const state = get()
        const { usdPrice } = state
        
        if (usdPrice === 0) return
        
        Object.keys(state.chains).forEach((chainKey) => {
          const chain = chainKey as keyof AppState['chains']
          const chainData = state.chains[chain]
          const simulation = state.simulation[chain]
          
          if (chainData.totalFee > 0 && simulation.transactionValue > 0) {
            const gasCost = chainData.totalFee * simulation.gasLimit
            const transactionCost = simulation.transactionValue * usdPrice
            const totalCost = gasCost + transactionCost
            
            state.updateSimulation(chain, {
              costUSD: totalCost,
            })
          }
        })
      },
    }),
    {
      name: 'gas-tracker-store',
    }
  )
) 