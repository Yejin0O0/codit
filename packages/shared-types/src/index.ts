export interface Problem {
  id: string;
  title: string;
  number: number;
  difficulty: string;
  tags: Tag[];
  url: string;
}

export interface Attempt {
  id: string;
  problemId: string;
  submittedAt: string;
  result: 'CORRECT' | 'WRONG' | 'TIMEOUT' | 'COMPILE_ERROR';
  language: string;
  memo?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface UserStats {
  totalSolved: number;
  totalAttempts: number;
  solvedByDifficulty: Record<string, number>;
  solvedByTag: Record<string, number>;
}
