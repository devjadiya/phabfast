"use client";

import type { FC } from "react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Bot, Code, Settings, Globe, RefreshCw, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Filters, Language, Difficulty, TaskQuery } from "@/lib/types";
import { languages, difficulties } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";

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

const FilterBar: FC<FilterBarProps> = ({ filters, onFilterChange, onQueryChange }) => {
  const [maxSubscribers, setMaxSubscribers] = useState(filters.maxSubscribers);

  const handleLanguageToggle = (lang: Language) => {
    const newLangs = filters.languages.includes(lang)
      ? filters.languages.filter(l => l !== lang)
      : [...filters.languages, lang];
    onFilterChange({ languages: newLangs });
  };
  
  const handleDifficultyChange = (newDifficulties: Difficulty[]) => {
    onFilterChange({ difficulties: newDifficulties });
  };

  const resetFilters = () => {
    setMaxSubscribers(10);
    onFilterChange({
        dateRange: { from: undefined, to: undefined },
        languages: [],
        maxSubscribers: 10,
        difficulties: [],
    });
    onQueryChange(null);
  }

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm relative">
        <Button variant="ghost" size="icon" onClick={resetFilters} className="absolute top-1 right-1" aria-label="Reset filters">
            <RefreshCw className="h-4 w-4" />
        </Button>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-12">
          <Label>Quick Filters</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
              <Button
                  variant={filters.query === 'good-first' ? 'default' : 'outline'}
                  onClick={() => onQueryChange('good-first')}
                  className="justify-start bg-amber-500/10 border-amber-500/50 text-amber-700 hover:bg-amber-500/20"
              >
                  <Star className="mr-2 h-4 w-4" /> Good First Task
              </Button>
              {trackButtons.map(({ id, label, icon }) => (
                  <Button 
                      key={id} 
                      variant={filters.query === id ? 'default' : 'outline'}
                      onClick={() => onQueryChange(id)}
                      className="justify-start"
                  >
                      {icon} {label}
                  </Button>
              ))}
          </div>
        </div>

        <div className="md:col-span-3 space-y-2">
            <Label>Difficulty</Label>
            <ToggleGroup 
                type="multiple" 
                variant="outline" 
                value={filters.difficulties}
                onValueChange={handleDifficultyChange}
                className="justify-start"
                aria-label="Difficulty filter"
            >
                {difficulties.map(diff => (
                    <ToggleGroupItem key={diff} value={diff} aria-label={diff}>{diff}</ToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>
        
        <div className="md:col-span-9 space-y-2">
            <Label>Languages</Label>
            <div className="flex flex-wrap gap-2">
            {languages.filter(l => l !== 'Unknown').map((lang) => (
              <Button
                key={lang}
                variant={filters.languages.includes(lang) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLanguageToggle(lang)}
              >
                {lang}
              </Button>
            ))}
            </div>
        </div>
        
        <div className="md:col-span-5 space-y-2">
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
        
        <div className="md:col-span-4 space-y-2">
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
        
        <div className="md:col-span-3 space-y-2 flex items-end">
            <div className="flex items-center space-x-2">
                <Switch 
                    id="ai-guess"
                    checked={true}
                    disabled
                />
                <Label htmlFor="ai-guess">AI Language Detection</Label>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
