import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './components/Dashboard'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

const queryClient = new QueryClient()

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`flex-1 p-4 transition-all ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <Dashboard />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
