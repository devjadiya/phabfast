
import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrainCircuit, RefreshCw, Search } from 'lucide-react';
import type { Task } from '@/lib/types';
import SearchSuggestion from './search-suggestion';

interface HeaderProps {
  onRefresh: () => void;
  searchText: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: () => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions: Task[];
  onSuggestionClick: (task: Task) => void;
}

const Header: FC<HeaderProps> = ({ 
  onRefresh, 
  searchText,
  onSearchChange,
  onSearchSubmit,
  onSearchKeyDown,
  suggestions,
  onSuggestionClick
}) => {
  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
            <span className="hidden sm:inline">PhabFast: </span>
            <span className="text-primary/90">Task Dashboard</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative flex w-full max-w-xs items-center">
            <Label htmlFor="search-tasks" className="sr-only">Search Tasks</Label>
            <Input 
              id="search-tasks"
              type="search"
              placeholder="Search tasks by ID or keyword..."
              className="pr-10"
              value={searchText}
              onChange={onSearchChange}
              onKeyDown={onSearchKeyDown}
              autoComplete="off"
            />
            <Button type="submit" size="icon" className="absolute right-1 h-8 w-8" onClick={onSearchSubmit} aria-label="Search">
                <Search className="h-4 w-4" />
            </Button>
            {suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md z-30">
                    <ul className="py-1">
                        {suggestions.map(task => (
                           <li key={task.id}>
                             <SearchSuggestion task={task} onClick={() => onSuggestionClick(task)} />
                           </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh tasks">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
