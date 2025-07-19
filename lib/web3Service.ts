import { ethers } from 'ethers'
import { useAppStore } from './store'
import { CONFIG, getRpcEndpoint } from '@/config'

// Uniswap V3 ETH/USDC Pool
const UNISWAP_V3_POOL = CONFIG.UNISWAP_V3_POOL

// Gas price calculation helpers
const calculateTotalFee = (baseFee: number, priorityFee: number): number => {
  return baseFee + priorityFee
}

const calculateGasCostUSD = (totalFee: number, gasLimit: number, usdPrice: number): number => {
  const gasCost = totalFee * gasLimit
  return gasCost * usdPrice
}

// USD Price calculation from Uniswap V3
const calculateUSDPrice = (sqrtPriceX96: string): number => {
  const price = ethers.parseUnits(sqrtPriceX96, 0)
  const priceSquared = price * price
  // Use literal values to avoid BigInt exponentiation
  const usdPrice = (priceSquared * BigInt(1_000_000_000_000)) / BigInt("6277101735386680763835789423207666416102355444464034512896")
  return Number(ethers.formatUnits(usdPrice, 6)) // USDC has 6 decimals
}

export class Web3Service {
  private providers: { [chain: string]: ethers.WebSocketProvider } = {}
  private isConnected = false

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    try {
      // Initialize WebSocket providers
      this.providers.ethereum = new ethers.WebSocketProvider(getRpcEndpoint('ethereum'))
      this.providers.polygon = new ethers.WebSocketProvider(getRpcEndpoint('polygon'))
      this.providers.arbitrum = new ethers.WebSocketProvider(getRpcEndpoint('arbitrum'))

      this.setupEventListeners()
      this.startGasPriceMonitoring()
      this.startUSDPriceMonitoring()
    } catch (error) {
      console.error('Failed to initialize Web3 providers:', error)
    }
  }

  private setupEventListeners() {
    Object.entries(this.providers).forEach(([chain, provider]) => {
      provider.on('block', async (blockNumber) => {
        await this.handleNewBlock(chain, blockNumber)
      })

      provider.on('error', (error) => {
        console.error(`${chain} provider error:`, error)
        useAppStore.getState().updateChainData(chain as any, { isConnected: false })
      })
    })
  }

  private async handleNewBlock(chain: string, blockNumber: number) {
    try {
      const provider = this.providers[chain]
      const block = await provider.getBlock(blockNumber, true)
      
      if (!block) return

      let baseFee = 0
      let priorityFee = 0

      // Extract gas fees based on chain
      if (chain === 'ethereum') {
        baseFee = Number(block.baseFeePerGas || 0)
        // For Ethereum, we need to estimate priority fee
        priorityFee = await this.estimatePriorityFee(provider)
      } else if (chain === 'polygon' || chain === 'arbitrum') {
        // Use provider.getFeeData() for legacy chains
        const feeData = await provider.getFeeData();
        baseFee = Number(feeData.gasPrice || 0);
        priorityFee = 0;
      }

      const totalFee = calculateTotalFee(baseFee, priorityFee)
      const usdPrice = useAppStore.getState().usdPrice

      // Create gas point for history
      const gasPoint = {
        timestamp: Date.now(),
        baseFee,
        priorityFee,
        totalFee,
        usdPrice,
        costUSD: calculateGasCostUSD(totalFee, 21000, usdPrice),
      }

      // Update store
      useAppStore.getState().updateChainData(chain as any, {
        baseFee,
        priorityFee,
        totalFee,
        lastUpdated: Date.now(),
        isConnected: true,
      })

      useAppStore.getState().addGasPoint(chain as any, gasPoint)

      // Recalculate simulation costs if in simulation mode
      if (useAppStore.getState().mode === 'simulation') {
        useAppStore.getState().calculateSimulationCosts()
      }
    } catch (error) {
      console.error(`Error handling new block for ${chain}:`, error)
    }
  }

  private async estimatePriorityFee(provider: ethers.WebSocketProvider): Promise<number> {
    try {
      const feeData = await provider.getFeeData()
      return Number(feeData.maxPriorityFeePerGas || 0)
    } catch (error) {
      console.error('Error estimating priority fee:', error)
      return 0
    }
  }

  private async startUSDPriceMonitoring() {
    const provider = this.providers.ethereum
    if (!provider) return

    const updateUSDPrice = async () => {
      try {
        // Get the latest swap event from Uniswap V3 pool
        const filter = {
          address: UNISWAP_V3_POOL,
          topics: [
            ethers.id('Swap(address,address,int256,int256,uint160,uint128,int24)'),
          ],
        }

        const logs = await provider.getLogs({
          ...filter,
          fromBlock: 'latest',
          toBlock: 'latest',
        })

        if (logs.length > 0) {
          const latestLog = logs[logs.length - 1]
          const sqrtPriceX96 = latestLog.data.slice(0, 66) // First 32 bytes
          const usdPrice = calculateUSDPrice(sqrtPriceX96)
          
          useAppStore.getState().updateUsdPrice(usdPrice)
        }
      } catch (error) {
        console.error('Error updating USD price:', error)
      }
    }

    // Update immediately
    await updateUSDPrice()

    // Update every 30 seconds
    setInterval(updateUSDPrice, 30000)
  }

  private startGasPriceMonitoring() {
    // Gas prices are updated via block events
    // This method is for fallback polling if WebSocket fails
    const pollGasPrices = async () => {
      Object.entries(this.providers).forEach(async ([chain, provider]) => {
        try {
          const feeData = await provider.getFeeData()
          const baseFee = Number(feeData.gasPrice || 0)
          const priorityFee = Number(feeData.maxPriorityFeePerGas || 0)
          const totalFee = calculateTotalFee(baseFee, priorityFee)

          useAppStore.getState().updateChainData(chain as any, {
            baseFee,
            priorityFee,
            totalFee,
            lastUpdated: Date.now(),
            isConnected: true,
          })
        } catch (error) {
          console.error(`Error polling gas prices for ${chain}:`, error)
        }
      })
    }

    // Poll every 6 seconds as fallback
    setInterval(pollGasPrices, 6000)
  }

  public disconnect() {
    Object.values(this.providers).forEach(provider => {
      provider.destroy()
    })
    this.isConnected = false
  }

  public getProvider(chain: string): ethers.WebSocketProvider | null {
    return this.providers[chain] || null
  }
}

// Export singleton instance
export const web3Service = new Web3Service() 