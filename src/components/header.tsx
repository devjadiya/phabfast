import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrainCircuit, RefreshCw, Search } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  searchText: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: () => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const Header: FC<HeaderProps> = ({ 
  onRefresh, 
  searchText,
  onSearchChange,
  onSearchSubmit,
  onSearchKeyDown
}) => {
  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            PhabFast: Task Dashboard for Wikimedia
          </h1>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative flex w-full max-w-sm items-center">
            <Label htmlFor="search-tasks" className="sr-only">Search Tasks</Label>
            <Input 
              id="search-tasks"
              type="search"
              placeholder="Search tasks by keyword..."
              className="pr-10"
              value={searchText}
              onChange={onSearchChange}
              onKeyDown={onSearchKeyDown}
            />
            <Button type="submit" size="icon" className="absolute right-1 h-8 w-8" onClick={onSearchSubmit} aria-label="Search">
                <Search className="h-4 w-4" />
            </Button>
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
