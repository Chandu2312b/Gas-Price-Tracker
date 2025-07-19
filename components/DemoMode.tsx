'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export default function DemoMode() {
  const updateChainData = useAppStore((state) => state.updateChainData)
  const updateUsdPrice = useAppStore((state) => state.updateUsdPrice)
  const addGasPoint = useAppStore((state) => state.addGasPoint)

  useEffect(() => {
    // Generate mock data for demo purposes
    const generateMockData = () => {
      const now = Date.now()
      
      // Mock USD price
      const mockUsdPrice = 2000 + Math.random() * 500 // $2000-$2500 range
      updateUsdPrice(mockUsdPrice)

      // Mock gas prices for each chain
      const chains = ['ethereum', 'polygon', 'arbitrum'] as const
      chains.forEach((chain, index) => {
        const baseFee = (20 + Math.random() * 30) * 1e9 // 20-50 Gwei
        const priorityFee = chain === 'ethereum' ? (1 + Math.random() * 5) * 1e9 : 0 // 1-6 Gwei for ETH
        const totalFee = baseFee + priorityFee

        // Update current data
        updateChainData(chain, {
          baseFee,
          priorityFee,
          totalFee,
          lastUpdated: now,
          isConnected: true,
        })

        // Add historical point
        addGasPoint(chain, {
          timestamp: now,
          baseFee,
          priorityFee,
          totalFee,
          usdPrice: mockUsdPrice,
          costUSD: (totalFee * 21000 * mockUsdPrice) / 1e18,
        })
      })
    }

    // Generate initial data
    generateMockData()

    // Update every 6 seconds to simulate real-time updates
    const interval = setInterval(generateMockData, 6000)

    return () => clearInterval(interval)
  }, [updateChainData, updateUsdPrice, addGasPoint])

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center">
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse" />
        <span className="text-sm font-medium">Demo Mode</span>
      </div>
      <p className="text-xs mt-1">Using mock data - configure API keys for live data</p>
    </div>
  )
} 