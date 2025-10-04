import React, { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts'
import { 
  BarChart3, 
  RefreshCw, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Activity
} from 'lucide-react'

const AdvancedChart = ({ 
  data = [], 
  symbol = '', 
  height = 500,
  onRefresh = null,
  loading = false 
}) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const candleSeries = useRef(null)
  const volumeSeries = useRef(null)
  const smaSeries = useRef(null)
  const [timeframe, setTimeframe] = useState('1D')
  const [showSMA, setShowSMA] = useState(true)
  const [showVolume, setShowVolume] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Timeframe options
  const timeframes = [
    { value: '1H', label: '1 Hour' },
    { value: '4H', label: '4 Hours' },
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' }
  ]

  // Format data for TradingView
  const formatData = (rawData) => {
    if (!rawData || rawData.length === 0) return []
    
    return rawData.map(item => ({
      time: new Date(item.timestamp).getTime() / 1000,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: item.volume ? parseFloat(item.volume) : 0
    })).sort((a, b) => a.time - b.time)
  }

  // Calculate Simple Moving Average
  const calculateSMA = (data, period = 20) => {
    if (data.length < period) return []
    
    const smaData = []
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0)
      const average = sum / period
      smaData.push({
        time: data[i].time,
        value: average
      })
    }
    return smaData
  }

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return

    // Clean up existing chart
    if (chartInstance.current) {
      chartInstance.current.remove()
      chartInstance.current = null
    }

    // Ensure container has dimensions
    const container = chartRef.current
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      // Wait for next tick to ensure container is rendered
      setTimeout(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          createChartInstance()
        }
      }, 100)
      return
    }

    createChartInstance()

    function createChartInstance() {
      try {
        chartInstance.current = createChart(container, {
          width: container.clientWidth || 800,
          height: height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333333',
        fontSize: 12,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      },
      grid: {
        vertLines: { color: '#f0f0f0', style: 1, visible: true },
        horzLines: { color: '#f0f0f0', style: 1, visible: true }
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 0.5,
          style: 2,
          labelBackgroundColor: '#f4f6f8'
        },
        horzLine: {
          color: '#758696',
          width: 0.5,
          style: 2,
          labelBackgroundColor: '#f4f6f8'
        }
      },
      rightPriceScale: {
        borderColor: '#cccccc',
        scaleMargins: { top: 0.1, bottom: 0.1 }
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 3,
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        shiftVisibleRangeOnNewBar: true
      },
      watermark: {
        color: 'rgba(11, 94, 29, 0.4)',
        visible: true,
        fontSize: 12,
        text: symbol ? `${symbol} - ${timeframe}` : 'Advanced Chart',
        horzAlign: 'left',
        vertAlign: 'top'
      }
    })

        // Add candlestick series using v5.x API
        if (chartInstance.current && chartInstance.current.addSeries) {
          console.log('Adding series with v5.x API...')
          try {
            // Add candlestick series
            candleSeries.current = chartInstance.current.addSeries(CandlestickSeries, {
              upColor: '#26a69a',
              downColor: '#ef5350',
              borderVisible: false,
              wickUpColor: '#26a69a',
              wickDownColor: '#ef5350',
              priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01
              }
            })
            console.log('✅ Candlestick series created:', candleSeries.current)

            // Add volume series
            if (showVolume) {
              volumeSeries.current = chartInstance.current.addSeries(HistogramSeries, {
                color: '#26a69a',
                priceFormat: { type: 'volume' },
                priceScaleId: 'volume'
              })
              console.log('✅ Volume series created:', volumeSeries.current)
            }

            // Add SMA series
            if (showSMA) {
              smaSeries.current = chartInstance.current.addSeries(LineSeries, {
                color: '#ff6b35',
                lineWidth: 2,
                priceFormat: {
                  type: 'price',
                  precision: 2,
                  minMove: 0.01
                }
              })
              console.log('✅ SMA series created:', smaSeries.current)
            }
            
            console.log('✅ All series added successfully!')
          } catch (error) {
            console.error('❌ Error adding series with v5.x API:', error)
            console.log('Trying v4.x fallback...')
            
            // Fallback to v4.x API
            try {
              if (chartInstance.current.addCandlestickSeries) {
                candleSeries.current = chartInstance.current.addCandlestickSeries({
                  upColor: '#26a69a',
                  downColor: '#ef5350',
                  borderVisible: false,
                  wickUpColor: '#26a69a',
                  wickDownColor: '#ef5350',
                  priceFormat: {
                    type: 'price',
                    precision: 2,
                    minMove: 0.01
                  }
                })
                console.log('✅ Candlestick series created with v4.x fallback')
              }
            } catch (fallbackError) {
              console.error('❌ All methods failed:', fallbackError)
            }
          }
        } else {
          console.error('Chart instance does not have addSeries method')
        }
      } catch (error) {
        console.error('Error creating chart:', error)
      }
    }

    const handleResize = () => {
      if (chartInstance.current && chartRef.current) {
        chartInstance.current.applyOptions({
          width: chartRef.current.clientWidth
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartInstance.current) {
        chartInstance.current.remove()
        chartInstance.current = null
      }
    }
  }, [height, showVolume, showSMA, symbol, timeframe])

  // Update chart data
  useEffect(() => {
    if (!chartInstance.current || !candleSeries.current) return

    const formattedData = formatData(data)
    
    if (formattedData.length > 0) {
      candleSeries.current.setData(formattedData)
      
      // Update volume data
      if (showVolume && volumeSeries.current) {
        const volumeData = formattedData.map(item => ({
          time: item.time,
          value: item.volume,
          color: item.close >= item.open ? '#26a69a' : '#ef5350'
        }))
        volumeSeries.current.setData(volumeData)
      }

      // Update SMA data
      if (showSMA && smaSeries.current) {
        const smaData = calculateSMA(formattedData, 20)
        smaSeries.current.setData(smaData)
      }

      chartInstance.current.timeScale().fitContent()
    }
  }, [data, showVolume, showSMA])

  // Calculate statistics
  const getStatistics = () => {
    if (data.length < 2) return null
    
    const prices = data.map(item => parseFloat(item.close))
    const volumes = data.map(item => parseFloat(item.volume || 0))
    
    const currentPrice = prices[prices.length - 1]
    const previousPrice = prices[prices.length - 2]
    const change = currentPrice - previousPrice
    const changePercent = (change / previousPrice) * 100
    
    const high = Math.max(...prices)
    const low = Math.min(...prices)
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length
    
    return {
      currentPrice,
      change,
      changePercent,
      high,
      low,
      avgVolume,
      isPositive: change >= 0
    }
  }

  const stats = getStatistics()

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {symbol || 'Advanced Chart'}
            </h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {data.length > 0 ? `${data.length} data points` : 'No data'}
              </span>
              {stats && (
                <div className={`flex items-center space-x-1 ${
                  stats.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {stats.changePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {timeframes.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  timeframe === tf.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Chart Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`p-2 rounded-lg transition-colors ${
                showSMA ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle SMA"
            >
              <Activity className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`p-2 rounded-lg transition-colors ${
                showVolume ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle Volume"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading || isLoading}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 ${(loading || isLoading) ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <div 
          ref={chartRef} 
          className="w-full"
          style={{ height: `${height}px` }}
        />
        
        {/* Loading Overlay */}
        {(loading || isLoading) && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading chart data...</span>
            </div>
          </div>
        )}

        {/* No Data State */}
        {data.length === 0 && !loading && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No chart data available</p>
              <p className="text-sm text-gray-400 mt-1">
                Select a symbol to view advanced chart
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer with Statistics */}
      {stats && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current Price:</span>
              <span className={`ml-2 font-medium ${
                stats.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                ${stats.currentPrice.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">24h High:</span>
              <span className="ml-2 font-medium text-green-600">
                ${stats.high.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">24h Low:</span>
              <span className="ml-2 font-medium text-red-600">
                ${stats.low.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Avg Volume:</span>
              <span className="ml-2 font-medium text-gray-900">
                {stats.avgVolume.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedChart
