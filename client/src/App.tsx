import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Trading from './components/Trading'
import Analytics from './components/Analytics'
import RiskManagement from './components/RiskManagement'
import Performance from './components/Performance'
import Settings from './components/Settings'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

const queryClient = new QueryClient()

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading Trader Agent...</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white relative">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={isSidebarOpen} />
          <main 
            className={`flex-1 p-4 transition-all duration-300 ${
              isSidebarOpen ? 'ml-64' : 'ml-0'
            } mt-16`}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/risk" element={<RiskManagement />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
