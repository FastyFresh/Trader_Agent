import { FC } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import Launcher from './components/Launcher';

import '@solana/wallet-adapter-react-ui/styles.css';
import './styles/index.css';

const App: FC = () => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);

  // Custom RPC connection
  const connection = new Connection(endpoint, {
    commitment: 'confirmed',
    wsEndpoint: endpoint.replace('https', 'wss')
  });

  const wallets = [
    new PhantomWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Launcher />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
