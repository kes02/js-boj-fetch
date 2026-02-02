// ==========================================
// 상수 정의
// ==========================================
// BOJ 난이도 맵핑
const TIER_MAP = {
    0: "Unrated",
    1: "Bronze V", 2: "Bronze IV", 3: "Bronze III", 4: "Bronze II", 5: "Bronze I",
    6: "Silver V", 7: "Silver IV", 8: "Silver III", 9: "Silver II", 10: "Silver I",
    11: "Gold V", 12: "Gold IV", 13: "Gold III", 14: "Gold II", 15: "Gold I",
    16: "Platinum V", 17: "Platinum IV", 18: "Platinum III", 19: "Platinum II", 20: "Platinum I",
    21: "Diamond V", 22: "Diamond IV", 23: "Diamond III", 24: "Diamond II", 25: "Diamond I",
    26: "Ruby V", 27: "Ruby IV", 28: "Ruby III", 29: "Ruby II", 30: "Ruby I",
    31: "Master"
};
const TIER_LEVELS = Object.entries(TIER_MAP);

// 알고리즘 태그 목록
const COMMON_TAGS = [
    "math", "implementation", "greedy", "string", "data_structures", "graphs", "dp",
    "bruteforcing", "sorting", "geometry", "segtree", "trees", "bfs", "dfs",
    "binary_search", "prefix_sum", "two_pointer", "backtracking", "number_theory",
    "combinatorics", "bitmask"
];
let ruleCounter = 0;

// ==========================================
// DOM 요소 캐싱
// ==========================================
const addUserBtn = document.getElementById('addUserBtn');
const newUserInput = document.getElementById('new-user-id');
const userList = document.getElementById('user-list');
const rulesContainer = document.getElementById('rules-container');
const addRuleBtn = document.getElementById('addRuleBtn');
const statusDiv = document.getElementById('status');
const tooltip = document.getElementById('tooltip');

// ==========================================
// 사용자 관리
// ==========================================
const getUsersFromStorage = () => JSON.parse(localStorage.getItem('bojStudyUsers')) || [];
const saveUsersToStorage = (users) => localStorage.setItem('bojStudyUsers', JSON.stringify(users));

/**
 * 사용자 목록을 화면에 렌더링
 */
function renderUserList() {
    const users = getUsersFromStorage();
    userList.innerHTML = users.length > 0
        ? users.map(user => `
            <li class="flex items-center cursor-pointer rounded-full transition-colors bg-blue-100 text-blue-800 has-[:checked]:bg-blue-500 has-[:checked]:text-white">
                <label class="flex items-center text-sm font-semibold px-2.5 py-1">
                    <input type="checkbox" data-id="${user}" class="user-checkbox appearance-none w-4 h-4 border-2 border-blue-300 rounded-sm mr-2" checked>
                    <span>${user}</span>
                </label>
                <button data-id="${user}" class="delete-user-btn ml-1 mr-2 text-blue-600 hover:text-red-500 has-[:checked]:text-white">&times;</button>
            </li>`).join('')
        : `<li class="text-gray-500 text-sm">등록된 사용자가 없습니다.</li>`;
}

/**
 * 새 사용자 추가
 */
function handleAddUser() {
    const userId = newUserInput.value.trim();
    if (!userId) return alert('추가할 ID를 입력하세요.');

    const users = getUsersFromStorage();
    if (users.includes(userId)) return alert('이미 등록된 ID입니다.');

    users.push(userId);
    saveUsersToStorage(users);
    renderUserList();
    newUserInput.value = '';
}

/**
 * 사용자 삭제 처리
 */
function handleUserListClick(e) {
    if (e.target.classList.contains('delete-user-btn')) {
        const userId = e.target.dataset.id;
        if (confirm(`'${userId}'를 정말 삭제하시겠습니까?`)) {
            let users = getUsersFromStorage();
            users = users.filter(user => user !== userId);
            saveUsersToStorage(users);
            renderUserList();
        }
    }
}

// ==========================================
// 조건 규칙 관리
// ==========================================
/**
 * 삭제 버튼 활성화/비활성화 상태 업데이트
 */
function updateRemoveButtonStates() {
    const ruleItems = document.querySelectorAll('.rule-item');
    const removeButtons = document.querySelectorAll('.remove-rule-btn');
    const isSingleRule = ruleItems.length <= 1;

    removeButtons.forEach(btn => {
        btn.disabled = isSingleRule;
        btn.classList.toggle('opacity-30', isSingleRule);
        btn.classList.toggle('cursor-not-allowed', isSingleRule);
    });
}

