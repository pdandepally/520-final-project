/**
 * Example: Worker Card Component
 * Use this component anywhere in your app to display worker information
 */

import { api } from "@/utils/trpc/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface WorkerCardProps {
  workerId: string;
}

export function WorkerCard({ workerId }: WorkerCardProps) {
  const { data: worker, isLoading } = api.workers.getWorker.useQuery({
    workerId,
  });

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />;
  }

  if (!worker) {
    return <div>Worker not found</div>;
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">
            {worker.firstName} {worker.lastName}
          </h3>
          {worker.role && (
            <p className="text-sm text-muted-foreground">{worker.role}</p>
          )}
        </div>
        <Link href={`/workers/${worker.id}`}>
          <Button variant="outline" size="sm">
            View Profile
          </Button>
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {worker.email && (
          <p className="text-sm">
            <span className="text-muted-foreground">Email:</span> {worker.email}
          </p>
        )}
        {worker.phoneNumber && (
          <p className="text-sm">
            <span className="text-muted-foreground">Phone:</span>{" "}
            {worker.phoneNumber}
          </p>
        )}
      </div>

      {worker.skills.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Skills:</p>
          <div className="flex flex-wrap gap-2">
            {worker.skills.slice(0, 3).map((skill: { id: string; skillName: string }) => (
              <span
                key={skill.id}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
              >
                {skill.skillName}
              </span>
            ))}
            {worker.skills.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                +{worker.skills.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Worker List Component
 * Display a grid of all workers
 */

export function WorkersList() {
  const { data: workers, isLoading } = api.workers.getAllWorkers.useQuery();

  if (isLoading) {
    return <div>Loading workers...</div>;
  }

  if (!workers || workers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No workers found</p>
        <Link href="/workers">
          <Button className="mt-4">Add First Worker</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workers.map((worker: { id: string }) => (
        <WorkerCard key={worker.id} workerId={worker.id} />
      ))}
    </div>
  );
}

/**
 * Example: Recent Work History Component
 * Display recent employment history for a worker
 */

interface WorkHistoryTimelineProps {
  workerId: string;
  limit?: number;
}

export function WorkHistoryTimeline({
  workerId,
  limit = 5,
}: WorkHistoryTimelineProps) {
  const { data: worker } = api.workers.getWorker.useQuery({ workerId });

  if (!worker || worker.workHistory.length === 0) {
    return <p className="text-sm text-muted-foreground">No work history</p>;
  }

  const recentHistory = worker.workHistory.slice(0, limit);

  return (
    <div className="space-y-4">
      {recentHistory.map((history: { id: string; position: string; employer: string; startDate: string; endDate: string | null }, index: number) => (
        <div key={history.id} className="relative pl-6 pb-4">
          {/* Timeline dot */}
          <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-primary" />

          {/* Timeline line */}
          {index < recentHistory.length - 1 && (
            <div className="absolute left-1.5 top-4 bottom-0 w-0.5 bg-gray-300" />
          )}

          {/* Content */}
          <div>
            <h4 className="font-semibold">{history.position}</h4>
            <p className="text-sm text-muted-foreground">{history.employer}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {history.startDate} - {history.endDate || "Present"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Skills Badge List
 * Display worker skills as badges
 */

interface SkillsBadgeListProps {
  workerId: string;
  max?: number;
}

export function SkillsBadgeList({ workerId, max = 10 }: SkillsBadgeListProps) {
  const { data: worker } = api.workers.getWorker.useQuery({ workerId });

  if (!worker || worker.skills.length === 0) {
    return null;
  }

  const displaySkills = worker.skills.slice(0, max);

  return (
    <div className="flex flex-wrap gap-2">
      {displaySkills.map((skill: { id: string; skillName: string; proficiencyLevel: string | null }) => (
        <div
          key={skill.id}
          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
        >
          {skill.skillName}
          {skill.proficiencyLevel && (
            <span className="ml-1 text-xs opacity-75">
              ({skill.proficiencyLevel})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Worker Stats Component
 * Display statistics about a worker
 */

interface WorkerStatsProps {
  workerId: string;
}

export function WorkerStats({ workerId }: WorkerStatsProps) {
  const { data: worker } = api.workers.getWorker.useQuery({ workerId });

  if (!worker) return null;

  const stats = [
    {
      label: "Work History",
      value: worker.workHistory.length,
      icon: "📋",
    },
    {
      label: "Skills",
      value: worker.skills.length,
      icon: "⚡",
    },
    {
      label: "Documents",
      value: worker.documents.length,
      icon: "📄",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="text-center p-4 border rounded-lg hover:bg-accent transition-colors"
        >
          <div className="text-2xl mb-2">{stat.icon}</div>
          <div className="text-2xl font-bold">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Usage Examples:
 * 
 * // Display a single worker card
 * <WorkerCard workerId="uuid-here" />
 * 
 * // Display all workers
 * <WorkersList />
 * 
 * // Show work history timeline
 * <WorkHistoryTimeline workerId="uuid-here" limit={3} />
 * 
 * // Show skills badges
 * <SkillsBadgeList workerId="uuid-here" max={5} />
 * 
 * // Show worker statistics
 * <WorkerStats workerId="uuid-here" />
 */
