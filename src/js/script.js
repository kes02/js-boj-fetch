// BOJ 난이도 맵핑 및 공통 태그
const TIER_MAP = {
    0: "Unrated",
    1: "Bronze V",
    2: "Bronze IV",
    3: "Bronze III",
    4: "Bronze II",
    5: "Bronze I",
    6: "Silver V",
    7: "Silver IV",
    8: "Silver III",
    9: "Silver II",
    10: "Silver I",
    11: "Gold V",
    12: "Gold IV",
    13: "Gold III",
    14: "Gold II",
    15: "Gold I",
    16: "Platinum V",
    17: "Platinum IV",
    18: "Platinum III",
    19: "Platinum II",
    20: "Platinum I",
    21: "Diamond V",
    22: "Diamond IV",
    23: "Diamond III",
    24: "Diamond II",
    25: "Diamond I",
    26: "Ruby V",
    27: "Ruby IV",
    28: "Ruby III",
    29: "Ruby II",
    30: "Ruby I",
    31: "Master"
};
const TIER_LEVELS = Object.entries(TIER_MAP);
const COMMON_TAGS = ["math", "implementation", "greedy", "string", "data_structures", "graphs", "dp", "bruteforcing", "sorting", "geometry", "segtree", "trees", "bfs", "dfs", "binary_search", "prefix_sum", "two_pointer", "backtracking", "number_theory", "combinatorics", "bitmask"];

let ruleCounter = 0;

// --- DOM 요소 캐싱 ---
const addUserBtn = document.getElementById('addUserBtn');
const newUserInput = document.getElementById('new-user-id');
const userList = document.getElementById('user-list');
const rulesContainer = document.getElementById('rules-container');
const addRuleBtn = document.getElementById('addRuleBtn');
const statusDiv = document.getElementById('status');
const tooltip = document.getElementById('tooltip');

// --- BOJ ID 관리 ---
const getUsersFromStorage = () => JSON.parse(localStorage.getItem('bojStudyUsers')) || [];
const saveUsersToStorage = (users) => localStorage.setItem('bojStudyUsers', JSON.stringify(users));

function renderUserList() {
    const users = getUsersFromStorage();
    userList.innerHTML = users.length > 0 ?
        users.map(user => `
            <li class="flex items-center cursor-pointer rounded-full transition-colors bg-blue-100 text-blue-800 has-[:checked]:bg-blue-500 has-[:checked]:text-white">
                <label class="flex items-center text-sm font-semibold px-2.5 py-1">
                    <input type="checkbox" data-id="${user}" class="user-checkbox appearance-none w-4 h-4 border-2 border-blue-300 rounded-sm mr-2" checked>
                    <span>${user}</span>
                </label>
                <button data-id="${user}" class="delete-user-btn ml-1 mr-2 text-blue-600 hover:text-red-500 has-[:checked]:text-white">&times;</button>
            </li>`).join('') :
        `<li class="text-gray-500 text-sm">등록된 사용자가 없습니다.</li>`;
}

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

function updateRemoveButtonStates() {
    const ruleItems = document.querySelectorAll('.rule-item');
    const removeButtons = document.querySelectorAll('.remove-rule-btn');
    const isSingleRule = ruleItems.length <= 1;

    removeButtons.forEach(btn => {
        btn.disabled = isSingleRule;
        btn.classList.toggle('opacity-30', isSingleRule);
        btn.classList.toggle('cursor-not-allowed', isSingleRule);

        // btn.title = isSingleRule ? '최소 1개의 조건이 필요합니다.' : '조건 삭제';
    });
}

// --- 문제 조건 관리 ---
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

    // 조건 컨테이너 하단에 개별 결과 컨테이너 추가
    const resultsContainer = document.createElement('div');
    resultsContainer.id = `results-${ruleId}`;
    resultsContainer.className = 'rule-results-container';

    wrapperElement.appendChild(ruleElement);
    wrapperElement.appendChild(resultsContainer);
    rulesContainer.appendChild(wrapperElement);


    ruleElement.querySelector('.tier-from-select').value = '6';
    ruleElement.querySelector('.tier-to-select').value = '15';

    // 이벤트 리스너 등록
    ruleElement.querySelector('.remove-rule-btn').addEventListener('click', () => {
        wrapperElement.remove();
        // 삭제 후 버튼 상태 업데이트
        updateRemoveButtonStates();
    });

    ruleElement.querySelector('.generate-rule-btn').addEventListener('click', () => handleGenerateSingleRule(ruleElement, resultsContainer));

    // 새 규칙 생성 후 버튼 상태 업데이트
    updateRemoveButtonStates();

    setupTagInput(ruleElement);
}

