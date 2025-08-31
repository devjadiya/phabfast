
"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Bot, Code, Settings, Globe, RefreshCw, Star, X, Check, ChevronsUpDown } from "lucide-react";
import { CommandList } from "@/components/ui/command";

import { cn } from "@/lib/utils";
import type { Filters, TaskQuery, ProjectTag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  onQueryChange: (query: TaskQuery | null) => void;
}

const trackButtons: { id: TaskQuery, label: string, icon: React.ReactNode }[] = [
    { id: 'bot-dev', label: 'Bots', icon: <Bot className="mr-2 h-4 w-4" /> },
    { id: 'core', label: 'Core', icon: <Settings className="mr-2 h-4 w-4" /> },
    { id: 'gadgets', label: 'Gadgets', icon: <Code className="mr-2 h-4 w-4" /> },
    { id: 'web-tools', label: 'Web', icon: <Globe className="mr-2 h-4 w-4" /> },
];

const TagSelect: FC<{ selectedTags: ProjectTag[], onSelectedTagsChange: (tags: ProjectTag[]) => void }> = ({ selectedTags, onSelectedTagsChange }) => {
    const [open, setOpen] = useState(false);
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

    const handleSelect = (tag: ProjectTag) => {
        const isSelected = selectedTags.some(st => st.phid === tag.phid);
        if (isSelected) {
            onSelectedTagsChange(selectedTags.filter(st => st.phid !== tag.phid));
        } else {
            onSelectedTagsChange([...selectedTags, tag]);
        }
    };
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <span className="truncate">
                        {selectedTags.length > 0 ? `${selectedTags.length} selected` : "Select tags..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search tags..." />
                    <CommandEmpty>No tag found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                          {allTags.map((tag) => (
                              <CommandItem
                                  key={tag.phid}
                                  value={tag.name}
                                  onSelect={() => {
                                      handleSelect(tag);
                                  }}
                              >
                                  <Check
                                      className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedTags.some(st => st.phid === tag.phid) ? "opacity-100" : "opacity-0"
                                      )}
                                  />
                                  {tag.name}
                              </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


const FilterBar: FC<FilterBarProps> = ({ filters, onFilterChange, onQueryChange }) => {
  const [maxSubscribers, setMaxSubscribers] = useState(filters.maxSubscribers);
  const [selectedTags, setSelectedTags] = useState<ProjectTag[]>([]);

  const handleSelectedTagsChange = (newTags: ProjectTag[]) => {
      setSelectedTags(newTags);
      onFilterChange({ projectPHIDs: newTags.map(t => t.phid) });
  }

  const resetFilters = () => {
    setMaxSubscribers(10);
    setSelectedTags([]);
    onFilterChange({
        dateRange: { from: undefined, to: undefined },
        projectPHIDs: [],
        maxSubscribers: 10,
    });
    onQueryChange(null);
  }

  return (
    <div className="rounded-lg border bg-card/50 p-4 text-card-foreground shadow-sm relative glass-card">
        <Button variant="ghost" size="icon" onClick={resetFilters} className="absolute top-2 right-2" aria-label="Reset filters">
            <RefreshCw className="h-4 w-4" />
        </Button>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-12">
          <Label>Quick Filters</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
              <Button
                  variant={filters.query === 'good-first' ? 'secondary' : 'outline'}
                  onClick={() => onQueryChange('good-first')}
                  className="justify-start data-[state=active]:bg-amber-400/80 data-[state=active]:text-black"
              >
                  <Star className="mr-2 h-4 w-4" /> Good First Task
              </Button>
              {trackButtons.map(({ id, label, icon }) => (
                  <Button 
                      key={id} 
                      variant={filters.query === id ? 'secondary' : 'outline'}
                      onClick={() => onQueryChange(id)}
                      className="justify-start"
                  >
                      {icon} {label}
                  </Button>
              ))}
          </div>
        </div>

        <div className="md:col-span-5 space-y-2">
            <Label>Project Tags</Label>
             <TagSelect selectedTags={selectedTags} onSelectedTagsChange={handleSelectedTagsChange} />
        </div>
        
        <div className="md:col-span-4 space-y-2">
             <Label htmlFor="date-range-picker-trigger">Date Range</Label>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                    id="date-range-picker-trigger"
                    variant={"outline"}
                    aria-label="Pick a date range for tasks"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                        filters.dateRange.to ? (
                        <>
                            {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                            {format(filters.dateRange.to, "LLL dd, y")}
                        </>
                        ) : (
                        format(filters.dateRange.from, "LLL dd, y")
                        )
                    ) : (
                        <span>Pick a date range</span>
                    )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange as DateRange}
                    onSelect={(range) => onFilterChange({ dateRange: range || { from: undefined, to: undefined } })}
                    numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
        
        <div className="md:col-span-3 space-y-2">
            <Label htmlFor="subscribers-slider" className="flex items-center">
                Max Subscribers: {maxSubscribers}
            </Label>
            <Slider
                id="subscribers-slider"
                min={0}
                max={20}
                step={1}
                value={[maxSubscribers]}
                onValueChange={(value) => setMaxSubscribers(value[0])}
                onValueCommit={(value) => onFilterChange({ maxSubscribers: value[0] })}
                aria-label="Maximum number of subscribers"
            />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
