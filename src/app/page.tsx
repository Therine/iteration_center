'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap } from 'lucide-react';
import ICAL from 'ical.js';
import CapacityMeter from '@/components/CapacityMeter';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import ProjectForm from '@/components/ProjectForm';
import ProjectDashboard from '@/components/ProjectDashboard';



export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  // 1. ADD THE TOGGLE STATE
  const [viewMode, setViewMode] = useState<'all' | 'iteration'>('iteration');
  const [showCompleted, setShowCompleted] = useState(false);
 // Inside your Home component
const [activeIteration, setActiveIteration] = useState({
  start: new Date('2026-04-08T00:00:00'), // Adding the T00:00:00 ensures local timezone consistency
  end: new Date('2026-04-21T23:59:59'),
  name: 'FY26 PI3.5'
});
 // Dynamic Date Logic - strictly using the state
const ITERATION_START = activeIteration.start;
const ITERATION_END = activeIteration.end;
const ITERATION_NAME = activeIteration.name;


  const displayTasks = tasks.filter(task => {
  // 1. First, handle the Iteration vs All view
  if (viewMode === 'iteration') {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    if (dueDate < ITERATION_START || dueDate >= ITERATION_END) return false;
  }

  // 2. NEW: Handle the Completed Toggle
  // If showCompleted is false, we filter OUT completed tasks
  if (!showCompleted && task.is_completed) return false;

  return true;
});



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
  fetchTasks();
  fetchProjects();
  const channel = supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'tasks' },
    (payload) => {
      // Refresh your tasks list here when a change occurs
      fetchTasks(); 
    }
  )
  .subscribe();
  const syncCalendar = async () => {
    const data = await fetchCalendarEvents();
    
    // Check if data is valid here BEFORE calling the helper
    if (data && Array.isArray(data)) {
      const current = getCurrentIteration(data);
      if (current) {
        setActiveIteration({
          start: new Date(current.start_time),
          end: new Date(current.end_time),
          name: current.event_title
        });
      }
    } else {
      console.error("Fetch returned something other than an array:", data);
    }
  };

  syncCalendar();
}, []);

  // 3. HELPER LOGIC
  const getMemberPoints = (memberId: string) => {
  return displayTasks
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
  const { projectIds, dependsOnId, ...taskFields } = updatedData;

  // 1. Update the main task (Title, Size, Assignee, etc.)
  const { error: taskError } = await supabase
    .from('tasks')
    .update(taskFields)
    .eq('id', id);

  // 2. Handle Dependency Change
  if (dependsOnId !== undefined) {
    // Remove existing dependency for this task
    await supabase.from('task_dependencies').delete().eq('task_id', id);
    
    // If a new dependency was selected (and isn't empty)
    if (dependsOnId) {
      await supabase.from('task_dependencies').insert({
        task_id: id,
        depends_on_id: dependsOnId
      });
    }
  }

if (projectIds) {
    await supabase.from('task_project_links').delete().eq('task_id', id);
    const newLinks = projectIds.map((pId: string) => ({ task_id: id, project_id: pId }));
    if (newLinks.length > 0) await supabase.from('task_project_links').insert(newLinks);
  }

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
        <div className="mb-8 p-6 bg-slate-900 rounded-2xl text-white shadow-xl border border-slate-700">
  <header className="...">
{/* PI DISPLAY BOX */}
<div className="mb-8 p-6 bg-slate-900 rounded-2xl shadow-xl border border-slate-700">
  <div>
    <h1 className="text-3xl font-black text-white tracking-tight">
      {activeIteration.name}
    </h1>
    <p className="text-slate-400 font-medium italic">
  {new Date(activeIteration.start).toLocaleDateString('en-US', { timeZone: 'UTC' })} — {new Date(new Date(activeIteration.end).getTime() - 86400000).toLocaleDateString('en-US', { timeZone: 'UTC' })}
</p>
{/* In your header rendering */}

  </div>
</div>
</header>
</div>
      </header>

      {/* STRATEGIC DASHBOARD */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="text-amber-500" size={20} fill="currentColor" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Project Velocity</h2>
        </div>
        <ProjectDashboard projects={projects} tasks={tasks} onUpdateProject={updateProject} />
      </section>


{/* VIEW & COMPLETED TOGGLES */}
<div className="flex items-center gap-4 mb-6">
  <div className="flex bg-slate-200 p-1 rounded-xl w-fit">
    <button
      onClick={() => setViewMode('iteration')}
      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
        viewMode === 'iteration' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
      }`}
    >
      CURRENT ITERATION
    </button>
    <button
      onClick={() => setViewMode('all')}
      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
        viewMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
      }`}
    >
      ALL TASKS
    </button>
  </div>

  <button
    onClick={() => setShowCompleted(!showCompleted)}
    className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
      showCompleted 
        ? 'bg-green-100 border-green-200 text-green-700' 
        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
    }`}
  >
    {showCompleted ? 'Showing Completed ✓' : 'Hide Completed'}
  </button>
</div>
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

<section className="mb-12">
  <TaskForm 
    onAddTask={addTask} 
    projects={projects} 
    tasks={tasks} 
    teamMembers={TEAM_MEMBERS.map(m => m.name)} 
  />
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
  {displayTasks // <--- Use the filtered list here!
    .filter((t: any) => t.assignee === member.id)
    .sort((a, b) => (a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1))
    .map((t: any) => (
      <TaskCard key={t.id} 
        task={t} 
        onDelete={deleteTask} 
        onToggleComplete={toggleComplete}
        onUpdate={updateTask}
        teamMembers={TEAM_MEMBERS.map(m => m.name)} 
        allProjects={projects}
        allTasks={tasks} />
    ))
  }
</div>
            
          </div>
        ))}
        {/* 2. ADD THIS: The Unassigned Column */}
<div className="unassigned-column">
  <h3 className="text-red-500 font-bold">Unassigned Tasks</h3>
  {tasks
    .filter(t => !t.assignee) // This catches null or undefined
    .map(t => (
      <TaskCard 
        key={t.id} 
        task={t} 
        onDelete={deleteTask} 
        onToggleComplete={toggleComplete}
        onUpdate={updateTask}
        teamMembers={TEAM_MEMBERS.map(m => m.name)} 
        allProjects={projects}
        allTasks={tasks} 
        // ... rest of your props
      />
    ))}
  {tasks.filter(t => !t.assignee).length === 0 && (
    <p className="text-gray-400 italic">No unassigned tasks</p>
  )}
</div>  
      </section>
    </main>
  );
}

const fetchCalendarEvents = async () => {
  // 1. Your Public ICS URL
  const ICS_URL = "https://calendar.google.com/calendar/ical/c_rdq4brm3fr9ht2pc9lacraeg4g%40group.calendar.google.com/public/basic.ics";
  
  // 2. Using a free proxy to bypass CORS
  const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(ICS_URL);

  try {
    const response = await fetch(PROXY_URL);
    const text = await response.text();
    
    // 3. Parse the ICS data
    const jcalData = ICAL.parse(text);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents('vevent');

    return vevents.map(vevent => {
      const event = new ICAL.Event(vevent);
      return {
        event_title: event.summary,
        start_time: event.startDate.toJSDate(),
        end_time: event.endDate.toJSDate()
      };
    });
  } catch (error) {
    console.error("ICS Fetch Error:", error);
    return [];
  }
};
// Helper to find the "active" iteration from the calendar events
const getCurrentIteration = (calendarEvents: any[]) => {
  // 1. SAFETY CHECK: If it's not an array, stop here to avoid the crash
  if (!Array.isArray(calendarEvents)) {
    console.error("Calendar data is not an array:", calendarEvents);
    return null;
  }

  const today = new Date();
  
  const activeEvent = calendarEvents.find(event => {
  if (!event.start_time || !event.end_time) return false;
  
  // Force the dates to be treated as UTC to match the Calendar's source
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const today = new Date();

  // We use the 'UTC' methods to avoid the Chicago offset
  return today >= start && today < end && event.event_title.includes("PI");
});

  return activeEvent || null;
};
