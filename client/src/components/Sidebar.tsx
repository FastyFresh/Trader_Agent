import { Home, TrendingUp, LineChart, Shield, Settings, BarChart2 } from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  isOpen: boolean
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const [activeItem, setActiveItem] = useState('Dashboard')

  const menuItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'Trading', icon: TrendingUp },
    { name: 'Analytics', icon: LineChart },
    { name: 'Risk Management', icon: Shield },
    { name: 'Performance', icon: BarChart2 },
    { name: 'Settings', icon: Settings },
  ]

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 h-screen pt-16 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 bg-gray-800 border-r border-gray-700
      `}
    >
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.name}>
                <button
                  onClick={() => setActiveItem(item.name)}
                  className={`flex w-full items-center p-2 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white group
                    ${activeItem === item.name ? 'bg-gray-700 text-white' : ''}`}
                >
                  <Icon className="w-5 h-5 transition duration-75" />
                  <span className="ml-3">{item.name}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="pt-8 mt-8 border-t border-gray-700">
          <div className="px-2 space-y-2">
            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              System Status
            </h5>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-400">Trading System</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-400">Market Data Feed</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-400">Risk Management</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar