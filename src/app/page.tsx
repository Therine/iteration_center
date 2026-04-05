'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap } from 'lucide-react';
import CapacityMeter from '@/components/CapacityMeter';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import ProjectForm from '@/components/ProjectForm';
import ProjectDashboard from '@/components/ProjectDashboard';

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  
  // 1. DYNAMIC TEAM CONFIG
 
  
  const TEAM_MEMBERS = [
  { id: "user_a", name: "Carrie Otto" , capacity: 40},
  { id: "user_b", name: "Katherine DeLong" , capacity: 40},
  { id: "user_c", name: "Minah Elsway" , capacity: 8 },
  { id: "user_d", name: "Rachel Saen" , capacity: 8 }
];
 

  // 2. DATA FETCHING
  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('*').order('name');
    if (data) setProjects(data);
  }

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        task_project_links (projects (*)),
        blocked_by: task_dependencies!task_id (
          depends_on: tasks!depends_on_id (id, title, is_completed)
        )
      `)
      .order('created_at', { ascending: false });

    if (data) setTasks(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  // 3. HELPER LOGIC
  const getMemberPoints = (memberId: string) => {
  return tasks
    .filter(t => t.assignee === memberId && !t.is_completed)
    .reduce((sum, t) => sum + (Number(t.size) || 0), 0);
};

  // 4. ACTIONS
  const addTask = async (taskData: any) => {
    const { data, error: taskError } = await supabase
      .from('tasks')
      .insert([{
        title: taskData.title,
        size: taskData.size,
        assignee: taskData.assignee,
        due_date: taskData.due_date,
        drive_url: taskData.drive_url
      }])
      .select()
      .single();

    if (taskError || !data) return;

    if (taskData.projectIds?.length > 0) {
      const links = taskData.projectIds.map((projectId: string) => ({
        task_id: data.id,
        project_id: projectId
      }));
      await supabase.from('task_project_links').insert(links);
    }

    if (taskData.dependsOnId) {
      await supabase.from('task_dependencies').insert({
        task_id: data.id,
        depends_on_id: taskData.dependsOnId
      });
    }

    fetchTasks();
  };

  const updateTask = async (id: string, updatedData: any) => {
  // 1. Separate the project IDs from the rest of the task data
  const { projectIds, ...taskFields } = updatedData;

  const finalData = {
    ...taskFields,
    drive_url: taskFields.drive_url === "" ? null : taskFields.drive_url
  };

  // 2. Update the main Task record
  const { error: taskError } = await supabase
    .from('tasks')
    .update(finalData)
    .eq('id', id);

  if (taskError) {
    console.error("Update failed:", taskError.message);
    return;
  }

  // 3. Sync Project Tags (The many-to-many part)
  if (projectIds) {
    // Delete existing links for this task
    await supabase.from('task_project_links').delete().eq('task_id', id);
    
    // Insert new links
    const newLinks = projectIds.map((pId: string) => ({
      task_id: id,
      project_id: pId
    }));
    
    if (newLinks.length > 0) {
      await supabase.from('task_project_links').insert(newLinks);
    }
  }

  // 4. Refresh everything
  fetchTasks();
};

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', id);
    if (!error) fetchTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) fetchTasks();
  };

  const addProject = async (name: string) => {
    const { error } = await supabase.from('projects').insert([{ name }]);
    if (!error) fetchProjects();
  };

  const updateProject = async (id: string, updatedData: any) => {
    const { error } = await supabase.from('projects').update(updatedData).eq('id', id);
    if (!error) fetchProjects();
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 italic">Initializing UMN Iteration Engine...</div>;

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 bg-slate-50 min-h-screen">
      
      {/* HEADER SECTION */}
      <header className="mb-12 flex justify-between items-end border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">E-CRM ITERATION</h1>
          <p className="text-slate-500 font-medium">U of M Strategic Velocity Board</p>
        </div>
        <ProjectForm onAddProject={addProject} />
      </header>

      {/* STRATEGIC DASHBOARD */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="text-amber-500" size={20} fill="currentColor" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Project Velocity</h2>
        </div>
        <ProjectDashboard projects={projects} tasks={tasks} onUpdateProject={updateProject} />
      </section>

      {/* CAPACITY OVERVIEW */}
      <section className="mb-12">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Team Resource Load</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM_MEMBERS.map(member => (
  <CapacityMeter 
    key={member.id}
    name={member.name} // Display the Alias
    points={getMemberPoints(member.id)} // Calculate by ID
    max={member.capacity}
  />
))}
        </div>
      </section>

      {/* TASK CREATION */}
      <section className="mb-12">
        <TaskForm onAddTask={addTask} projects={projects} tasks={tasks} teamMembers={TEAM_MEMBERS} />
      </section>

      {/* DYNAMIC TEAM COLUMNS */}
      <section className="flex gap-6 overflow-x-auto pb-10">
        {TEAM_MEMBERS.map((member) => (
          <div key={member.id} className="min-w-[320px] flex-1">
    <div className="flex items-center justify-between mb-4 px-2">
      <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
        {member.name} {/* Display the Alias */}
      </h3>
      <span className={`text-[10px] font-bold py-1 px-2 rounded ${
        getMemberPoints(member.id) >= member.capacity 
          ? 'bg-red-100 text-red-600' 
          : 'bg-slate-200 text-slate-600'
      }`}>
        {getMemberPoints(member.id)} / {member.capacity} PTS
      </span>
    </div>

            <div className="space-y-4">
              {tasks
        .filter((t: any) => t.assignee === member.id)
                .sort((a, b) => (a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1))
                .map((t: any) => (
                  <TaskCard 
                    key={t.id} 
                    task={t} 
                    onDelete={deleteTask} 
                    onToggleComplete={toggleComplete}
                    onUpdate={updateTask}
                    teamMembers={TEAM_MEMBERS}
                    allProjects={projects}
                  />
                ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}