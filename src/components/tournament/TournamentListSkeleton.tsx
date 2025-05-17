
import { Skeleton } from "@/components/ui/skeleton";

export function TournamentListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg overflow-hidden shadow-md">
          <div className="h-2 bg-gray-200"></div>
          <div className="p-5">
            <Skeleton className="h-7 w-3/4 mb-4" />
            
            <div className="space-y-3 mb-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
            
            <Skeleton className="h-5 w-2/3 mb-4" />
            
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
