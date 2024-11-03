import { useState, useEffect } from 'react';
import WalletConnect from './WalletConnect';
import { useConnection } from '@solana/web3.js';

interface LauncherProps {
    onStart: () => void;
}

const Launcher = ({ onStart }: LauncherProps) => {
    const [balance, setBalance] = useState<number | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isStarted, setIsStarted] = useState(false);
    const { connection } = useConnection();

    const checkRequirements = async (publicKey: string) => {
        setIsChecking(true);
        setError(null);
        
        try {
            const solBalance = await connection.getBalance(publicKey);
            const solInUSD = solBalance * 0.01; // Simplified conversion
            setBalance(solInUSD);

            if (solInUSD < 125) {
                setError('Insufficient funds. You need at least $125 worth of SOL ($100 for trading + $25 for gas fees)');
                return false;
            }

            return true;
        } catch (err) {
            setError('Failed to check wallet balance');
            return false;
        } finally {
            setIsChecking(false);
        }
    };

    const handleStart = async () => {
        if (!isStarted) {
            setIsStarted(true);
            onStart();
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 max-w-lg mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-6">Launch Trading Bot</h2>
            
            <div className="space-y-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                    <ul className="space-y-2 text-gray-300">
                        <li className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            Phantom Wallet Connection
                        </li>
                        <li className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            Minimum $125 worth of SOL
                        </li>
                        <li className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            Drift Protocol Access
                        </li>
                    </ul>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Connect Wallet</h3>
                    <WalletConnect onConnect={checkRequirements} />
                    
                    {isChecking && (
                        <div className="mt-4 text-gray-400">
                            Checking wallet balance...
                        </div>
                    )}
                    
                    {balance !== null && (
                        <div className="mt-4">
                            <div className="text-sm text-gray-400">Available Balance:</div>
                            <div className="text-xl font-semibold">${balance.toFixed(2)}</div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {balance !== null && balance >= 125 && !isStarted && (
                    <button
                        onClick={handleStart}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Start Trading Bot
                    </button>
                )}

                {isStarted && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center text-green-400">
                            <div className="animate-pulse h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            Trading Bot Active
                        </div>
                        <p className="mt-2 text-sm text-gray-400">
                            Your trading bot is now running. You can monitor its progress in the dashboard.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-6 text-sm text-gray-400">
                <p className="mb-2">Note:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>The bot will automatically manage your trades</li>
                    <li>Initial phase focuses on momentum trading</li>
                    <li>Strategy adjusts automatically as your balance grows</li>
                    <li>Emergency stop-loss protects your capital</li>
                </ul>
            </div>
        </div>
    );
};

export default Launcher;