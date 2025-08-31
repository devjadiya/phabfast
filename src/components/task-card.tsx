import type { FC } from 'react';
import type { Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Users, CalendarDays, ExternalLink, Code2, GitMerge } from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

const LanguageIcon: FC<{ language?: string }> = ({ language }) => {
  const lang = language?.toLowerCase();
  switch (lang) {
    case 'javascript':
      return <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-[#F7DF1E]"><title>JavaScript</title><path d="M0 0h24v24H0V0zm22.034 18.276c.89-1.463.955-3.32.1-4.823-.845-1.493-2.45-2.51-4.225-2.5-1.775-.01-3.38.985-4.225 2.523-.855 1.503-.79 3.36.1 4.823.89 1.463 2.45 2.428 4.125 2.428 1.775 0 3.335-.965 4.225-2.45zM12 18.276c.89-1.463.955-3.32.1-4.823-.845-1.493-2.45-2.51-4.225-2.5-1.775-.01-3.38.985-4.225 2.523-.855 1.503-.79 3.36.1 4.823.89 1.463 2.45 2.428 4.125 2.428 1.775 0 3.335-.965 4.225-2.45z"/></svg>;
    case 'python':
       return <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><title>Python</title><path d="M11.23 8.125H8.308v3.13h2.46v1.31h-2.46v4.6H6.998v-4.6H3.01v-1.31h3.988v-3.13H3.01V6.815h8.22v1.31zm1.54 9.355h2.922v-3.13h-2.46v-1.31h2.46v-4.6h1.31v4.6h3.988v1.31H15.69v3.13h3.988v1.31h-8.22v-1.31z" fill="#3776AB"/></svg>;
    case 'php':
        return <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-[#777BB4]"><title>PHP</title><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 13.5h-1V9H12v6h-1.5v.5zm4.5-1.5c0 .8-.6 1.5-1.5 1.5H12v-6h1.5c.8 0 1.5.7 1.5 1.5v3z"/><path d="M13.5 10.5h-1.5v3h1.5c.3 0 .5-.2.5-.5v-2c0-.3-.2-.5-.5-.5z"/></svg>;
    case 'lua':
        return <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-[#2C2D72]"><title>Lua</title><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.33 13.91c-.01 0-.01.03-.02.04-.32.43-.76.7-1.3.77-.32.05-.66.05-1.02.05h-1.4v-1.72h1.35c.42 0 .63-.04.75-.08.5-.17.8-.59.8-1.1v-1.9c0-.51-.3-1-.8-1.17-.12-.04-.33-.08-.75-.08h-1.35V8.5h3.13v5.41zm-6.66 0V8.5h3.13v1.72H9.42v1.5h1.2v1.46H9.42v1.73h2.38v1.72H8.67z"/></svg>;
    default:
      return <Code2 className="h-4 w-4" />;
  }
};

const TaskCard: FC<TaskCardProps> = ({ task }) => {
  return (
    <Card className="flex h-full flex-col transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">[{task.id}] {task.title}</CardTitle>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {task.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{task.subscribers} Subscribers</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageIcon language={task.detectedLanguage} />
            <span>{task.detectedLanguage}</span>
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <div className="flex w-full justify-between">
          <Button asChild variant="link" className="p-0 h-auto">
            <a href={task.phabricatorUrl} target="_blank" rel="noopener noreferrer">
              View on Phabricator <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          {task.gerritUrl ? (
            <Button asChild variant="link" className="p-0 h-auto text-accent hover:text-accent/90">
              <a href={task.gerritUrl} target="_blank" rel="noopener noreferrer">
                Related Patch <GitMerge className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">No patch</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
