import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GenreLabelProps {
  name: string;
  className?: string;
}

export function GenreLabel({ name, className }: GenreLabelProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase tracking-wider bg-secondary/10 text-secondary hover:bg-secondary/20 border-0 shadow-none",
        className
      )}
    >
      {name}
    </Badge>
  );
}
