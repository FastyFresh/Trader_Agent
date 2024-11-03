import { NavLink } from 'react-router-dom';
import {
  FaHome,
  FaChartLine,
  FaChartBar,
  FaShieldAlt,
  FaChartPie,
  FaCog
} from 'react-icons/fa';

interface SidebarProps {
  isOpen: boolean;
}

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: <FaHome size={20} />, label: 'Dashboard' },
  { path: '/trading', icon: <FaChartLine size={20} />, label: 'Trading' },
  { path: '/analytics', icon: <FaChartBar size={20} />, label: 'Analytics' },
  { path: '/risk', icon: <FaShieldAlt size={20} />, label: 'Risk Management' },
  { path: '/performance', icon: <FaChartPie size={20} />, label: 'Performance' },
  { path: '/settings', icon: <FaCog size={20} />, label: 'Settings' },
];

const Sidebar = ({ isOpen }: SidebarProps) => {
  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-800 transition-all duration-300 z-40 ${
        isOpen ? 'w-64' : 'w-0'
      }`}
    >
      <div className="h-full py-4">
        <nav className="h-full flex flex-col">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                  isActive ? 'bg-gray-700 text-white' : ''
                }`
              }
            >
              <span className="mr-4">{item.icon}</span>
              <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-sm text-gray-400 border-t border-gray-700 pt-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Trading System</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Market Data Feed</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Risk Management</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;