// --- 태그 입력 및 자동완성 로직 ---
function setupTagInput(ruleElement) {
    const tagInput = ruleElement.querySelector('.tag-input');
    const tagList = ruleElement.querySelector('.tag-list');
    const suggestionsPanel = ruleElement.querySelector('.autocomplete-suggestions');
    const getTags = () => Array.from(tagList.querySelectorAll('.tag-item')).map(li => li.dataset.tag);

    let selectedIndex = -1;

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

    const updateSelection = () => {
        const suggestions = suggestionsPanel.querySelectorAll('li');
        suggestions.forEach((li, index) => {
            li.classList.toggle('suggestion-active', index === selectedIndex);
        });
        if (selectedIndex > -1) {
            suggestions[selectedIndex].scrollIntoView({
                block: 'nearest'
            });
        }
    };

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

    suggestionsPanel.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            addTag(e.target.dataset.tag);
            tagInput.focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (!ruleElement.querySelector('.autocomplete-container').contains(e.target)) {
            suggestionsPanel.classList.add('hidden');
        }
    });
}


// --- 문제 생성 및 결과 표시 (개별 조건 로직) ---
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
        // 검색 완료 후 결과를 표시, 완료 메시지는 displayResults에서 처리
        if (resultsContainer.innerHTML.includes('조건에 맞는 문제를 찾는 중')) {
            resultsContainer.innerHTML = ''; // 로딩 메시지 삭제
        }
    }

    // 버튼 텍스트
    generateBtn.querySelector('span').textContent = isLoading ? '검색 중...' : '문제 생성하기';

    // 전역 statusDiv는 비워둠
    statusDiv.textContent = '';
}

async function findProblemsForRule(rule, unsolvedQuery) {
    const tierQuery = `tier:${rule.tierFrom}..${rule.tierTo}`;
    let tagQuery = '';
    if (rule.tags.length > 0) {
        tagQuery = rule.tagLogic === 'OR' ?
            `(${rule.tags.map(t => `tag:${t}`).join('|')})` :
            rule.tags.map(t => `tag:${t}`).join(' ');
    }
    const langQuery = `lang:${rule.lang.toLowerCase()}`;
    const fullQuery = `${tierQuery} ${tagQuery} ${langQuery} ${unsolvedQuery}`.trim();
    const encodedQuery = encodeURIComponent(fullQuery);
    const apiUrl = `https://boj-proxy-server.vercel.app/api/proxy?query=${encodedQuery}&sort=${rule.sort}`;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        const problems = data.items || [];
        const finalProblems = rule.sort === 'random' ? problems.sort(() => 0.5 - Math.random()) : problems;
        return finalProblems.slice(0, rule.count);
    } catch (error) {
        console.error(`Fetching problems failed for query "${fullQuery}":`, error);
        statusDiv.textContent = `API 요청 실패. 브라우저 콘솔(F12)을 확인해주세요.`;
        return [];
    }
}

// 개별 조건별 문제 생성 핸들러
async function handleGenerateSingleRule(ruleElement, resultsContainer) {
    setRuleLoading(ruleElement, true, resultsContainer);

    const selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.dataset.id);
    if (selectedUsers.length === 0) {
        alert('문제를 필터링할 스터디원을 한 명 이상 선택해주세요.');
        setRuleLoading(ruleElement, false, resultsContainer);
        return;
    }
    const unsolvedQuery = selectedUsers.map(u => `-solved_by:${u}`).join(' ');

    const count = parseInt(ruleElement.querySelector('.count-input').value) || 0;
    if (count <= 0) {
        alert('문제 수를 1개 이상으로 설정해주세요.');
        setRuleLoading(ruleElement, false, resultsContainer);
        return;
    }

    const rule = {
        tierFrom: ruleElement.querySelector('.tier-from-select').value,
        tierTo: ruleElement.querySelector('.tier-to-select').value,
        tags: Array.from(ruleElement.querySelectorAll('.tag-item')).map(li => li.dataset.tag),
        tagLogic: ruleElement.querySelector('input[type="radio"]:checked').value,
        sort: ruleElement.querySelector('.sort-select').value,
        lang: ruleElement.querySelector('.lang-select').value,
        count: count
    };

    const problems = await findProblemsForRule(rule, unsolvedQuery);
    displayResults(rule, problems, resultsContainer);

    setRuleLoading(ruleElement, false, resultsContainer);
}

let tooltipTimer;

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

// 개별 결과 컨테이너에 결과 표시
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

    let html = `
        <h3 class="text-lg font-semibold text-gray-800 mb-3">
            검색 결과: <span class="font-normal text-gray-600">${TIER_MAP[rule.tierFrom]} ~ ${TIER_MAP[rule.tierTo]} / ${topicDisplay} / ${rule.count}문제</span>
        </h3>
        <div class="space-y-3 ${scrollClass}">
            ${problemsHtml}
        </div>
    `;

    resultsContainer.innerHTML = html;
}

// --- 초기화 및 이벤트 리스너 등록 ---
function initialize() {
    renderUserList();
    createNewRule();
    updateRemoveButtonStates();

    addUserBtn.addEventListener('click', handleAddUser);
    newUserInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddUser();
    });
    userList.addEventListener('click', handleUserListClick);
    if (addRuleBtn) {
        addRuleBtn.addEventListener('click', createNewRule);
    }

    // 개별 결과 컨테이너에서 복사 버튼 클릭을 처리하도록 변경
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

window.addEventListener('load', initialize);