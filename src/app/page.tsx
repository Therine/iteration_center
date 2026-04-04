'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CapacityMeter from '@/components/CapacityMeter';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH TASKS FROM SUPABASE
  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setTasks(data);
      setLoading(false);
    }
    fetchTasks();
  }, []);
// 1. Calculate points for User A
const pointsA = tasks
  .filter((t: any) => t.assignee === "User A")
  .reduce((acc: number, t: any) => acc + Number(t.size), 0);

// 2. Calculate points for User B
const pointsB = tasks
  .filter((t: any) => t.assignee === "User B")
  .reduce((acc: number, t: any) => acc + Number(t.size), 0);
  // SAVE NEW TASK TO SUPABASE
  const addTask = async (taskData: any) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      title: taskData.title,
      size: taskData.size,
      assignee: taskData.assignee,
      due_date: taskData.due_date,
      drive_url: taskData.drive_url // This matches your Supabase column name
    }])
    .select();

  if (error) {
    console.error("Supabase Error:", error.message);
    return;
  }

  if (data) {
    setTasks((prev) => [data[0], ...prev]);
  }
};

  if (loading) return <div className="p-20 text-center font-bold">Loading Engine...</div>;

  // ... rest of your return() code remains the same
  return (
    <main className="min-h-screen bg-slate-50 p-8 max-w-5xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">E-CRM Iteration Center</h1>
          <p className="text-slate-500 text-sm">2-Person High Velocity Engine</p>
        </div>
        <div className="flex gap-4">
          <CapacityMeter user="User A" points={pointsA} maxCapacity={21} />
          <CapacityMeter user="User B" points={pointsB} maxCapacity={21} />
        </div>
      </header>
      
      {/* The Form */}
      <TaskForm onAddTask={addTask} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">User A Path</h2>
          <div className="space-y-4">
            {tasks.filter(t => t.assignee === "User A").map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">User B Path</h2>
          <div className="space-y-4">
            {tasks.filter(t => t.assignee === "User B").map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </section>
      </div>
    </main>
  );
}