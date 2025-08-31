"use client";

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface LoadMoreProps {
  onLoadMore: () => void;
  isFetchingMore: boolean;
}

export default function LoadMore({ onLoadMore, isFetchingMore }: LoadMoreProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false, 
  });

  useEffect(() => {
    if (inView && !isFetchingMore) {
      onLoadMore();
    }
  }, [inView, isFetchingMore, onLoadMore]);

  return (
    <div
      ref={ref}
      className="flex justify-center items-center p-4 col-span-1 sm:col-span-2 md:col-span-3"
    >
      {isFetchingMore && (
         <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading more tasks...</span>
        </div>
      )}
    </div>
  );
}
