import React from 'react';
import { Calendar, ExternalLink, FileText, User, Link as LinkIcon, Trash2 } from 'lucide-react';

const TaskCard = ({ task, onDelete }: { task: any, onDelete: (id: number) => void }) => {
  // Logic to check if task is overdue
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      {/* Header: Title, Points, and Trash Button */}
      <div className="flex justify-between items-start mb-1">
        <div>
          <h4 className="font-semibold text-slate-800 leading-tight">{task.title}</h4>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded">
            {task.size} pts
          </span>
        </div>

        {/* This button uses the 'onDelete' function passed down from page.tsx */}
        <button 
          onClick={() => onDelete(task.id)} 
          className="text-slate-300 hover:text-red-500 transition-colors p-1"
          title="Delete Task"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Due Date Display */}
      {task.due_date && (
        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase mb-3 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
          <Calendar size={12} />
          {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4">
        {/* Assignee */}
        <div className="flex items-center gap-2 text-slate-500">
          <User size={14} />
          <span className="text-xs font-medium">{task.assignee}</span>
        </div>

        {/* Asset Link */}
        {task.drive_url && (
          <a 
            href={task.drive_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
          >
            {task.drive_url.includes('drive.google.com') ? <FileText size={14} /> : <LinkIcon size={14} />}
            Asset <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
};

export default TaskCard;