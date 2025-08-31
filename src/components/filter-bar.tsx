"use client";

import type { FC } from "react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Languages, Users, Star, ChevronsUpDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Filters, Language, Difficulty } from "@/lib/types";
import { languages, difficulties } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
}

const FilterBar: FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  const [maxSubscribers, setMaxSubscribers] = useState(filters.maxSubscribers);

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Languages className="mr-2 h-4 w-4" />
              Languages ({filters.languages.length || 'Any'})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
             <DropdownMenuLabel>Filter by Language</DropdownMenuLabel>
             <DropdownMenuSeparator />
            {languages.map((lang) => (
              <DropdownMenuCheckboxItem
                key={lang}
                checked={filters.languages.includes(lang)}
                onCheckedChange={(checked) => {
                  const newLangs = checked
                    ? [...filters.languages, lang]
                    : filters.languages.filter((l) => l !== lang);
                  onFilterChange({ languages: newLangs });
                }}
              >
                {lang}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="space-y-2">
            <Label htmlFor="subscribers" className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Star className="mr-2 h-4 w-4" />
              Difficulty ({filters.difficulties.length || 'Any'})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter by Difficulty</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {difficulties.map((diff) => (
              <DropdownMenuCheckboxItem
                key={diff}
                checked={filters.difficulties.includes(diff)}
                onCheckedChange={(checked) => {
                  const newDiffs = checked
                    ? [...filters.difficulties, diff]
                    : filters.difficulties.filter((d) => d !== diff);
                  onFilterChange({ difficulties: newDiffs });
                }}
              >
                {diff}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="open-only" 
            checked={filters.openOnly}
            onCheckedChange={(checked) => onFilterChange({ openOnly: !!checked })}
          />
          <label
            htmlFor="open-only"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Open Only
          </label>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
