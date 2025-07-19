// Configuration file for the Cross-Chain Gas Price Tracker
// Update these values with your own API keys and endpoints

export const CONFIG = {
  // Infura API Key - Get your free key at https://infura.io/
  // Replace with your actual Infura API key
  INFURA_API_KEY: process.env.NEXT_PUBLIC_INFURA_API_KEY || 'YOUR_INFURA_API_KEY_HERE',
  
  // RPC Endpoints
  RPC_ENDPOINTS: {
    ethereum: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'wss://mainnet.infura.io/ws/v3/YOUR_INFURA_API_KEY_HERE',
    polygon: process.env.NEXT_PUBLIC_POLYGON_RPC || 'wss://polygon-rpc.com',
    arbitrum: process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'wss://arb1.arbitrum.io/ws',
  },
  
  // Uniswap V3 ETH/USDC Pool Address
  UNISWAP_V3_POOL: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
  
  // Update intervals (in milliseconds)
  UPDATE_INTERVALS: {
    gasPrice: 6000, // 6 seconds
    usdPrice: 30000, // 30 seconds
  },
  
  // Chart settings
  CHART: {
    historyWindow: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    candlestickInterval: 15 * 60 * 1000, // 15 minutes in milliseconds
  },
}

// Helper function to get RPC endpoint with API key
export const getRpcEndpoint = (chain: 'ethereum' | 'polygon' | 'arbitrum'): string => {
  const endpoint = CONFIG.RPC_ENDPOINTS[chain]
  if (chain === 'ethereum' && endpoint.includes('YOUR_INFURA_API_KEY_HERE')) {
    console.warn('⚠️  Please configure your Infura API key in config.ts or set NEXT_PUBLIC_INFURA_API_KEY environment variable')
    return endpoint.replace('YOUR_INFURA_API_KEY_HERE', CONFIG.INFURA_API_KEY)
  }
  return endpoint
} 