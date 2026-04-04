import CapacityMeter from '@/components/CapacityMeter';
import TaskCard from '@/components/TaskCard';

export default function Home() {
  // Mock Data: This is what we will eventually pull from Supabase
  const tasks = [
    { id: 1, title: "Design Landing Page Hero", size: 5, assignee: "User A", driveUrl: "#" },
    { id: 2, title: "Fix API Authentication Bug", size: 8, assignee: "User A", driveUrl: "#" },
    { id: 3, title: "Draft Q2 Marketing Copy", size: 3, assignee: "User B", driveUrl: "#" },
  ];

  const pointsA = tasks.filter(t => t.assignee === "User A").reduce((acc, t) => acc + t.size, 0);
  const pointsB = tasks.filter(t => t.assignee === "User B").reduce((acc, t) => acc + t.size, 0);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900">Iteration Center</h1>
        <p className="text-slate-500">2-Person High Velocity Engine</p>
      </header>
      
      {/* 1. Capacity Row */}
      <div className="flex gap-6 mb-12">
        <CapacityMeter user="User A" points={pointsA} maxCapacity={21} />
        <CapacityMeter user="User B" points={pointsB} maxCapacity={21} />
      </div>

      {/* 2. Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">User A Workstream</h2>
          <div className="space-y-4">
            {tasks.filter(t => t.assignee === "User A").map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">User B Workstream</h2>
          <div className="space-y-4">
            {tasks.filter(t => t.assignee === "User B").map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </section>
      </div>
    </main>
  );
}