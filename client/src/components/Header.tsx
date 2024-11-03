import WalletConnect from './WalletConnect';

interface HeaderProps {
  onConnect: (publicKey: string) => void;
}

const Header = ({ onConnect }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gray-800 shadow-md flex items-center justify-between px-4 z-50">
      <div className="flex items-center">
        <img 
          src="/logo.svg" 
          alt="Trader Agent"
          className="h-8 w-8 mr-3"
        />
        <h1 className="text-xl font-bold">Trader Agent</h1>
        <span className="ml-4 text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">Beta</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-300">System: Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-300">Drift: Connected</span>
        </div>
        <div className="h-6 w-px bg-gray-700" />
        <WalletConnect onConnect={onConnect} />
      </div>
    </header>
  );
};

export default Header;