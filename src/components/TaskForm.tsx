'use client';

import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';

// Added 'projects' to the props so the form can see them
export default function TaskForm({ onAddTask, projects, tasks, teamMembers }: { 
  onAddTask: (task: any) => void, 
  projects: any[], 
  tasks: any[],
  teamMembers: string[] // Add this
}) {
  // 1. ALL HOOKS AT THE TOP
  const [title, setTitle] = useState('');
  const [size, setSize] = useState(1);
  const [assignee, setAssignee] = useState('User A');
  const [dueDate, setDueDate] = useState('');
  const [drive_url, setDriveUrl] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dependsOnId, setDependsOnId] = useState('');
  // 2. Logic to toggle project selection
  const toggleProject = (id: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // Send the data back to page.tsx
    onAddTask({
  title,
  size: Number(size),
  assignee,
  due_date: dueDate,
  drive_url: drive_url,
  projectIds: selectedProjectIds,
  dependsOnId: dependsOnId // <--- Make sure this line exists!
});

    // Reset Form
    setTitle('');
    setDriveUrl('');
    setDueDate('');
    setSelectedProjectIds([]);
  };
console.log("Tasks received in Form:", tasks);
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
  Task Title <span className="text-red-500">*</span>
</label>
          <input 
            required
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Fibonacci Size */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Size (Fib)</label>
          <select 
            required
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder:text-slate-400"
          >
            {[1, 2, 3, 5, 8, 13].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

{/* Assignee */}
<div>
  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Assignee</label>
  <select 
    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
    value={assignee} // Use 'assignee' state, not 'taskData.assignee'
    onChange={(e) => setAssignee(e.target.value)} // Use 'setAssignee'

  >
    <option value="">Unassigned</option>
  {teamMembers.map((member: any) => (
    <option key={member.id} value={member.id}>
      {member.name}
    </option>
    ))}
  </select>
</div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Due Date</label>
          <input 
            type="date" 
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Asset Link */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Asset Link</label>
          <input 
            type="url" 
            value={drive_url}
            onChange={(e) => setDriveUrl(e.target.value)}
            placeholder="https://docs.google.com/..."
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder:text-slate-400"
          
          />
        </div>

        {/* Project Tagging Section */}
        <div className="md:col-span-3 border-t border-slate-100 pt-4 mt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Tag Projects (Multi-select for High Impact):</p>
          <div className="flex flex-wrap gap-2">
            {projects.map((proj: any) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => toggleProject(proj.id)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  selectedProjectIds.includes(proj.id)
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                }`}
              >
                {proj.name}
              </button>
            ))}
            {projects.length === 0 && (
              <p className="text-xs text-slate-400 italic">No projects found. Add them in Supabase first!</p>
            )}
          </div>
        </div>
<div className="md:col-span-3">
  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Blocked by (Optional)</label>
  <select 
  value={dependsOnId}
  onChange={(e) => setDependsOnId(e.target.value)}
  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
>
  <option value="">No Dependency</option>
  {tasks && tasks.filter(t => !t.is_completed).map(t => (
    <option key={t.id} value={t.id}>{t.title}</option>
  ))}
</select>
</div>
        {/* Submit Button */}
        <div className="md:col-span-3 flex justify-end mt-4">
          <button 
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-shadow shadow-md active:scale-95"
          >
            <PlusCircle size={18} /> Add Task
          </button>
        </div>
      </div>
    </form>
  );
}