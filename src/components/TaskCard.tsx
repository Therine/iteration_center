import React from 'react';
import { ExternalLink, FileText, User } from 'lucide-react';

interface TaskProps {
  task: {
    title: string;
    size: number;
    assignee: string;
    driveUrl?: string;
  };
}

const TaskCard = ({ task }: TaskProps) => {
  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-slate-800 leading-tight">{task.title}</h4>
        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
          {task.size} pts
        </span>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-slate-500">
          <User size={14} />
          <span className="text-xs font-medium">{task.assignee}</span>
        </div>

        {task.driveUrl && (
          <a 
            href={task.driveUrl} 
            target="_blank" 
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <FileText size={14} />
            Asset <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
};

export default TaskCard;