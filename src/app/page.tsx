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
import Login from '@/components/Login';

const fetchCalendarEvents = async () => {
const ICS_URL = "https://calendar.google.com/calendar/ical/c_rdq4brm3fr9ht2pc9lacraeg4g%40group.calendar.google.com/public/basic.ics";
const PROXY_URL = `https://api.allorigins.win/get?url=${encodeURIComponent(ICS_URL)}&timestamp=${Date.now()}`;

try {
const response = await fetch(PROXY_URL);
if (!response.ok) return null;
const data = await response.json();
const text = data.contents;
if (!text) return null;

const events = text.split("BEGIN:VEVENT");
const parsedEvents: any[] = [];

events.forEach((event: string) => {
const summary = event.match(/SUMMARY:(.*)/i);
const start = event.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/i);
const end = event.match(/DTEND(?:;VALUE=DATE)?:(\d{8})/i);

if (summary && start && end) {
const s = start[1];
const e = end[1];
parsedEvents.push({
event_title: summary[1].trim(),
start_date: new Date(parseInt(s.slice(0,4)), parseInt(s.slice(4,6)) - 1, parseInt(s.slice(6,8))),
end_date: new Date(parseInt(e.slice(0,4)), parseInt(e.slice(4,6)) - 1, parseInt(e.slice(6,8)))
});
}
});
return parsedEvents;
} catch (error) {
console.error("Calendar Sync Error:", error);
return null;
}
};

const getCurrentIteration = (calendarEvents: any[]) => {
if (!calendarEvents || calendarEvents.length === 0) return null;
const today = new Date();
today.setHours(12, 0, 0, 0);

const piEvents = calendarEvents
.filter(e => e.event_title.toUpperCase().includes("PI"))
.sort((a, b) => a.start_date.getTime() - b.start_date.getTime());

const active = piEvents.find(event => {
const start = new Date(event.start_date).setHours(0,0,0,0);
const end = new Date(event.end_date).setHours(0,0,0,0);
return today.getTime() >= start && today.getTime() < end;
});

if (active) return active;
const future = piEvents.find(event => event.start_date > today);
return future || piEvents[piEvents.length - 1];
};

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'iteration'>('iteration');
  const [showCompleted, setShowCompleted] = useState(false);
  const [session, setSession] = useState<any>(null);
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
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    fetchTasks();
    fetchProjects();
    fetchIteration();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };


  }, []);
if (!session) {
    return <Login />;
  }
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

// --- ACTIONS (Missing Functions) ---

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

    const { error: taskError } = await supabase
      .from('tasks')
      .update(taskFields)
      .eq('id', id);

    if (dependsOnId !== undefined) {
      await supabase.from('task_dependencies').delete().eq('task_id', id);
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
      <header className="mb-12 flex justify-between items-start border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">E-CRM Iteration</h1>
          <p className="text-slate-500 font-medium">U of M Strategic Velocity Board</p>
          
          <div className="mt-4 p-4 bg-blue-600 rounded-xl text-white shadow-lg inline-block">
            <h2 className="text-xl font-bold leading-none">{activeIteration.name}</h2>
            <p className="text-blue-100 text-xs font-mono mt-1">
  {activeIteration.start.toLocaleDateString('en-US', { timeZone: 'UTC' })} 
  {" — "}
  {/* Removed the - 86400000 math so it shows the exact date from Supabase */}
  {activeIteration.end.toLocaleDateString('en-US', { timeZone: 'UTC' })}
</p>
            {/* Added the Form Trigger here */}
            <IterationForm current={activeIteration} onUpdate={handleUpdateIteration} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ProjectForm onAddProject={addProject} />
        </div>
      </header>


      {/* ... View Mode Buttons, Capacity Meters, Task Columns, etc. */}{/* STRATEGIC DASHBOARD */}
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
</section></main>
  );
}