/**
 * 새 조건 규칙 생성
 */
function createNewRule() {
    ruleCounter++;
    const ruleId = `rule-${ruleCounter}`;

    const wrapperElement = document.createElement('div');
    wrapperElement.dataset.ruleId = ruleId;

    const ruleElement = document.createElement('div');
    ruleElement.className = 'rule-item p-4 border rounded-lg bg-white grid grid-cols-12 gap-x-4 gap-y-3 items-center';

    const tierOptions = TIER_LEVELS.map(([level, name]) => `<option value="${level}">${name}</option>`).join('');

    ruleElement.innerHTML = `
        <div class="col-span-12 sm:col-span-5 flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600 rule-label">난이도</label>
            <select class="tier-from-select flex-grow px-2 py-2 border border-gray-300 rounded-md text-sm">${tierOptions}</select>
            <span class="text-gray-500">~</span>
            <select class="tier-to-select flex-grow px-2 py-2 border border-gray-300 rounded-md text-sm">${tierOptions}</select>
        </div>
        <div class="col-span-12 sm:col-span-4 flex items-center gap-2">
             <label class="text-sm font-medium text-gray-600 rule-label">기준</label>
             <select class="sort-select w-full px-2 py-2 border border-gray-300 rounded-md text-sm">
                 <option value="random" selected>랜덤</option>
                 <option value="solved">제출 많은 순</option>
                 <option value="ac_rate">정답 비율 높은 순</option>
             </select>
        </div>
        <div class="col-span-12 sm:col-span-3 flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600 rule-label">언어</label>
            <select class="lang-select w-full px-2 py-2 border border-gray-300 rounded-md text-sm">
                <option value="Ko" selected>한국어</option>
                <option value="En">English</option>
                <option value="Ja">日本語</option>
            </select>
            <button class="remove-rule-btn bg-red-100 text-red-700 hover:bg-red-200 font-bold leading-none">&times;</button>
        </div>
        <div class="col-span-12 flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600 rule-label">알고리즘</label>
            <div class="flex-grow autocomplete-container">
                <div class="tag-container">
                    <ul class="flex flex-wrap gap-2 items-center tag-list"></ul>
                    <input type="text" class="tag-input" placeholder="태그 입력 후 Enter">
                </div>
                <ul class="autocomplete-suggestions hidden shadow-md"></ul>
            </div>
        </div>
        <div class="col-span-12 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-600 rule-label">검색</label>
                <div class="flex items-center space-x-4">
                    <label class="flex items-center text-sm"><input type="radio" name="tag-logic-${ruleCounter}" value="AND" class="mr-1" checked>모두 포함 (AND)</label>
                    <label class="flex items-center text-sm"><input type="radio" name="tag-logic-${ruleCounter}" value="OR" class="mr-1">하나라도 포함 (OR)</label>
                </div>
            </div>
            
            <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-600 rule-label">문제 수</label>
                <input type="number" class="count-input w-20 px-3 py-2 border border-gray-300 rounded-md text-sm" value="5" min="1" max="100">
                <button class="generate-rule-btn bg-blue-600 text-white font-bold py-2 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center w-fit">
                    <div class="rule-loader hidden mr-2"></div>
                    <span>문제 생성하기</span>
                </button>
            </div>
        </div>
    `;

    // 결과 컨테이너 생성
    const resultsContainer = document.createElement('div');
    resultsContainer.id = `results-${ruleId}`;
    resultsContainer.className = 'rule-results-container';

    wrapperElement.appendChild(ruleElement);
    wrapperElement.appendChild(resultsContainer);
    rulesContainer.appendChild(wrapperElement);

    // 기본 난이도 설정 (Silver V ~ Gold I)
    ruleElement.querySelector('.tier-from-select').value = '6';
    ruleElement.querySelector('.tier-to-select').value = '15';

    // 이벤트 리스너 등록
    ruleElement.querySelector('.remove-rule-btn').addEventListener('click', () => {
        wrapperElement.remove();
        updateRemoveButtonStates();
    });

    ruleElement.querySelector('.generate-rule-btn').addEventListener('click',
        () => handleGenerateSingleRule(ruleElement, resultsContainer));

    updateRemoveButtonStates();
    setupTagInput(ruleElement);
}

// ==========================================
// 태그 입력 및 자동완성
// ==========================================
/**
 * 태그 입력 자동완성 설정
 */
