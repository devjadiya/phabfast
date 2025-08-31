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
import { Label } from "@/components/ui/label";


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

    const tasks: Task[] = await response.json();
    return tasks;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
}

async function enrichTask(task: Task): Promise<Task> {
    let detectedLanguage: Language | 'Unknown' = 'Unknown';
    let gerritUrl: string | undefined = undefined;
    let difficulty: Difficulty | 'Medium' = 'Medium';

    try {
        // Language Detection
        const langResponse = await fetch('/api/tasks/detect-language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: `${task.title} ${task.description}` })
        });
        if (langResponse.ok) {
            const langData = await langResponse.json();
            detectedLanguage = langData.language;
        }
    } catch (e) { /* ignore */ }

    try {
        // Gerrit Patch
        const gerritResponse = await fetch(`/api/gerrit/${task.id}`);
        if (gerritResponse.ok) {
            const gerritData = await gerritResponse.json();
            gerritUrl = gerritData.url;
        }
    } catch (e) { /* ignore */ }

    try {
        // Difficulty Detection
        const difficultyResponse = await fetch('/api/tasks/difficulty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: `${task.title} ${task.description}` })
        });
        if (difficultyResponse.ok) {
            const diffData = await difficultyResponse.json();
            difficulty = diffData.difficulty;
        }
    } catch(e) { /* ignore */ }
    
    return { ...task, detectedLanguage, gerritUrl, difficulty };
}

async function exportTasks(tasks: Task[], format: "csv" | "md"): Promise<string> {
  if (format === "csv") {
    const header = "ID,Title,Created At,Subscribers,Language,Difficulty,Tags,URL\n";
    const rows = tasks.map(task =>
      `"T${task.id}","${task.title}","${task.createdAt}","${task.subscribers}","${task.detectedLanguage || 'N/A'}","${task.difficulty || 'N/A'}","${task.tags.join(', ')}","${task.phabricatorUrl}"`
    ).join("\n");
    return header + rows;
  }

  if (format === "md") {
    const header = "| ID | Title | Created At | Subs | Lang | Difficulty | URL |\n|----|-------|------------|------|------|------------|-----|\n";
    const rows = tasks.map(task =>
      `| T${task.id} | ${task.title} | ${task.createdAt} | ${task.subscribers} | ${task.detectedLanguage || 'N/A'} | ${task.difficulty || 'N/A'} | [Link](${task.phabricatorUrl}) |`
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
        
        // Set initial tasks without enrichment for faster display
        const initialTasks = fetchedTasks.map(task => ({
            ...task,
            difficulty: 'Medium' as Difficulty,
            detectedLanguage: 'Unknown' as Language
        }));
        setTasks(initialTasks); 
        
        // Enrich tasks one by one
        fetchedTasks.forEach(async (task, index) => {
            const enrichedTask = await enrichTask(task);
            setTasks(prevTasks => {
                const newTasks = [...prevTasks];
                newTasks[index] = enrichedTask;
                return newTasks;
            });
        });

      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch tasks. Check the Phabricator API configuration and network.",
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

    let tasksToFilter = [...tasks];

    if (filters.difficulties && filters.difficulties.length > 0) {
        tasksToFilter = tasksToFilter.filter(task => filters.difficulties.includes(task.difficulty));
    }

    if (filters.languages && filters.languages.length > 0) {
      tasksToFilter = tasksToFilter.filter(task => {
        const taskLanguage = task.detectedLanguage || 'Unknown';
        return filters.languages.includes(taskLanguage as Language);
      })
    }

    return tasksToFilter.sort((a, b) => {
        switch(sortOption) {
            case 'dateCreated':
                return b.dateCreated - a.dateCreated;
            case 'subscribers':
                return a.subscribers - b.subscribers;
            case 'difficulty': {
                return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
            }
            default:
                return 0;
        }
    });
  }, [tasks, sortOption, filters.difficulties, filters.languages]);

  const handleExport = async (format: "csv" | "md") => {
    try {
      const fileContent = await exportTasks(sortedTasks, format);
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
    ...(filters.query ? [{type: 'query' as keyof Filters, value: filters.query, label: filters.query.replace(/-/g, ' ')}] : []),
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
                    <button onClick={() => removeFilterChip(filter.type, filter.value)} className="rounded-full hover:bg-muted-foreground/20" aria-label={`Remove ${filter.label} filter`}>
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
                    Found {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}.
                </p>
                <div className="flex items-center gap-2">
                    <Label htmlFor="sort-by" className="text-sm text-muted-foreground">Sort by:</Label>
                     <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                        <SelectTrigger id="sort-by" className="w-[180px]">
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
