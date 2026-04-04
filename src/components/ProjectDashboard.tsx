import React, { useState } from 'react';
import { Target } from 'lucide-react';

// --- SUB-COMPONENT FOR INDIVIDUAL PROJECT CARDS ---
const ProjectCard = ({ project, tasks, onUpdateProject }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempStatus, setTempStatus] = useState(project.status || 'On Track');
  const [tempReason, setTempReason] = useState(project.status_reason || '');

  // Calculate project-specific stats
  const projectTasks = tasks.filter((task: any) => 
    task.task_project_links?.some((link: any) => link.projects?.id === project.id)
  );

  const totalPoints = projectTasks.reduce((sum: number, t: any) => sum + (Number(t.size) || 0), 0);
  const completedPoints = projectTasks
    .filter((t: any) => t.is_completed)
    .reduce((sum: number, t: any) => sum + (Number(t.size) || 0), 0);
  
  const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const handleStatusSave = async () => {
    if (onUpdateProject) {
      await onUpdateProject(project.id, { 
        status: tempStatus, 
        status_reason: tempReason 
      });
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <Target size={20} />
        </div>
        
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`text-[10px] font-black px-3 py-1 rounded-full uppercase transition-all hover:ring-2 hover:ring-blue-300 ${
            project.status === 'Completed' ? 'bg-green-100 text-green-700' : 
            project.status === 'Blocked' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {project.status || 'On Track'} • {isEditing ? 'Cancel' : 'Update'}
        </button>
      </div>

      <h3 className="font-bold text-slate-800 truncate mb-1">{project.name}</h3>
      <p className="text-xs text-slate-400 font-medium mb-4">{projectTasks.length} Tasks Linked</p>

      {isEditing ? (
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <select 
            value={tempStatus}
            onChange={(e) => setTempStatus(e.target.value)}
            className="w-full p-2 text-xs font-bold rounded border border-slate-300 bg-white text-slate-900 outline-none"
          >
            <option value="On Track">On Track</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>
          <input 
            type="text"
            placeholder="Why this status? (e.g. Awaiting PR)"
            value={tempReason}
            onChange={(e) => setTempReason(e.target.value)}
            className="w-full p-2 text-xs rounded border border-slate-300 bg-white text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button 
            onClick={handleStatusSave}
            className="w-full bg-blue-600 text-white text-[10px] font-bold py-2 rounded uppercase shadow-sm active:scale-95 transition-all"
          >
            Update Project Status
          </button>
        </div>
      ) : (
        project.status_reason && (
          <p className="text-[11px] text-slate-500 italic mb-4 bg-slate-50 p-2 rounded border-l-2 border-slate-300">
            "{project.status_reason}"
          </p>
        )
      )}

      <div className="space-y-2 pt-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
          <span className="text-slate-400">Velocity: {completedPoints} / {totalPoints} pts</span>
          <span className="text-blue-600">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ${
              project.status === 'Blocked' ? 'bg-red-500' : 
              project.status === 'Completed' ? 'bg-green-500' : 'bg-blue-600'
            }`} 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD GRID ---
export default function ProjectDashboard({ projects, tasks, onUpdateProject }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
      {projects.map((project: any) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          tasks={tasks} 
          onUpdateProject={onUpdateProject} 
        />
      ))}
    </div>
  );
}