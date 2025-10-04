import React, { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react'

// Debug: Check if the library is loaded correctly
console.log('TradingView createChart:', createChart)
console.log('TradingView createChart type:', typeof createChart)

const CandlestickChart = ({ 
  data = [], 
  symbol = '', 
  height = 400, 
  showVolume = true,
  onRefresh = null,
  loading = false 
}) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const candleSeries = useRef(null)
  const volumeSeries = useRef(null)
  const [isLoading, setIsLoading] = useState(false)

  // Format data for TradingView
  const formatData = (rawData) => {
    if (!rawData || rawData.length === 0) return []
    
    return rawData.map(item => ({
      time: new Date(item.timestamp).getTime() / 1000, // Convert to seconds
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: item.volume ? parseFloat(item.volume) : 0
    })).sort((a, b) => a.time - b.time)
  }

  // Initialize chart
  useEffect(() => {
    console.log('🎯 CandlestickChart useEffect triggered')
    console.log('📊 Data length:', data.length)
    console.log('📏 Height:', height)
    console.log('🏷️ Symbol:', symbol)
    
    if (!chartRef.current) {
      console.log('❌ chartRef.current is null')
      return
    }

    // Clean up existing chart
    if (chartInstance.current) {
      console.log('🧹 Cleaning up existing chart')
      chartInstance.current.remove()
      chartInstance.current = null
    }

    // Ensure container has dimensions
    const container = chartRef.current
    console.log('📐 Container dimensions:', {
      width: container.clientWidth,
      height: container.clientHeight,
      offsetWidth: container.offsetWidth,
      offsetHeight: container.offsetHeight
    })
    
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.log('⏳ Container has no dimensions, waiting...')
      // Wait for next tick to ensure container is rendered
      setTimeout(() => {
        console.log('⏳ Retry - Container dimensions:', {
          width: container.clientWidth,
          height: container.clientHeight
        })
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          createChartInstance()
        } else {
          console.log('❌ Container still has no dimensions after timeout')
        }
      }, 100)
      return
    }

    console.log('✅ Container has dimensions, creating chart...')
    createChartInstance()

    function createChartInstance() {
      try {
        console.log('Creating chart with TradingView library...')
        
        // Create new chart with minimum dimensions
        const chartWidth = Math.max(container.clientWidth || 800, 400)
        const chartHeight = Math.max(height, 300)
        
        console.log('📐 Creating chart with dimensions:', {
          width: chartWidth,
          height: chartHeight,
          containerWidth: container.clientWidth,
          containerHeight: container.clientHeight
        })
        
        const chart = createChart(container, {
          width: chartWidth,
          height: chartHeight,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#333333',
            fontSize: 12,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
          },
          grid: {
            vertLines: { 
              color: '#f0f0f0',
              style: 1,
              visible: true
            },
            horzLines: { 
              color: '#f0f0f0',
              style: 1,
              visible: true
            }
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
            scaleMargins: {
              top: 0.1,
              bottom: 0.1
            }
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
            text: symbol ? `${symbol} Chart` : 'Price Chart',
            horzAlign: 'left',
            vertAlign: 'top'
          }
        })

        console.log('Chart created:', chart)
        console.log('Chart methods:', Object.getOwnPropertyNames(chart))
        console.log('Chart prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chart)))
        
        // Check for the correct method name in v5.x
        console.log('Chart object keys:', Object.keys(chart))
        console.log('Chart object values:', Object.values(chart))
        
        // Try different possible method names
        const possibleMethods = [
          'addCandlestickSeries',
          'addSeries', 
          'addLineSeries',
          'addAreaSeries',
          'addHistogramSeries'
        ]
        
        possibleMethods.forEach(method => {
          console.log(`${method}:`, typeof chart[method])
        })
        
        // Try to find the method on the prototype
        const prototype = Object.getPrototypeOf(chart)
        console.log('Prototype keys:', Object.keys(prototype))
        
        const addCandlestickMethod = chart.addCandlestickSeries || chart.addSeries
        console.log('addCandlestickSeries method:', typeof addCandlestickMethod)
        console.log('addSeries method:', typeof chart.addSeries)

        chartInstance.current = chart

        // Add candlestick series using the correct lightweight-charts v5.x API
        if (chart && chart.addSeries) {
          console.log('Adding candlestick series with lightweight-charts v5.x API...')
          try {
            // Use the imported series types directly
            console.log('Using imported CandlestickSeries:', CandlestickSeries)
            
            candleSeries.current = chart.addSeries(CandlestickSeries, {
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
            console.log('✅ Candlestick series created with v5.x API:', candleSeries.current)

            // Add volume series if enabled
            if (showVolume) {
              console.log('Adding volume series...')
              volumeSeries.current = chart.addSeries(HistogramSeries, {
                color: '#26a69a',
                priceFormat: {
                  type: 'volume'
                },
                priceScaleId: 'volume'
              })
              console.log('✅ Volume series created:', volumeSeries.current)
            }
            
            console.log('✅ Chart series added successfully!')
          } catch (error) {
            console.error('❌ Error with v5.x API:', error)
            console.log('Trying v4.x fallback approach...')
            
            // Fallback: try the old v4.x API
            try {
              if (chart.addCandlestickSeries) {
                candleSeries.current = chart.addCandlestickSeries({
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
                console.log('✅ Candlestick series created with v4.x API:', candleSeries.current)
              } else {
                throw new Error('No candlestick series method available')
              }
            } catch (fallbackError) {
              console.error('❌ All methods failed:', fallbackError)
              console.log('Available methods on chart:', Object.getOwnPropertyNames(chart))
              console.log('Chart prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chart)))
              chartInstance.current = null
            }
          }
        } else {
          console.error('❌ Chart does not have addSeries method:', chart)
          console.log('Available methods:', Object.getOwnPropertyNames(chart))
          chartInstance.current = null
        }
      } catch (error) {
        console.error('Error creating chart:', error)
        chartInstance.current = null
      }
    }

    // Handle resize
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
  }, [height, showVolume, symbol])

  // Update chart data
  useEffect(() => {
    console.log('📈 Data update effect triggered')
    console.log('📊 Chart instance exists:', !!chartInstance.current)
    console.log('🕯️ Candle series exists:', !!candleSeries.current)
    console.log('📊 Data length:', data.length)
    
    if (!chartInstance.current || !candleSeries.current) {
      console.log('❌ Chart or series not ready, skipping data update')
      return
    }

    const formattedData = formatData(data)
    console.log('🔄 Formatted data:', formattedData.slice(0, 3))
    
    if (formattedData.length > 0) {
      console.log('📊 Setting candlestick data...')
      candleSeries.current.setData(formattedData)
      
      // Update volume data if enabled
      if (showVolume && volumeSeries.current) {
        console.log('📊 Setting volume data...')
        const volumeData = formattedData.map(item => ({
          time: item.time,
          value: item.volume,
          color: item.close >= item.open ? '#26a69a' : '#ef5350'
        }))
        volumeSeries.current.setData(volumeData)
      }

      // Fit content to show all data
      console.log('📊 Fitting content...')
      chartInstance.current.timeScale().fitContent()
      console.log('✅ Chart data updated successfully!')
    } else {
      console.log('❌ No formatted data to display')
    }
  }, [data, showVolume])

  // Calculate price change
  const getPriceChange = () => {
    if (data.length < 2) return { change: 0, changePercent: 0, isPositive: true }
    
    const firstPrice = parseFloat(data[0].close)
    const lastPrice = parseFloat(data[data.length - 1].close)
    const change = lastPrice - firstPrice
    const changePercent = (change / firstPrice) * 100
    
    return {
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2),
      isPositive: change >= 0
    }
  }

  const priceChange = getPriceChange()

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
              {symbol || 'Price Chart'}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {data.length > 0 ? `${data.length} data points` : 'No data'}
              </span>
              {data.length > 0 && (
                <div className={`flex items-center space-x-1 ${
                  priceChange.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {priceChange.isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {priceChange.changePercent}%
                  </span>
                </div>
              )}
              {chartInstance.current && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                  TradingView Active
                </span>
              )}
            </div>
          </div>
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading || isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || isLoading) ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative">
        <div 
          ref={chartRef} 
          className="w-full"
          style={{ 
            height: `${height}px`,
            minHeight: '300px',
            minWidth: '400px'
          }}
        />
        
        {!chartInstance.current && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Chart not available</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Chart initialization failed
                    </p>
            </div>
          </div>
        )}
          
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
                  Select a symbol to view price chart
                </p>
              </div>
            </div>
          )}
        </div>

      {/* Chart Footer */}
      {data.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Open:</span>
              <span className="ml-2 font-medium">
                ${parseFloat(data[data.length - 1].open).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">High:</span>
              <span className="ml-2 font-medium text-green-600">
                ${parseFloat(data[data.length - 1].high).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Low:</span>
              <span className="ml-2 font-medium text-red-600">
                ${parseFloat(data[data.length - 1].low).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Close:</span>
              <span className={`ml-2 font-medium ${
                priceChange.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                ${parseFloat(data[data.length - 1].close).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CandlestickChart