function setupTagInput(ruleElement) {
    const tagInput = ruleElement.querySelector('.tag-input');
    const tagList = ruleElement.querySelector('.tag-list');
    const suggestionsPanel = ruleElement.querySelector('.autocomplete-suggestions');
    const getTags = () => Array.from(tagList.querySelectorAll('.tag-item')).map(li => li.dataset.tag);

    let selectedIndex = -1;

    /**
     * 태그 추가
     */
    const addTag = (tag) => {
        tag = tag.trim().toLowerCase();
        if (tag && !getTags().includes(tag) && COMMON_TAGS.includes(tag)) {
            const tagItem = document.createElement('li');
            tagItem.className = 'tag-item';
            tagItem.dataset.tag = tag;
            tagItem.innerHTML = `<span>${tag}</span><span class="tag-remove-btn" title="삭제">&times;</span>`;
            tagList.appendChild(tagItem);
            tagItem.querySelector('.tag-remove-btn').addEventListener('click', () => tagItem.remove());
        }
        tagInput.value = '';
        suggestionsPanel.innerHTML = '';
        suggestionsPanel.classList.add('hidden');
        selectedIndex = -1;
    };

    /**
     * 자동완성 선택 업데이트
     */
    const updateSelection = () => {
        const suggestions = suggestionsPanel.querySelectorAll('li');
        suggestions.forEach((li, index) => {
            li.classList.toggle('suggestion-active', index === selectedIndex);
        });
        if (selectedIndex > -1) {
            suggestions[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    };

    // 자동완성 표시
    tagInput.addEventListener('keyup', (e) => {
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) return;

        const query = e.target.value.trim().toLowerCase();
        if (query) {
            const filteredTags = COMMON_TAGS.filter(tag => tag.startsWith(query) && !getTags().includes(tag));
            suggestionsPanel.innerHTML = filteredTags.map(tag => `<li data-tag="${tag}">${tag}</li>`).join('');
            suggestionsPanel.classList.toggle('hidden', filteredTags.length === 0);
            selectedIndex = -1;
        } else {
            suggestionsPanel.classList.add('hidden');
        }
    });

    // 키보드 네비게이션
    tagInput.addEventListener('keydown', (e) => {
        const suggestions = suggestionsPanel.querySelectorAll('li');
        const isSuggestionsVisible = !suggestionsPanel.classList.contains('hidden');

        switch (e.key) {
            case 'ArrowDown':
                if (isSuggestionsVisible && suggestions.length > 0) {
                    e.preventDefault();
                    selectedIndex = (selectedIndex + 1) % suggestions.length;
                    updateSelection();
                }
                break;
            case 'ArrowUp':
                if (isSuggestionsVisible && suggestions.length > 0) {
                    e.preventDefault();
                    selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
                    updateSelection();
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (isSuggestionsVisible && selectedIndex > -1) {
                    addTag(suggestions[selectedIndex].dataset.tag);
                } else {
                    addTag(e.target.value);
                }
                break;
            case 'Escape':
                suggestionsPanel.classList.add('hidden');
                selectedIndex = -1;
                break;
            case ',':
                e.preventDefault();
                addTag(e.target.value);
                break;
        }
    });

    // 클릭으로 태그 선택
    suggestionsPanel.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            addTag(e.target.dataset.tag);
            tagInput.focus();
        }
    });

    // 외부 클릭 시 자동완성 닫기
    document.addEventListener('click', (e) => {
        if (!ruleElement.querySelector('.autocomplete-container').contains(e.target)) {
            suggestionsPanel.classList.add('hidden');
        }
    });
}

// ==========================================
// 문제 생성 및 API 호출
// ==========================================
/**
 * 로딩 상태 설정
 */
function setRuleLoading(ruleElement, isLoading, resultsContainer) {
    const loader = ruleElement.querySelector('.rule-loader');
    const generateBtn = ruleElement.querySelector('.generate-rule-btn');

    loader.classList.toggle('hidden', !isLoading);
    generateBtn.disabled = isLoading;
    generateBtn.classList.toggle('opacity-50', isLoading);
    generateBtn.classList.toggle('cursor-not-allowed', isLoading);

    if (isLoading) {
        const loadingMessage = `<p class="text-center text-blue-600 font-semibold py-3 flex items-center justify-center"><span class="rule-loader mr-2"></span> 조건에 맞는 문제를 찾는 중...</p>`;
        resultsContainer.innerHTML = loadingMessage;
    } else {
        if (resultsContainer.innerHTML.includes('조건에 맞는 문제를 찾는 중')) {
            resultsContainer.innerHTML = '';
        }
    }

    generateBtn.querySelector('span').textContent = isLoading ? '검색 중...' : '문제 생성하기';
    statusDiv.textContent = '';
}

