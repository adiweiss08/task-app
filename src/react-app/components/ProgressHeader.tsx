import { Progress } from "@/react-app/components/ui/progress";

interface ProgressHeaderProps {
  completedCount: number;
  totalCount: number;
  onClearCompleted: () => void;
}

export function ProgressHeader({
  completedCount,
  totalCount,
  onClearCompleted,
}: ProgressHeaderProps) {
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="mb-8 rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-sm border border-pink-100">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Your Progress</span>
        <span className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} tasks
        </span>
      </div>
      <Progress value={progressPercent} className="h-2.5" />
      {completedCount > 0 && (
        <button
          type="button"
          onClick={onClearCompleted}
          className="mt-3 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Clear completed tasks
        </button>
      )}
    </div>
  );
}
