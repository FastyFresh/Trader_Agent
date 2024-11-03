import { useState } from 'react';
import {
  FaHome,
  FaChartLine,
  FaChartBar,
  FaShieldAlt,
  FaChartPie,
  FaCog
} from 'react-icons/fa';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: <FaHome size={20} />, label: 'Dashboard' },
  { id: 'trading', icon: <FaChartLine size={20} />, label: 'Trading' },
  { id: 'analytics', icon: <FaChartBar size={20} />, label: 'Analytics' },
  { id: 'risk', icon: <FaShieldAlt size={20} />, label: 'Risk Management' },
  { id: 'performance', icon: <FaChartPie size={20} />, label: 'Performance' },
  { id: 'settings', icon: <FaCog size={20} />, label: 'Settings' },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-800 transition-all duration-300 z-40 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-6 bg-gray-700 rounded-full p-1 hover:bg-gray-600 transition-colors"
      >
        <svg
          className={`w-4 h-4 text-gray-300 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="h-full py-4">
        <nav className="h-full flex flex-col">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                activeItem === item.id ? 'bg-gray-700 text-white' : ''
              }`}
            >
              <span className="mr-4">{item.icon}</span>
              <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className={`text-sm text-gray-400 border-t border-gray-700 pt-4 ${!isOpen ? 'hidden' : ''}`}>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Trading System</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Market Data</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Risk System</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;