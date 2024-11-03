import { useState } from 'react';

const Settings = () => {
  const [notifications, setNotifications] = useState({
    trades: true,
    riskAlerts: true,
    performance: false,
    news: true,
  });

  const [theme, setTheme] = useState('dark');
  const [timeZone, setTimeZone] = useState('UTC');
  const [currency, setCurrency] = useState('USD');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-400">
                Trade Notifications
              </label>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, trades: !prev.trades }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none ${
                  notifications.trades ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition ${
                    notifications.trades ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-400">
                Risk Alerts
              </label>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, riskAlerts: !prev.riskAlerts }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none ${
                  notifications.riskAlerts ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition ${
                    notifications.riskAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-400">
                Performance Updates
              </label>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, performance: !prev.performance }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none ${
                  notifications.performance ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition ${
                    notifications.performance ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-400">
                Market News
              </label>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, news: !prev.news }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none ${
                  notifications.news ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition ${
                    notifications.news ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Time Zone
              </label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="EST">EST</option>
                <option value="PST">PST</option>
                <option value="GMT">GMT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Display Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">API Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                API Key
              </label>
              <input
                type="password"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value="●●●●●●●●●●●●●●●●"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                API Secret
              </label>
              <input
                type="password"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value="●●●●●●●●●●●●●●●●"
                readOnly
              />
            </div>
            <button
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
            >
              Generate New Keys
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Account</h3>
          <div className="space-y-4">
            <button
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 hover:bg-gray-600"
            >
              Export Trade History
            </button>
            <button
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 hover:bg-gray-600"
            >
              Reset Settings
            </button>
            <button
              className="w-full bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;