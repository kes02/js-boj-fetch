/**
 * 프록시 서버를 통해 사용자가 푼 문제 목록 가져오기
 */
export async function getSolvedProblems(userId) {
    try {
        const allSolved = new Set();
        let page = 1;
        const maxPages = 50;

        while (page <= maxPages) {
            const query = `solved_by:${userId}`;
            const encodedQuery = encodeURIComponent(query);
            const apiUrl = `https://boj-proxy-server.vercel.app/api/proxy?query=${encodedQuery}&sort=id&page=${page}`;

            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                console.error(`Failed to fetch page ${page} for ${userId}`);
                break;
            }

            const data = await response.json();

            if (data.items && data.items.length > 0) {
                data.items.forEach(problem => allSolved.add(problem.problemId));
                if (data.items.length < 50) break;
            } else {
                break;
            }

            page++;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        return allSolved;
    } catch (error) {
        console.error(`${userId}의 푼 문제 목록 가져오기 실패:`, error);
        return new Set();
    }
}

/**
 * 조건에 맞는 문제 검색
 */
export async function findProblemsForRule(rule) {
    const tierQuery = `tier:${rule.tierFrom}..${rule.tierTo}`;

    let tagQuery = '';
    if (rule.tags && rule.tags.length > 0) {
        tagQuery = rule.tagLogic === 'OR'
            ? `(${rule.tags.map(t => `tag:${t}`).join('|')})`
            : rule.tags.map(t => `tag:${t}`).join(' ');
    }

    const langQuery = `lang:${(rule.lang || 'Ko').toLowerCase()}`;
    const fullQuery = `${tierQuery} ${tagQuery} ${langQuery}`.trim();

    const encodedQuery = encodeURIComponent(fullQuery);
    const sortValue = rule.sort && rule.sort !== 'random' ? rule.sort : 'id'; // 기본 정렬값 설정
    const apiUrl = `https://boj-proxy-server.vercel.app/api/proxy?query=${encodedQuery}&sort=${sortValue}`;

    try {
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        const problems = data.items || [];

        const finalProblems = rule.sort === 'random'
            ? problems.sort(() => 0.5 - Math.random())
            : problems;

        return finalProblems;
    } catch (error) {
        console.error(`API 요청 실패:`, error);
        return [];
    }
}