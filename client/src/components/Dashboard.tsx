import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import PortfolioOverview from './PortfolioOverview';
import ActiveTrades from './ActiveTrades';
import PerformanceChart from './PerformanceChart';
import RiskMetrics from './RiskMetrics';
import StrategyManager from './StrategyManager';
import Launcher from './Launcher';

interface AutoTraderStatus {
    isRunning: boolean;
    currentPhase: string;
    currentBalance: number;
    activeMarkets: string[];
    performance: any;
    activeStrategies: string[];
}

const Dashboard = () => {
    const [isInitialized, setIsInitialized] = useState(false);

    const { data: status, error, isLoading } = useQuery<AutoTraderStatus>({
        queryKey: ['autoTraderStatus'],
        queryFn: () => 
            fetch('http://localhost:3000/api/autotrader/status')
                .then(res => res.json()),
        enabled: isInitialized,
        refetchInterval: 5000 // Refresh every 5 seconds
    });

    const handleStart = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/autotrader/start', {
                method: 'POST'
            });
            const result = await response.json();
            if (result.success) {
                setIsInitialized(true);
            }
        } catch (error) {
            console.error('Failed to start AutoTrader:', error);
        }
    };

    if (!isInitialized) {
        return <Launcher onStart={handleStart} />;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-lg">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 p-4">
                Error loading dashboard data
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Trading Status Header */}
            <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className={`h-3 w-3 rounded-full ${status?.isRunning ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                            <span className="font-medium">
                                {status?.isRunning ? 'Trading Active' : 'Trading Inactive'}
                            </span>
                        </div>
                        <div className="text-gray-400">
                            Phase: <span className="text-white">{status?.currentPhase}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-400">Current Balance</div>
                        <div className="text-xl font-bold">${status?.currentBalance.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PortfolioOverview 
                    balance={status?.currentBalance || 0}
                    performance={status?.performance}
                />
                <RiskMetrics 
                    phase={status?.currentPhase || ''}
                    metrics={status?.performance?.riskMetrics}
                />
                <ActiveTrades 
                    trades={status?.performance?.activeTrades || []}
                    markets={status?.activeMarkets || []}
                />
                <PerformanceChart 
                    data={status?.performance?.equityCurve || []}
                />
            </div>

            {/* Strategy Overview */}
            <StrategyManager 
                activeStrategies={status?.activeStrategies || []}
                phase={status?.currentPhase}
            />
        </div>
    );
};

export default Dashboard;