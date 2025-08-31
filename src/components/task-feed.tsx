import type { FC } from 'react';
import type { Task } from '@/lib/types';
import TaskCard from '@/components/task-card';
import TaskCardSkeleton from './task-card-skeleton';

interface TaskFeedProps {
  tasks: Task[];
  isLoading: boolean;
}

const TaskFeed: FC<TaskFeedProps> = ({ tasks, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-card p-12 text-center col-span-full">
        <h3 className="text-2xl font-bold tracking-tight">No tasks found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or refreshing.</p>
      </div>
    );
  }

  return (
    <div className="grid animate-in fade-in-50 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};

export default TaskFeed;
