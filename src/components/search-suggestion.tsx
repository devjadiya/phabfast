
import type { FC } from 'react';
import type { Task } from '@/lib/types';

interface SearchSuggestionProps {
  task: Task;
  onClick: () => void;
}

const SearchSuggestion: FC<SearchSuggestionProps> = ({ task, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
    >
      <div className="font-semibold">T{task.id}</div>
      <div className="text-xs text-muted-foreground truncate">{task.title}</div>
    </button>
  );
};

export default SearchSuggestion;
