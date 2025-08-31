import type { FC } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const TaskCardSkeleton: FC = () => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="mt-4">
             <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <div className="flex w-full justify-between">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardFooter>
    </Card>
  );
};

export default TaskCardSkeleton;