/**
 * 프록시 서버를 통해 사용자가 푼 문제 목록 가져오기
 */
async function getSolvedProblems(userId) {
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
                console.log(`${userId} - 페이지 ${page}: ${data.items.length}개 문제 로드 (총 ${allSolved.size}개)`);

                if (data.items.length < 50) break;
            } else {
                break;
            }

            page++;
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        //console.log(`${userId}님이 푼 총 문제 수: ${allSolved.size}개`);
        return allSolved;
    } catch (error) {
        console.error(`${userId}의 푼 문제 목록 가져오기 실패:`, error);
        return new Set();
    }
}

/**
 * 조건에 맞는 문제 검색
 */
async function findProblemsForRule(rule) {
    const tierQuery = `tier:${rule.tierFrom}..${rule.tierTo}`;

    let tagQuery = '';
    if (rule.tags.length > 0) {
        tagQuery = rule.tagLogic === 'OR'
            ? `(${rule.tags.map(t => `tag:${t}`).join('|')})`
            : rule.tags.map(t => `tag:${t}`).join(' ');
    }

    const langQuery = `lang:${rule.lang.toLowerCase()}`;
    const fullQuery = `${tierQuery} ${tagQuery} ${langQuery}`.trim();

    //console.log('검색 쿼리:', fullQuery);

    const encodedQuery = encodeURIComponent(fullQuery);
    const apiUrl = `https://boj-proxy-server.vercel.app/api/proxy?query=${encodedQuery}&sort=${rule.sort}`;

    try {
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        //console.log(`API로부터 받은 문제 수: ${data.items?.length || 0}개`);

        const problems = data.items || [];
        const finalProblems = rule.sort === 'random'
            ? problems.sort(() => 0.5 - Math.random())
            : problems;

        return finalProblems;
    } catch (error) {
        console.error(`API 요청 실패:`, error);
        statusDiv.textContent = `API 요청 실패. 브라우저 콘솔(F12)을 확인해주세요.`;
        return [];
    }
}

/**
 * 개별 조건별 문제 생성 핸들러
 */
async function handleGenerateSingleRule(ruleElement, resultsContainer) {
    setRuleLoading(ruleElement, true, resultsContainer);

    const selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked'))
        .map(cb => cb.dataset.id);

    if (selectedUsers.length === 0) {
        alert('문제를 필터링할 스터디원을 한 명 이상 선택해주세요.');
        setRuleLoading(ruleElement, false, resultsContainer);
        return;
    }

    const count = parseInt(ruleElement.querySelector('.count-input').value) || 0;
    if (count <= 0) {
        alert('문제 수를 1개 이상으로 설정해주세요.');
        setRuleLoading(ruleElement, false, resultsContainer);
        return;
    }

    // console.log('선택된 사용자:', selectedUsers);

    // 선택된 사용자들이 푼 문제 목록 가져오기
    //console.log('사용자들의 푼 문제 목록을 가져오는 중...');
    const solvedProblemsSets = await Promise.all(
        selectedUsers.map(userId => getSolvedProblems(userId))
    );

    // 모든 사용자가 푼 문제들의 합집합
    const allSolvedProblems = new Set();
    solvedProblemsSets.forEach(solvedSet => {
        solvedSet.forEach(problemId => allSolvedProblems.add(problemId));
    });

    //console.log(`필터링할 문제 총 개수: ${allSolvedProblems.size}개`);

    const rule = {
        tierFrom: ruleElement.querySelector('.tier-from-select').value,
        tierTo: ruleElement.querySelector('.tier-to-select').value,
        tags: Array.from(ruleElement.querySelectorAll('.tag-item')).map(li => li.dataset.tag),
        tagLogic: ruleElement.querySelector('input[type="radio"]:checked').value,
        sort: ruleElement.querySelector('.sort-select').value,
        lang: ruleElement.querySelector('.lang-select').value,
        count: count
    };

    // 프록시 서버에서 문제 가져오기
    //console.log('조건에 맞는 문제를 검색하는 중...');
    const allProblems = await findProblemsForRule(rule);

    //console.log('필터링 전 문제 목록:');
    allProblems.slice(0, 5).forEach(p => {
        const isSolved = allSolvedProblems.has(p.problemId);
        //console.log(`  - ${p.problemId}: ${isSolved ? '성공' : '미해결'}`);
    });

    // 클라이언트 측에서 필터링: 선택된 사용자들이 풀지 않은 문제만
    const unsolvedProblems = allProblems.filter(problem => !allSolvedProblems.has(problem.problemId));

    //console.log(`필터링 전: ${allProblems.length}개`);
    //console.log(`필터링 후: ${unsolvedProblems.length}개`);
    //console.log(`요청 문제 수: ${rule.count}개`);

    const finalProblems = unsolvedProblems.slice(0, rule.count);
    //console.log('최종 선택된 문제 번호 리스트:', finalProblems.map(p => p.problemId));

    displayResults(rule, finalProblems, resultsContainer);
    setRuleLoading(ruleElement, false, resultsContainer);
}

