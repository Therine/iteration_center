'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CapacityMeter from '@/components/CapacityMeter';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  // 1. FETCH FUNCTIONS (Moved out of useEffect so other functions can call them)
  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('*').order('name');
    if (data) setProjects(data);
  }

  async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_project_links (projects (name)),
      blocked_by: task_dependencies!task_id (
        depends_on: tasks!depends_on_id (id, title, is_completed)
      )
    `)
    .order('created_at', { ascending: false });

  if (data) setTasks(data);
  setLoading(false);
}

  // 2. INITIAL LOAD
  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  // 3. CAPACITY CALCULATIONS
  const pointsA = tasks
    .filter((t: any) => t.assignee === "User A" && !t.is_completed)
    .reduce((acc: number, t: any) => acc + Number(t.size), 0);

  const pointsB = tasks
    .filter((t: any) => t.assignee === "User B" && !t.is_completed)
    .reduce((acc: number, t: any) => acc + Number(t.size), 0);

  // 4. DATABASE ACTIONS
const addTask = async (taskData: any) => {
  // 1. Insert the Task and get the returned data
  const { data, error: taskError } = await supabase
    .from('tasks')
    .insert([{
      title: taskData.title,
      size: taskData.size,
      assignee: taskData.assignee,
      due_date: taskData.due_date,
      drive_url: taskData.drive_url
    }])
    .select() // This is crucial to get the ID back!
    .single();

  if (taskError || !data) {
    console.error("Task Insert Error:", taskError?.message);
    return;
  }

  // Now we safely have the new task
  const newTask = data;

  // 2. Insert the Project Links
  if (taskData.projectIds && taskData.projectIds.length > 0) {
    const links = taskData.projectIds.map((projectId: string) => ({
      task_id: newTask.id,
      project_id: projectId
    }));
    await supabase.from('task_project_links').insert(links);
  }

  // 3. Insert the Dependency Link
  if (taskData.dependsOnId) {
    const { error: depError } = await supabase
      .from('task_dependencies')
      .insert({
        task_id: newTask.id,
        depends_on_id: taskData.dependsOnId
      });
    
    if (depError) console.error("Dependency Error:", depError.message);
  }

  // 4. Refresh the UI
  fetchTasks();
};

  const deleteTask = async (id: number) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      setTasks(tasks.filter((t: any) => t.id !== id));
    }
  };

  const toggleComplete = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    if (!error) {
      setTasks((prevTasks) => 
        prevTasks.map((t: any) => 
          t.id === id ? { ...t, is_completed: !currentStatus } : t
        )
      );
    }
     fetchTasks();
  };

  // 5. SORTING LOGIC (Helper function to keep the UI clean)
  const sortTasks = (a: any, b: any) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    const countA = a.task_project_links?.length || 0;
    const countB = b.task_project_links?.length || 0;
    if (countB !== countA) return countB - countA;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 italic">Initializing UMN Iteration Engine...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-8 max-w-5xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">E-CRM Iteration Center</h1>
          <p className="text-slate-500 text-sm">Portfolio Management & High-Impact Tracking</p>
        </div>
        <div className="flex gap-4">
          <CapacityMeter user="User A" points={pointsA} maxCapacity={21} />
          <CapacityMeter user="User B" points={pointsB} maxCapacity={21} />
        </div>
      </header>
      
      {/* Passing projects to the form once */}
      <TaskForm onAddTask={addTask} projects={projects} tasks={tasks} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User A Column */}
        <section>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2">User A Path</h2>
          <div className="space-y-4">
            {tasks
              .filter((t: any) => t.assignee === "User A")
              .sort(sortTasks)
              .map((t: any) => (
                <TaskCard key={t.id} task={t} onDelete={deleteTask} onToggleComplete={toggleComplete} />
              ))}
          </div>
        </section>

        {/* User B Column */}
        <section>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2">User B Path</h2>
          <div className="space-y-4">
            {tasks
              .filter((t: any) => t.assignee === "User B")
              .sort(sortTasks)
              .map((t: any) => (
                <TaskCard key={t.id} task={t} onDelete={deleteTask} onToggleComplete={toggleComplete} />
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}