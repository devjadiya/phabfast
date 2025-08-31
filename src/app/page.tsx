"use client";

import type { FC } from "react";
import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { Task, Filters, TaskQuery, Difficulty, Language, SortOption } from "@/lib/types";
import { difficulties, languages } from "@/lib/types";
import Header from "@/components/header";
import FilterBar from "@/components/filter-bar";
import TaskFeed from "@/components/task-feed";
import { X, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


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
  text: '',
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
  const [sortOption, setSortOption] = useState<SortOption>('dateCreated');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');

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
    setFilters(prev => ({ ...prev, ...newFilters, query: prev.query && newFilters.query !== null ? null : prev.query }));
  };
  
  const handleQueryChange = (query: TaskQuery | null) => {
    setFilters(prev => ({ ...INITIAL_FILTERS, query }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  }

  const handleSearchSubmit = () => {
     setFilters(prev => ({...prev, query: null, text: searchText}))
  }
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  }

  const handleRefresh = () => {
    handleFetchTasks();
    toast({
      title: "Tasks Refreshed",
      description: "The task list has been updated.",
    });
  };
  
  const sortedTasks = useMemo(() => {
    const difficultyOrder: Difficulty[] = ['Easy', 'Medium', 'Hard'];
    const languageOrder: Language[] = [...languages, 'Unknown'];

    return [...tasks].sort((a, b) => {
        switch(sortOption) {
            case 'dateCreated':
                return b.dateCreated - a.dateCreated;
            case 'subscribers':
                return a.subscribers - b.subscribers;
            case 'difficulty': {
                const difficultyA = (a as any).difficulty || 'Medium';
                const difficultyB = (b as any).difficulty || 'Medium';
                return difficultyOrder.indexOf(difficultyA) - difficultyOrder.indexOf(difficultyB);
            }
            default:
                return 0;
        }
    });
  }, [tasks, sortOption]);

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
  
  const removeFilterChip = (filterType: keyof Filters, value: any) => {
    if (filterType === 'languages' || filterType === 'difficulties') {
      const currentValues = filters[filterType] as string[];
      handleFilterChange({ [filterType]: currentValues.filter(item => item !== value) } as Partial<Filters>);
    } else if (filterType === 'query') {
        handleQueryChange(null);
    }
  };

  const activeFilters = [
    ...(filters.query ? [{type: 'query' as keyof Filters, value: filters.query, label: filters.query.replace('-', ' ')}] : []),
    ...(filters.languages?.map(l => ({type: 'languages' as keyof Filters, value: l, label: l})) || []),
    ...(filters.difficulties?.map(d => ({type: 'difficulties' as keyof Filters, value: d, label: d})) || [])
  ];

  return (
    <>
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header
        onRefresh={handleRefresh}
        searchText={searchText}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onSearchKeyDown={handleSearchKeyDown}
      />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <FilterBar filters={filters} onFilterChange={handleFilterChange} onQueryChange={handleQueryChange} />
          
          {activeFilters.length > 0 && (
            <div className="sticky top-[65px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 -mt-2 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Active Filters:</span>
                {activeFilters.map(filter => (
                    <Badge key={`${filter.type}-${filter.value}`} variant="secondary" className="flex items-center gap-1 capitalize">
                    {filter.label}
                    <button onClick={() => removeFilterChip(filter.type, filter.value)} className="rounded-full hover:bg-muted-foreground/20">
                        <X className="h-3 w-3" />
                    </button>
                    </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setFilters(prev => ({...prev, languages: [], difficulties: [], query: null}))}>
                    Reset All
                </Button>
                </div>
            </div>
           )}

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Found {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}.
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                     <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dateCreated">Date</SelectItem>
                            <SelectItem value="subscribers">Popularity</SelectItem>
                            <SelectItem value="difficulty">Simplicity</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <TaskFeed tasks={sortedTasks} isLoading={isPending} />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
    <div className="fixed bottom-4 right-4 z-50">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Export tasks">
                    <Download className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('md')}>
                    Export as Markdown
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
    </>
  );
};

export default Page;
