import React from 'react';

const ProjectRow = ({ project }) => {
  // project = { name, totalPoints, completedPoints, status, driveFolder }
  const progress = (project.completedPoints / project.totalPoints) * 100;
  
  const statusStyles = {
    "On Track": "text-green-600 bg-green-50 border-green-200",
    "At Risk": "text-amber-600 bg-amber-50 border-amber-200",
    "Blocked": "text-red-600 bg-red-50 border-red-200"
  };

  return (
    <div className="flex items-center gap-6 p-4 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
      {/* Project Info */}
      <div className="w-1/4">
        <h3 className="font-bold text-slate-800">{project.name}</h3>
        <a href={project.driveFolder} className="text-xs text-blue-500 hover:underline">View Project Drive</a>
      </div>

      {/* Progress Bar */}
      <div className="flex-1">
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-slate-400 mb-1">
          <span>Progress</span>
          <span>{project.completedPoints} / {project.totalPoints} pts</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-700" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status Badge */}
      <div className="w-32 flex justify-end">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyles[project.status]}`}>
          {project.status}
        </span>
      </div>
    </div>
  );
};

export default function PortfolioView() {
  const projects = [
    { name: "Website Redesign", totalPoints: 55, completedPoints: 34, status: "On Track", driveFolder: "#" },
    { name: "Q2 Marketing Campaign", totalPoints: 21, completedPoints: 5, status: "At Risk", driveFolder: "#" },
    { name: "Internal API Docs", totalPoints: 13, completedPoints: 13, status: "On Track", driveFolder: "#" }
  ];

  return (
    <div className="max-w-5xl mx-auto mt-10 shadow-xl rounded-2xl overflow-hidden border border-slate-200">
      <div className="bg-slate-800 p-6">
        <h2 className="text-white text-xl font-semibold">Project Portfolio</h2>
        <p className="text-slate-400 text-sm">Aggregated health of all active workstreams</p>
      </div>
      <div className="bg-white">
        {projects.map(p => <ProjectRow key={p.name} project={p} />)}
      </div>
    </div>
  );
}