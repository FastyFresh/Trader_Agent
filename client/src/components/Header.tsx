import { FaBars } from 'react-icons/fa';
import WalletConnect from './WalletConnect';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gray-800 shadow-md flex items-center justify-between px-4 z-50">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="text-gray-400 hover:text-white transition-colors mr-4"
        >
          <FaBars size={24} />
        </button>
        <h1 className="text-xl font-bold">Trader Agent</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-300">System Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-300">API Connected</span>
        </div>
        <WalletConnect />
      </div>
    </header>
  );
};

export default Header;