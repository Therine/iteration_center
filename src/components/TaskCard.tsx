'use client';
import React, { useState, useEffect } from 'react'; 
import { 
  Calendar, ExternalLink, FileText, User, Trash2, 
  CheckCircle, Undo, AlertCircle, Edit2, X, Save 
} from 'lucide-react';

const TaskCard = ({ task, onDelete, onToggleComplete, onUpdate, teamMembers, allProjects, allTasks }: { 
  task: any, 
  onDelete: (id: string) => void,
  onToggleComplete: (id: string, currentStatus: boolean) => void,
  onUpdate: (id: string, data: any) => void,
  teamMembers: any[],
  allProjects: any[],
  allTasks: any[]
}) => {
  // 1. EDIT STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editSize, setEditSize] = useState(task.size);
  const [editUrl, setEditUrl] = useState(task.drive_url || '');
  const [editProjectIds, setEditProjectIds] = useState<string[]>(
    task.task_project_links?.map((l: any) => l.projects?.id) || []
  );
  const [editAssignee, setEditAssignee] = useState(task.assignee);
  const [editDueDate, setEditDueDate] = useState(task.due_date || '');

  useEffect(() => {
    setEditTitle(task.title);
    setEditSize(task.size);
    setEditUrl(task.drive_url || '');
    setEditAssignee(task.assignee);
    setEditDueDate(task.due_date || '');
    setEditProjectIds(task.task_project_links?.map((l: any) => l.projects?.id) || []);
  }, [task]);

  // 2. DERIVED STATE
  const isOverdue = !task.is_completed && task.due_date && new Date(task.due_date) < new Date();
  const projectCount = task.task_project_links?.length || 0;
  const dependencies = task.blocked_by || [];
  const blockingTasks = dependencies.filter((d: any) => d.depends_on && !d.depends_on.is_completed);
  const isBlocked = blockingTasks.length > 0;
  
  // Dynamic lookup for the display name
  const currentMember = teamMembers?.find(m => m.id === task.assignee);

  // 3. ACTIONS
  const handleSave = () => {
    onUpdate(task.id, { 
      title: editTitle, 
      size: Number(editSize),
      drive_url: editUrl,
      projectIds: editProjectIds,
      assignee: editAssignee,
      due_date: editDueDate
    });
    setIsEditing(false);
  };

  const getCardStyles = () => {
    if (task.is_completed) return 'bg-green-50 border-green-200 opacity-75';
    if (isBlocked) return 'bg-slate-50 border-dashed border-slate-300 shadow-none';
    if (projectCount >= 3) return 'bg-orange-50/50 border-orange-300 shadow-sm';
    return 'bg-white border-slate-200 hover:shadow-md';
  };

  // --- EDIT MODE UI ---
  if (isEditing) {
    return (
      <div className="p-4 rounded-xl border-2 border-blue-400 bg-blue-50 shadow-lg animate-in fade-in zoom-in duration-200">
        <div className="mb-3">
          <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Task Title</label>
          <input 
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full p-2 border border-blue-200 rounded text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Reassign Task</label>
          <select
            className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium outline-none"
            value={editAssignee || ''}
            onChange={(e) => setEditAssignee(e.target.value)}
          >
            <option value="">Unassigned</option>
            {teamMembers?.map((member: any) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Due Date</label>
          <input 
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="w-full p-2 border border-blue-200 rounded text-slate-900 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="mb-4">
          <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Fibonacci Size</label>
          <select 
            value={editSize}
            onChange={(e) => setEditSize(Number(e.target.value))}
            className="w-full p-2 border border-blue-200 rounded text-slate-900 outline-none font-medium"
          >
            {[1, 2, 3, 5, 8, 13].map(num => <option key={num} value={num}>{num}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Asset Link (Drive/Figma)</label>
          <input 
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://..."
            className="w-full p-2 border border-blue-200 rounded text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Project Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {allProjects.map((proj) => {
              const isSelected = editProjectIds.includes(proj.id);
              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => {
                    setEditProjectIds(prev => 
                      isSelected ? prev.filter(id => id !== proj.id) : [...prev, proj.id]
                    );
                  }}
                  className={`text-[9px] px-2 py-1 rounded-full font-bold border transition-all ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {proj.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setIsEditing(false)} className="px-3 py-2 text-slate-500 font-bold text-xs hover:bg-slate-200 rounded-lg transition-colors">
            CANCEL
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md hover:bg-blue-700 active:scale-95 transition-all">
            <Save size={14} /> SAVE CHANGES
          </button>
        </div>
      </div>
    );
  }
console.log("Card for:", task.title, "Assignee ID:", task.assignee, "Team List:", teamMembers);
  // --- STANDARD DISPLAY UI ---
  return (
    <div className={`p-4 rounded-xl border transition-all ${getCardStyles()}`}>
      {/* Blocked Alert */}
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

      {/* Project Tags */}
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

      <div className="flex justify-between items-start mb-1">
        <div className="flex-1 pr-4">
          <h4 className={`font-semibold leading-tight ${
            task.is_completed ? 'text-green-800 line-through' : isBlocked ? 'text-slate-400' : 'text-slate-800'
          }`}>
            {task.title}
          </h4>
          <span className={`${task.is_completed ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-600'} text-[10px] font-bold px-2 py-1 rounded inline-block mt-1`}>
            {task.size} pts
          </span>
        </div>

        <div className="flex gap-1 items-center">
          {!task.is_completed && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-slate-300 hover:text-blue-500 p-1 transition-colors"
            >
              <Edit2 size={16} />
            </button>
          )}
          
          <button 
            disabled={isBlocked && !task.is_completed}
            onClick={() => onToggleComplete(task.id, task.is_completed)}
            className={`${
              task.is_completed ? 'text-green-600' : isBlocked ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-green-500'
            } p-1 transition-colors`}
          >
            {task.is_completed ? <Undo size={18} /> : <CheckCircle size={18} />}
          </button>
          
          <button onClick={() => onDelete(task.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {!task.is_completed && task.due_date && (
        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase my-3 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
          <Calendar size={12} />
          {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
        </div>
      )}
      
<div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
  <div className="flex items-center gap-2 text-slate-500">
    <User size={14} />
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
      {/* We search the teamMembers array directly here. 
          .trim() ensures no hidden spaces break the match.
      */}
      {teamMembers?.find(m => m.id?.trim() === task.assignee?.trim())?.name 
        || task.assignee 
        || "Unassigned"}
    </span>
  </div>

        {task.drive_url && (
          <a href={task.drive_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
            <FileText size={14} /> Asset <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
};

export default TaskCard;