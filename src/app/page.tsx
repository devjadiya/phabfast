"use client";

import type { FC } from "react";
import { useState, useEffect, useCallback, useTransition } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

import type { Task, Filters, TaskQuery } from "@/lib/types";
import { getTasks, exportTasks } from "@/app/actions";

import Header from "@/components/header";
import FilterBar from "@/components/filter-bar";
import TaskFeed from "@/components/task-feed";

const INITIAL_FILTERS: Filters = {
  dateRange: {
    from: undefined,
    to: undefined,
  },
  languages: [],
  maxSubscribers: 10,
  difficulties: [],
  openOnly: true,
  query: 'good-first',
};

const Page: FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFetchTasks = useCallback(() => {
    startTransition(async () => {
      try {
        const fetchedTasks = await getTasks(filters);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch tasks. Check the console for details.",
        });
      }
    });
  }, [filters, toast]);

  useEffect(() => {
    handleFetchTasks();
  }, [handleFetchTasks]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, query: null }));
  };
  
  const handleQueryChange = (query: TaskQuery | null) => {
    setFilters(prev => ({ ...INITIAL_FILTERS, query }));
  };

  const handleRefresh = () => {
    handleFetchTasks();
    toast({
      title: "Tasks Refreshed",
      description: "The task list has been updated.",
    });
  };

  const handleExport = async (format: "csv" | "md") => {
    try {
      const fileContent = await exportTasks(tasks, format);
      const blob = new Blob([fileContent], { type: format === 'csv' ? 'text/csv' : 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phabfast-tasks.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
       toast({
        title: "Export Successful",
        description: `Your tasks have been exported as a ${format.toUpperCase()} file.`,
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Export Failed",
        description: "There was an error exporting your tasks.",
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header
        onQueryChange={handleQueryChange}
        onRefresh={handleRefresh}
        onExport={handleExport}
        activeQuery={filters.query}
      />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <FilterBar filters={filters} onFilterChange={handleFilterChange} />
          <div className="mt-8">
            <TaskFeed tasks={tasks} isLoading={isPending} />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default Page;
