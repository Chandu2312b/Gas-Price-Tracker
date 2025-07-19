'use client'

import { useEffect, useState } from 'react'
import { web3Service } from '@/lib/web3Service'
import GasPriceChart from '@/components/GasPriceChart'
import TransactionSimulator from '@/components/TransactionSimulator'
import DemoMode from '@/components/DemoMode'
import { CONFIG } from '@/config'

export default function Dashboard() {
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Check if we're in demo mode (no API key configured)
    const isDemo = CONFIG.INFURA_API_KEY === 'YOUR_INFURA_API_KEY_HERE'
    setIsDemoMode(isDemo)

    if (!isDemo) {
      // Initialize Web3 service when component mounts (only if API key is configured)
      return () => {
        // Cleanup Web3 connections when component unmounts
        web3Service.disconnect()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {isDemoMode && <DemoMode />}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cross-Chain Gas Price Tracker
          </h1>
          <p className="text-gray-600">
            Real-time gas price monitoring across Ethereum, Polygon, and Arbitrum with wallet simulation
          </p>
          {isDemoMode && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Demo Mode:</strong> This is a demonstration with mock data. 
                To see real-time data, please configure your Infura API key in <code className="bg-blue-100 px-1 rounded">config.ts</code>.
              </p>
            </div>
          )}
        </div>

        {/* Transaction Simulator */}
        <div className="mb-8">
          <TransactionSimulator />
        </div>

        {/* Gas Price Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GasPriceChart chain="ethereum" />
          <GasPriceChart chain="polygon" />
          <GasPriceChart chain="arbitrum" />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Data updates every 6 seconds. Charts show 15-minute candlestick intervals.
          </p>
          <p className="mt-1">
            USD prices sourced from Uniswap V3 ETH/USDC pool.
          </p>
        </div>
      </div>
    </div>
  )
} 