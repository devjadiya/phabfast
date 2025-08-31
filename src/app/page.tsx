"use client";

import type { FC } from "react";
import { useState, useEffect, useCallback, useTransition } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

import type { Task, Filters, TaskQuery } from "@/lib/types";
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

async function fetchTasksFromApi(filters: Filters): Promise<Task[]> {
  try {
    const response = await fetch('/api/tasks/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
    }

    let tasks: Task[] = await response.json();

    // Fetch Gerrit URLs for each task
    tasks = await Promise.all(
      tasks.map(async (task) => {
        try {
          const gerritResponse = await fetch(`/api/gerrit/${task.id}`);
          if (gerritResponse.ok) {
            const gerritData = await gerritResponse.json();
            if (gerritData.url) {
              return { ...task, gerritUrl: gerritData.url };
            }
          }
        } catch (error) {
            // gerrit url is optional
        }
        return task;
      })
    );


    return tasks;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    // Re-throw or handle as needed
    throw error;
  }
}

async function exportTasks(tasks: Task[], format: "csv" | "md"): Promise<string> {
  if (format === "csv") {
    const header = "ID,Title,Created At,Subscribers,Language,Tags,URL\n";
    const rows = tasks.map(task =>
      `"${task.id}","${task.title}","${task.createdAt}","${task.subscribers}","${task.detectedLanguage || 'N/A'}","${task.tags.join(', ')}","${task.phabricatorUrl}"`
    ).join("\n");
    return header + rows;
  }

  if (format === "md") {
    const header = "| ID | Title | Created At | Subs | Lang | URL |\n|----|-------|------------|------|------|-----|\n";
    const rows = tasks.map(task =>
      `| ${task.id} | ${task.title} | ${task.createdAt} | ${task.subscribers} | ${task.detectedLanguage || 'N/A'} | [Link](${task.phabricatorUrl}) |`
    ).join("\n");
    return header + rows;
  }

  throw new Error("Unsupported format");
}

const Page: FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFetchTasks = useCallback(() => {
    startTransition(async () => {
      try {
        const fetchedTasks = await fetchTasksFromApi(filters);
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
