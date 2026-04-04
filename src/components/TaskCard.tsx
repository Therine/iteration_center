import React from 'react';
import { Calendar, ExternalLink, FileText, User, Link as LinkIcon, Trash2, CheckCircle, Undo, AlertCircle } from 'lucide-react';

const TaskCard = ({ task, onDelete, onToggleComplete }: { 
  task: any, 
  onDelete: (id: string) => void,
  onToggleComplete: (id: string, currentStatus: boolean) => void 
}) => {
  const isOverdue = !task.is_completed && task.due_date && new Date(task.due_date) < new Date();
  const projectCount = task.task_project_links?.length || 0;

  // 1. Dependency Logic
  // Look into the 'blocked_by' array we joined in page.tsx
  const dependencies = task.blocked_by || [];
  const blockingTasks = dependencies.filter((d: any) => d.depends_on && !d.depends_on.is_completed);
  const isBlocked = blockingTasks.length > 0;

  // 2. Dynamic Styling Logic
  const getCardStyles = () => {
    if (task.is_completed) return 'bg-green-50 border-green-200 opacity-75';
    if (isBlocked) return 'bg-slate-50 border-dashed border-slate-300 shadow-none';
    if (projectCount >= 3) return 'bg-orange-50/50 border-orange-300 shadow-sm';
    return 'bg-white border-slate-200 hover:shadow-md';
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${getCardStyles()}`}>
      
      {/* 3. Dependency Alert Banner */}
      {isBlocked && !task.is_completed && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-700 uppercase mb-1">
            <AlertCircle size={12} /> Blocked By:
          </div>
          {blockingTasks.map((b: any) => (
            <p key={b.depends_on.id} className="text-[10px] text-amber-600 italic pl-4">
              • {b.depends_on.title}
            </p>
          ))}
        </div>
      )}

      {/* 4. High Impact Badge */}
      {!task.is_completed && !isBlocked && projectCount >= 2 && (
        <div className="text-[10px] font-black text-orange-600 uppercase mb-2 flex items-center gap-1">
          🔥 High Impact ({projectCount} Projects)
        </div>
      )}

      {/* 5. Project Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {task.task_project_links?.map((link: any, index: number) => (
          <span 
            key={index} 
            className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
              task.is_completed ? 'bg-green-200 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {link.projects?.name || 'General Task'}
          </span>
        ))}
      </div>

      {/* 6. Header: Title and Actions */}
      <div className="flex justify-between items-start mb-1">
        <div>
          <h4 className={`font-semibold leading-tight ${
            task.is_completed ? 'text-green-800 line-through' : isBlocked ? 'text-slate-400' : 'text-slate-800'
          }`}>
            {task.title}
          </h4>
          <span className={`${task.is_completed ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-600'} text-[10px] font-bold px-2 py-1 rounded inline-block mt-1`}>
            {task.size} pts
          </span>
        </div>

        <div className="flex gap-2">
          <button 
            disabled={isBlocked && !task.is_completed}
            onClick={() => onToggleComplete(task.id, task.is_completed)}
            className={`${
              task.is_completed ? 'text-green-600' : isBlocked ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-green-500'
            } transition-colors`}
            title={isBlocked ? "Finish blocking task first" : "Complete"}
          >
            {task.is_completed ? <Undo size={18} /> : <CheckCircle size={18} />}
          </button>
          
          <button 
            onClick={() => onDelete(task.id)} 
            className="text-slate-300 hover:text-red-500 transition-colors p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* 7. Due Date */}
      {!task.is_completed && task.due_date && (
        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase my-3 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
          <Calendar size={12} />
          {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      )}
      
      {/* 8. Footer: Assignee and Assets */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-slate-500">
          <User size={14} />
          <span className="text-xs font-medium">{task.assignee}</span>
        </div>

        {task.drive_url && (
          <a 
            href={task.drive_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline transition-all"
          >
            <FileText size={14} /> Asset <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
};

export default TaskCard;