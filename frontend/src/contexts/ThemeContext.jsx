import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    mode: 'light',
    primaryColor: 'blue',
    sidebarCollapsed: false
  })

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('tradelab_theme')
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme)
        setTheme(parsedTheme)
        applyTheme(parsedTheme)
      } catch (error) {
        console.error('Error loading theme from localStorage:', error)
      }
    }
  }, [])

  // Apply theme to document
  const applyTheme = (themeConfig) => {
    const root = document.documentElement
    
    // Apply color scheme
    root.setAttribute('data-theme', themeConfig.mode)
    
    // Apply primary color
    root.setAttribute('data-primary-color', themeConfig.primaryColor)
    
    // Apply sidebar state
    if (themeConfig.sidebarCollapsed) {
      root.classList.add('sidebar-collapsed')
    } else {
      root.classList.remove('sidebar-collapsed')
    }
  }

  // Update theme and save to localStorage
  const updateTheme = (newTheme) => {
    const updatedTheme = { ...theme, ...newTheme }
    setTheme(updatedTheme)
    localStorage.setItem('tradelab_theme', JSON.stringify(updatedTheme))
    applyTheme(updatedTheme)
  }

  // Toggle theme mode
  const toggleMode = () => {
    updateTheme({ mode: theme.mode === 'light' ? 'dark' : 'light' })
  }

  // Set primary color
  const setPrimaryColor = (color) => {
    updateTheme({ primaryColor: color })
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    updateTheme({ sidebarCollapsed: !theme.sidebarCollapsed })
  }

  const value = {
    theme,
    updateTheme,
    toggleMode,
    setPrimaryColor,
    toggleSidebar
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
