export * from './auth';

export interface Problem {
  id: string;
  title: string;
  number: number;
  difficulty: string;
  tags: Tag[];
  url: string;
}

/** POST /api/attempts 요청 본문. userId는 JWT에서 추출하므로 포함하지 않는다. */
export interface CreateAttemptRequest {
  problemId: string;
  elapsedTime: number;
  result: 'CORRECT' | 'WRONG' | 'HOLD';
  tagIds: number[];
  memo?: string | null;
}

/** POST /api/attempts 201 응답 본문. createdAt은 ISO 8601 UTC(Z 접미사). */
export interface AttemptResponse {
  id: number;
  problemId: string;
  elapsedTime: number;
  result: 'CORRECT' | 'WRONG' | 'HOLD';
  tags: Tag[];
  memo: string | null;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
  category: string;
}

export interface UserStats {
  totalSolved: number;
  totalAttempts: number;
  solvedByDifficulty: Record<string, number>;
  solvedByTag: Record<string, number>;
}
