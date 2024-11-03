import { Menu, Bell, Settings } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 fixed w-full z-50 top-0">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-xl font-bold text-white">Trader Agent</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <div className="px-3 py-1 rounded-full bg-green-600/20 text-green-400 border border-green-600/20">
              System Online
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/20">
              API Connected
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>
            <button 
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>

            <div className="border-l border-gray-700 h-6 mx-2"></div>

            <div className="flex items-center">
              <button 
                className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600"
                aria-label="User menu"
              >
                <span className="text-sm font-medium text-white">TR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header