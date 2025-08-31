

"use client";

import type { FC } from "react";
import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadMore from "@/components/load-more";
import TaskFeed from "@/components/task-feed";

import type { Task, Filters, TaskQuery, Difficulty, Language, SortOption, ProjectTag } from "@/lib/types";
import { difficulties, languages } from "@/lib/types";
import Header from "@/components/header";
import FilterBar from "@/components/filter-bar";
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
  projectPHIDs: [],
  maxSubscribers: 10,
  openOnly: true,
  query: 'good-first',
  text: '',
};

const API_TASK_LIMIT = 10;
const MAX_VISIBLE_TASKS = 60; // Keep the DOM light

async function fetchTasksFromApi(filters: Filters, after?: string, order?: SortOption): Promise<{tasks: Task[], nextCursor: string | null}> {
  try {
    const response = await fetch('/api/tasks/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filters, after, order, limit: API_TASK_LIMIT })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
    }

    const data: {tasks: Task[], nextCursor: string | null} = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
}

async function enrichTask(task: Task): Promise<Task> {
    let detectedLanguage: Language | 'Unknown' = 'Unknown';
    let languageConfidence = 0;
    let gerritUrl: string | undefined = undefined;
    let difficulty: Difficulty | 'Medium' = 'Medium';

    try {
        const langResponse = await fetch('/api/tasks/detect-language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: `${task.title} ${task.description}` })
        });
        if (langResponse.ok) {
            const langData = await langResponse.json();
            detectedLanguage = langData.language;
            languageConfidence = langData.confidence;
        }
    } catch (e) { /* ignore */ }

    try {
        const gerritResponse = await fetch(`/api/gerrit/${task.id}`);
        if (gerritResponse.ok) {
            const gerritData = await gerritResponse.json();
            gerritUrl = gerritData.url;
        }
    } catch (e) { /* ignore */ }

    try {
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
    
    return { ...task, detectedLanguage, languageConfidence, gerritUrl, difficulty };
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
  const [totalTasksFetched, setTotalTasksFetched] = useState(0);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [sortOption, setSortOption] = useState<SortOption>('dateCreated');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<Task[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [allTags, setAllTags] = useState<ProjectTag[]>([]);

   useEffect(() => {
        async function fetchTags() {
            try {
                const res = await fetch('/api/tags');
                const data = await res.json();
                if (data.tags) {
                    setAllTags(data.tags.sort((a: ProjectTag, b: ProjectTag) => a.name.localeCompare(b.name)));
                }
            } catch (e) {
                console.error("Failed to fetch tags", e);
            }
        }
        fetchTags();
    }, []);

  const handleFetchTasks = useCallback((newFilters: Filters) => {
    startTransition(async () => {
      try {
        const order = sortOption === 'dateCreated' ? 'newest' : (sortOption === 'subscribers' ? 'priority' : undefined);
        const { tasks: fetchedTasks, nextCursor: newNextCursor } = await fetchTasksFromApi(newFilters, undefined, order);
        
        const initialTasks = fetchedTasks.map(task => ({
            ...task,
            difficulty: 'Medium' as Difficulty,
            detectedLanguage: 'Unknown' as Language,
            languageConfidence: 0,
        }));
        setTasks(initialTasks); 
        setTotalTasksFetched(initialTasks.length);
        setNextCursor(newNextCursor);
        
        fetchedTasks.forEach(async (task, index) => {
            const enrichedTask = await enrichTask(task);
            setTasks(prevTasks => {
                const newTasks = [...prevTasks];
                const taskIndex = newTasks.findIndex(t => t.id === enrichedTask.id);
                if (taskIndex !== -1) {
                  newTasks[taskIndex] = enrichedTask;
                  return newTasks;
                }
                return prevTasks;
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
  }, [toast, sortOption]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isFetchingMore) return;

    setIsFetchingMore(true);
    try {
        const order = sortOption === 'dateCreated' ? 'newest' : (sortOption === 'subscribers' ? 'priority' : undefined);
        const { tasks: newTasks, nextCursor: newNextCursor } = await fetchTasksFromApi(filters, nextCursor, order);
        
        setNextCursor(newNextCursor);
        setTotalTasksFetched(prev => prev + newTasks.length);

        const enrichedTasks = await Promise.all(newTasks.map(enrichTask));
        setTasks(prevTasks => {
          const combinedTasks = [...prevTasks, ...enrichedTasks];
          // Implement sliding window to keep DOM light
          if (combinedTasks.length > MAX_VISIBLE_TASKS) {
            return combinedTasks.slice(combinedTasks.length - MAX_VISIBLE_TASKS);
          }
          return combinedTasks;
        });


    } catch (error) {
        console.error("Failed to load more tasks:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load more tasks.",
        });
    } finally {
        setIsFetchingMore(false);
    }
  }, [nextCursor, isFetchingMore, filters, toast, sortOption]);

  useEffect(() => {
    const handler = setTimeout(() => {
        handleFetchTasks(filters);
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [filters, handleFetchTasks]);
  
  useEffect(() => {
    if (searchText.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/tasks/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchText }),
        });
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.tasks);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      }
    };

    const handler = setTimeout(() => {
      fetchSuggestions();
    }, 300); // Debounce suggestion fetching

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const handleQueryChange = (query: TaskQuery | null) => {
    setFilters(prev => ({ ...prev, query }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  }

  const handleSearchSubmit = () => {
     setFilters(prev => ({...prev, query: null, text: searchText}));
     setSuggestions([]);
     // Don't clear searchText here, so user can see what they searched for
  }
  
  const handleSuggestionClick = (task: Task) => {
    setSearchText(`T${task.id}`);
    setSuggestions([]);
    setFilters({ ...INITIAL_FILTERS, query: null, text: `T${task.id}` });
  };
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  }

  const handleRefresh = () => {
    handleFetchTasks(filters);
    toast({
      title: "Tasks Refreshed",
      description: "The task list has been updated.",
    });
  };
  
  const sortedTasks = useMemo(() => {
    let tasksToFilter = [...tasks];

    // AI-based filtering happens post-fetch, so it's not here.
    // Sorting logic remains client-side for immediate user feedback.
    if (sortOption === 'subscribers') {
        return tasksToFilter.sort((a, b) => b.subscribers - a.subscribers);
    }

    if (sortOption === 'difficulty') {
        const difficultyOrder: Difficulty[] = ['Easy', 'Medium', 'Hard'];
        return tasksToFilter.sort((a, b) => difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty));
    }

    if (sortOption === 'dateCreated') {
        return tasksToFilter.sort((a, b) => b.dateCreated - a.dateCreated);
    }

    return tasksToFilter;
  }, [tasks, sortOption]);

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
    if (filterType === 'projectPHIDs') {
      const currentValues = filters[filterType] as string[];
      handleFilterChange({ [filterType]: currentValues.filter(item => item !== value) });
    } else if (filterType === 'query') {
        handleQueryChange(null);
    }
  };
  
  const resetAllFilters = () => {
    setFilters(INITIAL_FILTERS);
  }

  const activeProjectTags = useMemo(() => {
    return allTags.filter(tag => filters.projectPHIDs.includes(tag.phid));
  }, [filters.projectPHIDs, allTags]);

  const activeFiltersForDisplay = [
    ...(filters.query ? [{type: 'query' as const, value: filters.query, label: filters.query.replace(/-/g, ' ')}] : []),
    ...activeProjectTags.map(tag => ({type: 'projectPHIDs' as const, value: tag.phid, label: tag.name}))
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
        suggestions={suggestions}
        onSuggestionClick={handleSuggestionClick}
      />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <FilterBar filters={filters} onFilterChange={handleFilterChange} onQueryChange={handleQueryChange} allTags={allTags} />
          
          {activeFiltersForDisplay.length > 0 && (
            <div className="sticky top-[65px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 -mt-2 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Active Filters:</span>
                {activeFiltersForDisplay.map(filter => (
                    <Badge key={`${filter.type}-${filter.value}`} variant="secondary" className="flex items-center gap-1 capitalize">
                    {filter.label}
                    <button onClick={() => removeFilterChip(filter.type, filter.value)} className="rounded-full hover:bg-muted-foreground/20" aria-label={`Remove ${filter.label} filter`}>
                        <X className="h-3 w-3" />
                    </button>
                    </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={resetAllFilters}>
                    Reset All
                </Button>
                </div>
            </div>
           )}

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {sortedTasks.length} of {totalTasksFetched} {totalTasksFetched === 1 ? 'task' : 'tasks'}.
                </p>
                <div className="flex items-center gap-2">
                    <Label htmlFor="sort-by" className="text-sm text-muted-foreground">Sort by:</Label>
                     <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                        <SelectTrigger id="sort-by" className="w-[180px]" aria-label="Sort by">
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
            <TaskFeed tasks={sortedTasks} isLoading={isPending} isFetchingMore={isFetchingMore} />
            {nextCursor && <LoadMore onLoadMore={handleLoadMore} isFetchingMore={isFetchingMore} />}
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

    