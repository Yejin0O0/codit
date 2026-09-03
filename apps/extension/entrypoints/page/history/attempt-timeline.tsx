import { AttemptItem } from './attempt-item';
import type { ProblemAttempt, TagOption } from './types';

interface AttemptTimelineProps {
    attempts: ProblemAttempt[];
    tagCatalog: TagOption[];
}

export function AttemptTimeline({ attempts, tagCatalog }: AttemptTimelineProps) {
    const ordered = [...attempts].sort((a, b) => b.seq - a.seq);

    return (
        <div className="flex flex-col">
            {ordered.map((attempt) => (
                <AttemptItem key={attempt.seq} attempt={attempt} tagCatalog={tagCatalog} />
            ))}
        </div>
    );
}
