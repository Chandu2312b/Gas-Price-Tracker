'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts'
import { useAppStore, GasPoint } from '@/lib/store'

interface GasPriceChartProps {
  chain: 'ethereum' | 'polygon' | 'arbitrum'
  height?: number
}

export default function GasPriceChart({ chain, height = 400 }: GasPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  
  const chainData = useAppStore((state) => state.chains[chain])
  const mode = useAppStore((state) => state.mode)

  const [aggregatedData, setAggregatedData] = useState<CandlestickData[]>([])

  // Aggregate gas price data into 15-minute candlesticks
  const aggregateData = (history: GasPoint[]): CandlestickData[] => {
    const interval = 15 * 60 * 1000 // 15 minutes in milliseconds
    const aggregated: { [key: number]: GasPoint[] } = {}

    history.forEach((point) => {
      const intervalStart = Math.floor(point.timestamp / interval) * interval
      if (!aggregated[intervalStart]) {
        aggregated[intervalStart] = []
      }
      aggregated[intervalStart].push(point)
    })

    return Object.entries(aggregated)
      .map(([timestamp, points]) => {
        const prices = points.map(p => p.totalFee)
        const open = prices[0]
        const close = prices[prices.length - 1]
        const high = Math.max(...prices)
        const low = Math.min(...prices)

        return {
          time: Number(timestamp) / 1000, // Convert to seconds for chart
          open,
          high,
          low,
          close,
        }
      })
      .sort((a, b) => a.time - b.time)
  }

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    })

    chartRef.current = chart
    seriesRef.current = candlestickSeries

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        seriesRef.current = null
      }
    }
  }, [height])

  // Update chart data when history changes
  useEffect(() => {
    if (!seriesRef.current || !chainData.history.length) return

    const data = aggregateData(chainData.history)
    setAggregatedData(data)
    
    seriesRef.current.setData(data)
    
    // Fit content to view
    if (chartRef.current && data.length > 0) {
      chartRef.current.timeScale().fitContent()
    }
  }, [chainData.history])

  const getChainColor = () => {
    switch (chain) {
      case 'ethereum':
        return 'text-blue-600'
      case 'polygon':
        return 'text-purple-600'
      case 'arbitrum':
        return 'text-blue-400'
      default:
        return 'text-gray-600'
    }
  }

  const getChainName = () => {
    switch (chain) {
      case 'ethereum':
        return 'Ethereum'
      case 'polygon':
        return 'Polygon'
      case 'arbitrum':
        return 'Arbitrum'
      default:
        return chain
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${getChainColor()}`}>
          {getChainName()} Gas Price Chart
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Mode: {mode === 'live' ? 'Live' : 'Simulation'}
          </span>
          <div className={`w-2 h-2 rounded-full ${
            chainData.isConnected ? 'bg-success-500' : 'bg-danger-500'
          }`} />
        </div>
      </div>
      
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Base Fee:</span>
            <div className="font-mono">
              {chainData.baseFee ? `${(chainData.baseFee / 1e9).toFixed(2)} Gwei` : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Priority Fee:</span>
            <div className="font-mono">
              {chainData.priorityFee ? `${(chainData.priorityFee / 1e9).toFixed(2)} Gwei` : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Total Fee:</span>
            <div className="font-mono">
              {chainData.totalFee ? `${(chainData.totalFee / 1e9).toFixed(2)} Gwei` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div ref={chartContainerRef} className="w-full" />
      
      {aggregatedData.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-lg mb-2">No data available</div>
            <div className="text-sm">Waiting for gas price updates...</div>
          </div>
        </div>
      )}
    </div>
  )
} 