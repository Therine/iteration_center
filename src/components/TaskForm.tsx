'use client'; // This tells Next.js this component is interactive

import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';

export default function TaskForm({ onAddTask }: { onAddTask: (task: any) => void }) {
  const [title, setTitle] = useState('');
  const [size, setSize] = useState(1);
  const [assignee, setAssignee] = useState('User A');
  const [dueDate, setDueDate] = useState('');
  const [drive_url, setDriveUrl] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!title) return;

  onAddTask({
    title,
    size: Number(size),
    assignee,
    due_date: dueDate,
    drive_url: drive_url // Sending it to the parent (page.tsx)
  });

  setTitle('');
  setDriveUrl(''); // Reset the field after adding
};

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Task Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Fibonacci Size */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Size (Fib)</label>
          <select 
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full p-2 border border-slate-200 rounded-lg outline-none"
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
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg outline-none"
          >
            <option value="User A">User A</option>
            <option value="User B">User B</option>
          </select>
        </div>
        <div>
  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Due Date</label>
  <input 
    type="date" 
    value={dueDate}
    onChange={(e) => setDueDate(e.target.value)}
    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
<div className="md:col-span-3">
  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Asset Link (Google Drive / Figma / etc.)</label>
  <input 
  type="url" 
  value={drive_url}
  onChange={(e) => setDriveUrl(e.target.value)} // Fixed the capitalization here!
  placeholder="https://docs.google.com/..."
  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
/>
</div>
        {/* Submit Button */}
        <div className="md:col-span-3 flex justify-end mt-2">
          <button 
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={18} /> Add Task
          </button>
        </div>
      </div>
    </form>
  );
}