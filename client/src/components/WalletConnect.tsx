import { useEffect, useState } from 'react';
import { PhantomProvider } from '../types/phantom';
import markets from '../../../server/src/config/markets';

const WalletConnect = ({ onConnect }: { onConnect: (publicKey: string) => void }) => {
    const [provider, setProvider] = useState<PhantomProvider | null>(null);
    const [connected, setConnected] = useState(false);
    const [pubKey, setPubKey] = useState('');
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        if ("solana" in window) {
            const solWindow = window as any;
            setProvider(solWindow.solana);
            if (solWindow.solana.isConnected) {
                setConnected(true);
                setPubKey(solWindow.solana.publicKey.toString());
                checkBalance(solWindow.solana.publicKey.toString());
            }
        }
    }, []);

    const checkBalance = async (publicKey: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/balance/${publicKey}`);
            const data = await response.json();
            setBalance(data.balance);
            return data.balance;
        } catch (err) {
            console.error("Failed to check balance:", err);
            return 0;
        }
    };

    const connectWallet = async () => {
        try {
            if (provider) {
                const response = await provider.connect();
                setConnected(true);
                setPubKey(response.publicKey.toString());
                const balance = await checkBalance(response.publicKey.toString());
                
                // Calculate required balance in SOL based on current price
                const requiredSol = markets['SOL-PERP'].requiredBalance; // ~$125 worth of SOL
                
                if (balance >= requiredSol) {
                    onConnect(response.publicKey.toString());
                } else {
                    console.warn(`Insufficient balance. Need ${requiredSol} SOL (≈$125) for trading.`);
                }
            }
        } catch (err) {
            console.error("Failed to connect wallet:", err);
        }
    };

    const disconnectWallet = async () => {
        try {
            if (provider) {
                await provider.disconnect();
                setConnected(false);
                setPubKey('');
                setBalance(null);
            }
        } catch (err) {
            console.error("Failed to disconnect wallet:", err);
        }
    };

    const getBalanceDisplay = () => {
        if (balance === null) return '';
        const solPrice = markets['SOL-PERP'].currentPrice;
        const usdValue = balance * solPrice;
        return `${balance.toFixed(2)} SOL (≈$${usdValue.toFixed(2)})`;
    };

    if (!provider) {
        return (
            <a
                href="https://phantom.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
            >
                Get Phantom Wallet
            </a>
        );
    }

    return (
        <div className="flex flex-col space-y-2">
            {connected ? (
                <>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">
                            {pubKey.slice(0, 4)}...{pubKey.slice(-4)}
                        </span>
                        {balance !== null && (
                            <span className="text-sm text-gray-300">
                                {getBalanceDisplay()}
                            </span>
                        )}
                        <button
                            onClick={disconnectWallet}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                    {balance !== null && balance < markets['SOL-PERP'].requiredBalance && (
                        <div className="text-xs text-yellow-400">
                            Need {markets['SOL-PERP'].requiredBalance} SOL (≈$125) for trading
                        </div>
                    )}
                </>
            ) : (
                <button
                    onClick={connectWallet}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                >
                    Connect Wallet
                </button>
            )}
        </div>
    );
};

export default WalletConnect;