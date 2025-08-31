import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BrainCircuit, RefreshCw, Download, Bird, Bot } from 'lucide-react';
import type { TaskQuery } from '@/lib/types';

interface HeaderProps {
  onQueryChange: (query: TaskQuery) => void;
  onRefresh: () => void;
  onExport: (format: 'csv' | 'md') => void;
  activeQuery: TaskQuery | null;
}

const Header: FC<HeaderProps> = ({ onQueryChange, onRefresh, onExport, activeQuery }) => {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            PhabHunt
          </h1>
        </div>
        <div className="flex items-center gap-2">
           <Button
            variant={activeQuery === 'good-first' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onQueryChange('good-first')}
          >
            <Bird className="mr-2 h-4 w-4" />
            Good First Tasks
          </Button>
          <Button
            variant={activeQuery === 'bot-dev' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onQueryChange('bot-dev')}
          >
            <Bot className="mr-2 h-4 w-4" />
            Bot Dev Tasks
          </Button>
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
