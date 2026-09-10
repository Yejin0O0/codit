interface LiveDotProps {
    className?: string;
}

// R6 RED 스텁 — GREEN 에서 민트 animate-ping 도트로 채운다.
export function LiveDot({ className }: LiveDotProps) {
    return <span className={className} />;
}
