import React from 'react';
import { Link, ArrowRight, Lock, Unlock } from 'lucide-react';

const DependencyLink = ({ parentTask, childTask }) => {
  const isResolved = parentTask.status === 'done';

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
      {/* Visual Indicator of the Block */}
      <div className={`p-2 rounded-full ${isResolved ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
        {isResolved ? <Unlock size={16} /> : <Lock size={16} />}
      </div>

      <div className="flex-1">
        <div className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>{parentTask.title}</span>
          <ArrowRight size={12} className="mx-2" />
          <span className="text-slate-600">{childTask.title}</span>
        </div>
        <p className="text-sm text-slate-500 italic">
          {isResolved 
            ? "Ready to start — dependency cleared." 
            : `Blocked until ${parentTask.assignee} finishes.`}
        </p>
      </div>
    </div>
  );
};