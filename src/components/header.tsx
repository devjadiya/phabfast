import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { BrainCircuit, RefreshCw, Download, Search } from 'lucide-react';
import type { TaskQuery } from '@/lib/types';

interface HeaderProps {
  onQueryChange: (query: TaskQuery | null) => void;
  onRefresh: () => void;
  onExport: (format: 'csv' | 'md') => void;
  activeQuery: TaskQuery | null;
  searchText: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: () => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const Header: FC<HeaderProps> = ({ 
  onRefresh, 
  onExport, 
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
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search"
              placeholder="Search tasks by keyword..."
              className="pl-9"
              value={searchText}
              onChange={onSearchChange}
              onKeyDown={onSearchKeyDown}
            />
          </div>
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh tasks">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Export tasks">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('md')}>
                Export as Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
