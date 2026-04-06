'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap } from 'lucide-react';
import CapacityMeter from '@/components/CapacityMeter';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import ProjectForm from '@/components/ProjectForm';
import ProjectDashboard from '@/components/ProjectDashboard';
import IterationForm from '@/components/IterationForm';

// ... (fetchCalendarEvents and getCurrentIteration remain the same at the top)

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'iteration'>('iteration');
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeIteration, setActiveIteration] = useState({
    start: new Date(2026, 2, 25),
    end: new Date(2026, 3, 7),
    name: 'FY26 PI3.4'
  });

  const ITERATION_START = activeIteration.start;
  const ITERATION_END = activeIteration.end;

  // --- DATABASE FUNCTIONS ---

  const fetchIteration = async () => {
    const { data, error } = await supabase.from('iterations').select('*').limit(1).single();
    if (data && !error) {
      setActiveIteration({
        name: data.name,
        start: new Date(data.start_date + 'T12:00:00'),
        end: new Date(data.end_date + 'T12:00:00')
      });
    }
  };

  const handleUpdateIteration = async (updatedData: any) => {
    const { error } = await supabase
      .from('iterations')
      .update({
        name: updatedData.name,
        start_date: updatedData.start.toISOString().split('T')[0],
        end_date: updatedData.end.toISOString().split('T')[0]
      })
      .neq('name', ''); // Simple way to target the existing row

    if (!error) fetchIteration();
  };

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('*').order('name');
    if (data) setProjects(data);
  }

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select(`*, task_project_links (projects (*)), blocked_by: task_dependencies!task_id (depends_on: tasks!depends_on_id (id, title, is_completed))`)
      .order('created_at', { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  }

  // --- EFFECTS ---

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchIteration();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- LOGIC & HANDLERS ---

  const displayTasks = tasks.filter(task => {
    if (viewMode === 'iteration') {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      if (dueDate < ITERATION_START || dueDate >= ITERATION_END) return false;
    }
    if (!showCompleted && task.is_completed) return false;
    return true;
  });

  const TEAM_MEMBERS = [
    { id: "user_a", name: "Carrie Otto", capacity: 40 },
    { id: "user_b", name: "Katherine DeLong", capacity: 40 },
    { id: "user_c", name: "Minah Elsway", capacity: 8 },
    { id: "user_d", name: "Rachel Saen", capacity: 8 }
  ];

  const getMemberPoints = (memberId: string) => {
    return displayTasks
      .filter(t => t.assignee === memberId && !t.is_completed)
      .reduce((sum, t) => sum + (Number(t.size) || 0), 0);
  };

  // ... (addTask, updateTask, toggleComplete, deleteTask, addProject, updateProject remain the same)

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 italic">Initializing UMN Iteration Engine...</div>;

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 bg-slate-50 min-h-screen">
      <header className="mb-12 flex justify-between items-start border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">E-CRM Iteration</h1>
          <p className="text-slate-500 font-medium">U of M Strategic Velocity Board</p>
          
          <div className="mt-4 p-4 bg-blue-600 rounded-xl text-white shadow-lg inline-block">
            <h2 className="text-xl font-bold leading-none">{activeIteration.name}</h2>
            <p className="text-blue-100 text-xs font-mono mt-1">
              {activeIteration.start.toLocaleDateString('en-US', { timeZone: 'UTC' })} 
              {" — "}
              {new Date(activeIteration.end.getTime() - 86400000).toLocaleDateString('en-US', { timeZone: 'UTC' })}
            </p>
            {/* Added the Form Trigger here */}
            <IterationForm current={activeIteration} onUpdate={handleUpdateIteration} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ProjectForm onAddProject={addProject} />
        </div>
      </header>

      {/* ... (rest of the sections remain the same) */}
      
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="text-amber-500" size={20} fill="currentColor" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Project Velocity</h2>
        </div>
        <ProjectDashboard projects={projects} tasks={tasks} onUpdateProject={updateProject} />
      </section>

      {/* ... View Mode Buttons, Capacity Meters, Task Columns, etc. */}
    </main>
  );
}