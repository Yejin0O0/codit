-- 유형 태그 초기 시딩: 핵심 태그(CORE) 11개 + 카테고리 태그 14개, 총 25개.
-- 지은님 "유형 태그 API 명세서" v1.0 기준.
-- data.sql은 서버 기동 시마다 재실행되므로, 재시작해도 중복 삽입되지 않도록
-- WHERE NOT EXISTS로 이미 있는 normalized_name은 건너뛴다 (H2/PostgreSQL 공통 문법).

INSERT INTO tag (name, normalized_name, category)
SELECT * FROM (VALUES
    ('구현', '구현', 'CORE'),
    ('시뮬레이션', '시뮬레이션', 'CORE'),
    ('완전 검색(브루트포스)', '완전 검색(브루트포스)', 'CORE'),
    ('그리디', '그리디', 'CORE'),
    ('BFS', 'bfs', 'CORE'),
    ('DFS', 'dfs', 'CORE'),
    ('정렬', '정렬', 'CORE'),
    ('동적 계획법(DP)', '동적 계획법(dp)', 'CORE'),
    ('배열', '배열', 'CORE'),
    ('문자열', '문자열', 'CORE'),
    ('스택/큐', '스택/큐', 'CORE'),
    ('연결 리스트', '연결 리스트', 'DATA_STRUCTURE'),
    ('트리', '트리', 'DATA_STRUCTURE'),
    ('리스트(List)', '리스트(list)', 'DATA_STRUCTURE'),
    ('해시', '해시', 'DATA_STRUCTURE'),
    ('백트래킹', '백트래킹', 'SEARCH'),
    ('이분 탐색', '이분 탐색', 'SEARCH'),
    ('최단경로(다익스트라/플로이드-워셜/벨만-포드)', '최단경로(다익스트라/플로이드-워셜/벨만-포드)', 'GRAPH'),
    ('최소 신장 트리(크루스칼/프림)', '최소 신장 트리(크루스칼/프림)', 'GRAPH'),
    ('위상 정렬', '위상 정렬', 'GRAPH'),
    ('분할 정복', '분할 정복', 'ALGORITHM_DESIGN'),
    ('문자열 탐색(패턴 매칭, KMP 등)', '문자열 탐색(패턴 매칭, kmp 등)', 'STRING_ALGORITHM'),
    ('수학/정수론', '수학/정수론', 'MATH'),
    ('NP-Complete', 'np-complete', 'ADVANCED'),
    ('근사 알고리즘', '근사 알고리즘', 'ADVANCED')
) AS seed(name, normalized_name, category)
WHERE NOT EXISTS (
    SELECT 1 FROM tag WHERE tag.normalized_name = seed.normalized_name
);
