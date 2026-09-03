import { Skeleton } from '@/components/ui/skeleton';

export function ListSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            {[0, 1, 2].map((row) => (
                <div key={row} className="flex flex-col gap-2 rounded-xl border p-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            ))}
        </div>
    );
}

export function DetailSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
            {[0, 1].map((row) => (
                <Skeleton key={row} className="h-16 w-full" />
            ))}
        </div>
    );
}