// ==========================================
// 결과 표시
// ==========================================
let tooltipTimer;
/**
 * 툴팁 표시
 */
function showTooltip(x, y, message) {
    clearTimeout(tooltipTimer);
    tooltip.textContent = message;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.opacity = '1';
    tooltipTimer = setTimeout(() => {
        tooltip.style.opacity = '0';
    }, 1500);
}

/**
 * 결과 컨테이너에 문제 목록 표시
 */
function displayResults(rule, problems, resultsContainer) {
    if (problems.length === 0) {
        resultsContainer.innerHTML = `<p class="text-center text-red-500 font-semibold py-3">조건에 맞는 문제를 찾지 못했습니다.</p>`;
        return;
    }

    const copyIconSvg = `<svg class="copy-icon" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>`;

    const langLower = rule.lang.toLowerCase();
    const titleKey = `title${rule.lang}`;

    const problemsForGroup = problems.map(p => ({
        problemId: p.problemId,
        title: p[titleKey] || p.titleKo,
        level: TIER_MAP[p.level] || 'Unknown',
        tags: p.tags.map(t => t.displayNames.find(dn => dn.language === langLower)?.name || t.key).join(', '),
        link: `https://www.acmicpc.net/problem/${p.problemId}`
    }));

    const problemsHtml = problemsForGroup.map(p => `
        <div class="p-4 border rounded-lg bg-gray-50">
            <p class="font-semibold text-gray-800">${p.problemId}. ${p.title}</p>
            <p class="mt-1 text-sm text-gray-600">- 난이도: ${p.level}</p>
            <p class="mt-1 text-sm text-gray-600">- 태그: ${p.tags}</p>
            <p class="mt-1 text-sm text-gray-600">
                - 링크: <a href="${p.link}" target="_blank" class="text-blue-600 hover:underline">${p.link}</a>
                <span class="copy-link-btn" data-link="${p.link}" title="링크 복사">${copyIconSvg}</span>
            </p>
        </div>
    `).join('');

    const scrollClass = problems.length >= 3 ? 'scrollable-problems' : '';
    const topicDisplay = rule.tags.join(', ') || '모든 태그';

    const html = `
        <h3 class="text-lg font-semibold text-gray-800 mb-3">
            검색 결과: <span class="font-normal text-gray-600">${TIER_MAP[rule.tierFrom]} ~ ${TIER_MAP[rule.tierTo]} / ${topicDisplay} / ${rule.count}문제</span>
        </h3>
        <div class="space-y-3 ${scrollClass}">
            ${problemsHtml}
        </div>
    `;

    resultsContainer.innerHTML = html;
}

// ==========================================
// 초기화
// ==========================================
/**
 * 애플리케이션 초기화
 */
function initialize() {
    renderUserList();
    createNewRule();
    updateRemoveButtonStates();

    // 이벤트 리스너 등록
    addUserBtn.addEventListener('click', handleAddUser);
    newUserInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddUser();
    });
    userList.addEventListener('click', handleUserListClick);

    if (addRuleBtn) {
        addRuleBtn.addEventListener('click', createNewRule);
    }

    // 링크 복사 버튼 처리
    document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-link-btn');
        if (copyBtn) {
            const linkToCopy = copyBtn.dataset.link;
            navigator.clipboard.writeText(linkToCopy).then(() => {
                showTooltip(e.clientX, e.clientY, '복사 완료');
            });
        }
    });
}

// 페이지 로드 시 초기화
window.addEventListener('load', initialize);