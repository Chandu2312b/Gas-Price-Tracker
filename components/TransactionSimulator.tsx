'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export default function TransactionSimulator() {
  const [transactionValue, setTransactionValue] = useState('')
  const [gasLimit, setGasLimit] = useState('21000')
  
  const mode = useAppStore((state) => state.mode)
  const chains = useAppStore((state) => state.chains)
  const simulation = useAppStore((state) => state.simulation)
  const usdPrice = useAppStore((state) => state.usdPrice)
  const setMode = useAppStore((state) => state.setMode)
  const updateSimulation = useAppStore((state) => state.updateSimulation)
  const calculateSimulationCosts = useAppStore((state) => state.calculateSimulationCosts)

  const handleTransactionValueChange = (value: string) => {
    setTransactionValue(value)
    const numValue = parseFloat(value) || 0
    
    // Update simulation for all chains
    ;(['ethereum', 'polygon', 'arbitrum'] as const).forEach((chain) => {
      updateSimulation(chain, { transactionValue: numValue })
    })
  }

  const handleGasLimitChange = (value: string) => {
    setGasLimit(value)
    const numValue = parseInt(value) || 21000
    
    // Update simulation for all chains
    ;(['ethereum', 'polygon', 'arbitrum'] as const).forEach((chain) => {
      updateSimulation(chain, { gasLimit: numValue })
    })
  }

  useEffect(() => {
    if (transactionValue && usdPrice > 0) {
      calculateSimulationCosts()
    }
  }, [transactionValue, gasLimit, usdPrice, calculateSimulationCosts])

  const getChainInfo = (chain: 'ethereum' | 'polygon' | 'arbitrum') => {
    const chainData = chains[chain]
    const simData = simulation[chain]
    
    const gasCost = chainData.totalFee * simData.gasLimit
    const transactionCost = simData.transactionValue * usdPrice
    const totalCost = gasCost + transactionCost
    
    return {
      name: chain.charAt(0).toUpperCase() + chain.slice(1),
      gasCost,
      transactionCost,
      totalCost,
      isConnected: chainData.isConnected,
      totalFee: chainData.totalFee,
    }
  }

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatGwei = (amount: number) => {
    return `${(amount / 1e9).toFixed(2)} Gwei`
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Transaction Simulator</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setMode('live')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              mode === 'live'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Live Mode
          </button>
          <button
            onClick={() => setMode('simulation')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              mode === 'simulation'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Simulation Mode
          </button>
        </div>
      </div>

      {mode === 'simulation' && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Value (ETH/MATIC)
              </label>
              <input
                type="number"
                value={transactionValue}
                onChange={(e) => handleTransactionValueChange(e.target.value)}
                placeholder="0.5"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gas Limit
              </label>
              <input
                type="number"
                value={gasLimit}
                onChange={(e) => handleGasLimitChange(e.target.value)}
                placeholder="21000"
                min="21000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Current ETH Price:</span>
          <span className="font-mono font-semibold">
            {usdPrice > 0 ? formatUSD(usdPrice) : 'Loading...'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Chain</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Total Fee</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Gas Cost</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Transaction Cost</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {(['ethereum', 'polygon', 'arbitrum'] as const).map((chain) => {
              const info = getChainInfo(chain)
              
              return (
                <tr key={chain} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        info.isConnected ? 'bg-success-500' : 'bg-danger-500'
                      }`} />
                      <span className="font-medium">{info.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      info.isConnected
                        ? 'bg-success-100 text-success-700'
                        : 'bg-danger-100 text-danger-700'
                    }`}>
                      {info.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {info.totalFee > 0 ? formatGwei(info.totalFee) : 'N/A'}
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {info.gasCost > 0 ? formatUSD(info.gasCost) : 'N/A'}
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {info.transactionCost > 0 ? formatUSD(info.transactionCost) : 'N/A'}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold">
                    {info.totalCost > 0 ? formatUSD(info.totalCost) : 'N/A'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {mode === 'simulation' && transactionValue && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Simulation Summary</h3>
          <p className="text-sm text-blue-700">
            Simulating a transaction of {transactionValue} ETH/MATIC with a gas limit of {gasLimit} units.
            The table above shows the estimated costs across all chains based on current gas prices.
          </p>
        </div>
      )}
    </div>
  )
} 