'use client'; // Critical for any file using useState

import React, { useState } from 'react';
export default function IterationForm({ current, onUpdate }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(current);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsOpen(false);
  };

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="text-blue-200 hover:text-white text-[10px] font-bold uppercase mt-2 underline">
      Edit Iteration
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md text-slate-900">
        <h3 className="text-xl font-black mb-4">Edit Iteration Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Iteration Name</label>
            <input 
              className="w-full border-2 border-slate-100 rounded-lg p-2 focus:border-blue-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Start Date</label>
              <input 
                type="date"
                className="w-full border-2 border-slate-100 rounded-lg p-2 focus:border-blue-500 outline-none"
                value={formData.start.toISOString().split('T')[0]}
                onChange={e => setFormData({...formData, start: new Date(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">End Date</label>
              <input 
                type="date"
                className="w-full border-2 border-slate-100 rounded-lg p-2 focus:border-blue-500 outline-none"
                value={formData.end.toISOString().split('T')[0]}
                onChange={e => setFormData({...formData, end: new Date(e.target.value)})}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg">Save Changes</button>
          <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-slate-100 text-slate-500 font-bold py-2 rounded-lg">Cancel</button>
        </div>
      </form>
    </div>
  );
}