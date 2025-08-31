"use client";

import type { FC } from "react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Languages, Users, Star, ChevronsUpDown, Check, Bot, Code, Settings, Globe, X, RefreshCw, ToggleLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Filters, Language, Difficulty, TaskQuery } from "@/lib/types";
import { languages, difficulties } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">

        <div className="md:col-span-4 space-y-2">
            <Label>Track Selector</Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
            >
                {difficulties.map(diff => (
                    <ToggleGroupItem key={diff} value={diff}>{diff}</ToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>
        
        <div className="md:col-span-5 space-y-2">
            <Label>Languages</Label>
            <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
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
        
        <div className="md:col-span-4 space-y-2">
             <Label>Date Range</Label>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                    id="date"
                    variant={"outline"}
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
            <Label htmlFor="subscribers" className="flex items-center">
                Max Subscribers: {maxSubscribers}
            </Label>
            <Slider
                id="subscribers"
                min={0}
                max={20}
                step={1}
                value={[maxSubscribers]}
                onValueChange={(value) => setMaxSubscribers(value[0])}
                onValueCommit={(value) => onFilterChange({ maxSubscribers: value[0] })}
            />
        </div>
        
        <div className="md:col-span-3 space-y-2 flex items-end">
            <div className="flex items-center space-x-2">
                <Switch 
                    id="ai-guess"
                    // Add state and handler if AI guess toggle is implemented
                />
                <Label htmlFor="ai-guess">AI Guess Language</Label>
            </div>
        </div>

        <div className="md:col-span-2 flex items-end justify-end">
             <Button variant="ghost" onClick={resetFilters}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Filters
            </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
