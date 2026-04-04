import React from 'react';

interface CapacityProps {
  user: string;
  points: number;
  maxCapacity: number;
}

const CapacityMeter = ({ user, points, maxCapacity }: CapacityProps) => {
  const usage = (points / maxCapacity) * 100;
  
  const getStatusColor = () => {
    if (usage > 110) return 'bg-red-500';
    if (usage < 70) return 'bg-blue-400';
    return 'bg-green-500';
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 w-64">
      <div className="flex justify-between items-end mb-2">
        <h3 className="font-bold text-slate-800">{user}</h3>
        <span className="text-sm font-mono text-slate-600">{points}/{maxCapacity}</span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getStatusColor()}`}
          style={{ width: `${Math.min(usage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default CapacityMeter;