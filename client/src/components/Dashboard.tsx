import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const Dashboard = () => {
  return (
    <div className="grid gap-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Trading Dashboard</h2>
      </div>
    </div>
  );
};

export default Dashboard;