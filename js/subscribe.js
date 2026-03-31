import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = '___SUPABASE_URL___';
const SUPABASE_ANON_KEY = '___SUPABASE_ANON_KEY___';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 인증 상태 변경 감지 및 자동 업데이트 ---
supabase.auth.onAuthStateChange(async (event, session) => {
    // 사용자가 메일 링크를 클릭하여 로그인(SIGNED_IN)된 순간 발동
    if (event === 'SIGNED_IN' && session) {
        const pendingData = localStorage.getItem('pending_subscription');

        if (pendingData) {
            try {
                const parsedData = JSON.parse(pendingData);
                console.log("임시 저장된 데이터 발견: DB 동기화를 시작합니다.");

                // 로그인된 세션 상태에서 메타데이터 업데이트
                const { error } = await supabase.auth.updateUser({
                    data: parsedData
                });

                if (error) throw error;

                // 업데이트 성공 시 로컬 스토리지 데이터 삭제
                localStorage.removeItem('pending_subscription');
                console.log("✅ 구독 정보 업데이트 및 임시 데이터 삭제 완료");
                alert("🎉 구독 설정 변경이 최종 완료되었습니다!");

                // 주소창의 인증 토큰 제거
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (err) {
                console.error("데이터 복구 중 에러:", err.message);
            }
        }
    }
});

const subscribeForm = document.getElementById('subscribe-form');
const submitBtn = document.getElementById('submit-btn');

// --- 1. 발송 주기 UI 제어 ---
const freqRadios = document.querySelectorAll('input[name="frequency"]');
const weeklyOptions = document.getElementById('weekly-options');
const monthlyOptions = document.getElementById('monthly-options');

freqRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const freq = e.target.value;
        if(weeklyOptions) weeklyOptions.style.display = freq === 'weekly' ? 'flex' : 'none';
        if(monthlyOptions) monthlyOptions.style.display = freq === 'monthly' ? 'flex' : 'none';
    });
});

// --- 2. 태그 시스템 (유효성 검사 및 자동완성) ---
const tagInput = document.getElementById('tag-input');
const tagList = document.getElementById('tag-list');
const autoList = document.getElementById('autocomplete-list');
const recommendTags = document.querySelectorAll('.recommend-tag');

const tagDatabase = ["math", "implementation", "greedy", "string", "data_structures", "graphs", "dp", "bruteforcing", "sorting", "geometry", "segtree", "trees", "bfs", "dfs", "binary_search", "prefix_sum", "two_pointer", "backtracking", "number_theory"];
let selectedTags = [];

function updatePlaceholder() {
    if (tagInput) tagInput.placeholder = selectedTags.length > 0 ? '' : '태그 입력 후 Enter (예: math, dp)';
}

function renderTags() {
    tagList.innerHTML = selectedTags.map(tag =>
        `<li class="tag-item">${tag} <span onclick="removeTag('${tag}')">&times;</span></li>`
    ).join('');
    updatePlaceholder();
}

window.removeTag = (tag) => {
    selectedTags = selectedTags.filter(t => t !== tag);
    renderTags();
};

function addTag(tagName) {
    const tag = tagName.trim().toLowerCase();
    // 데이터베이스에 있는 태그만 추가 허용
    if (tag && tagDatabase.includes(tag) && !selectedTags.includes(tag)) {
        selectedTags.push(tag);
        renderTags();
    }
    tagInput.value = '';
    if(autoList) autoList.style.display = 'none';
}

tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTag(tagInput.value);
    }
});

tagInput.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    if(!autoList) return;
    autoList.innerHTML = '';
    if (!val) { autoList.style.display = 'none'; return; }

    const filtered = tagDatabase.filter(t => t.includes(val) && !selectedTags.includes(t));
    if (filtered.length > 0) {
        autoList.style.display = 'block';
        filtered.forEach(t => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = t;
            item.onclick = () => addTag(t);
            autoList.appendChild(item);
        });
    } else { autoList.style.display = 'none'; }
});

recommendTags.forEach(tagBtn => {
    tagBtn.addEventListener('click', () => addTag(tagBtn.textContent));
});

// --- 3. 폼 제출 로직 ---
subscribeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = '처리 중...';

    const email = document.getElementById('email').value.trim();
    const frequency = document.querySelector('input[name="frequency"]:checked').value;
    const scheduleTime = document.getElementById('schedule-time').value;

    let dayValue = null;
    if (frequency === 'weekly') {
        dayValue = Array.from(document.querySelectorAll('input[name="day-of-week"]:checked')).map(cb => cb.value);
        if (dayValue.length === 0) {
            alert("최소 하나의 요일을 선택해 주세요.");
            submitBtn.disabled = false; submitBtn.textContent = '구독 시작하기';
            return;
        }
    } else if (frequency === 'monthly') {
        dayValue = document.getElementById('day-of-month').value;
    }

    const currentConditions = {
        tierFrom: document.getElementById('tier-from').value,
        tierTo: document.getElementById('tier-to').value,
        tags: selectedTags,
        tagLogic: document.querySelector('input[name="tag-logic"]:checked').value,
        sort: document.getElementById('sort-select').value,
        lang: document.getElementById('lang-select').value,
        count: parseInt(document.getElementById('count-input').value, 10) || 5
    };

    // 링크 클릭 후 돌아왔을 때 사용할 데이터를 로컬 스토리지에 임시 저장
    const subscriptionData = {
        frequency,
        day_value: dayValue,
        schedule_time: scheduleTime,
        conditions: currentConditions
    };
    localStorage.setItem('pending_subscription', JSON.stringify(subscriptionData));

    try {
        // 1. 신규 가입 시도
        const { data, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: 'dummy-password-1234',
            options: {
                data: subscriptionData, // 신규 가입 시에도 데이터 포함
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        });

        // 2. 이미 가입된 유저인 경우 (Identities 확인)
        const isAlreadyRegistered = data?.user && data.user.identities && data.user.identities.length === 0;

        if (isAlreadyRegistered || (signUpError && signUpError.message.includes("already registered"))) {
            // 매직 링크 발송 (기존 유저)
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });

            if (otpError) throw otpError;
            alert("이미 구독 중인 이메일입니다. 수정된 내용을 반영하기 위해 메일함의 '확인' 링크를 클릭해 주세요!");
        } else if (signUpError) {
            throw signUpError;
        } else {
            alert("📧 인증 메일이 발송되었습니다! 메일을 확인해 주세요.");
        }

        window.location.href = "index.html";

    } catch (err) {
        console.error("처리 중 에러:", err);
        localStorage.removeItem('pending_subscription');
        alert(err.message.includes("rate limit") ? "요청이 너무 많습니다. 잠시 후 시도해주세요." : "오류가 발생했습니다.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '구독 시작하기';
    }
});