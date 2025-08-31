
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
    </div>
  );
}

    