import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = '___SUPABASE_URL___';
const SUPABASE_ANON_KEY = '___SUPABASE_ANON_KEY___';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false, // 로컬 스토리지에 토큰 저장 안 함
        autoRefreshToken: false
    }
});

// --- 인증 상태 변경 감지 및 자동 업데이트 ---
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        const userEmail = session.user.email;

        try {
            // 1. 임시 테이블에서 해당 유저의 설정값 가져오기
            const { data: tempData, error: fetchError } = await supabase
                .from('temp_subscribers')
                .select('*')
                .eq('email', userEmail)
                .maybeSingle(); // 데이터가 없을 수도 있으므로 maybeSingle 사용

            if (fetchError) throw fetchError;

            // 임시 데이터가 있다면 정식 테이블로 이전
            if (tempData) {
                const { error: upsertError } = await supabase
                    .from('subscribers')
                    .upsert({
                        email: tempData.email,
                        frequency: tempData.frequency,
                        day_value: tempData.day_value,
                        schedule_time: tempData.schedule_time,
                        conditions: tempData.conditions
                    });

                if (upsertError) throw upsertError;

                // 2. 처리가 끝난 임시 데이터 삭제
                await supabase.from('temp_subscribers').delete().eq('email', userEmail);

                alert("🎉 구독 설정이 최종 완료되었습니다!");

                // 3. 보안을 위해 즉시 로그아웃 (토큰 노출 방지)
                await supabase.auth.signOut();
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (err) {
            console.error("최종 처리 중 에러:", err.message);
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

    // 구독 신청하기 버튼 비활성화
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
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

    try {
        // 1. 임시 테이블에 데이터 저장
        const { error: tempError } = await supabase
            .from('temp_subscribers')
            .upsert({
                email,
                frequency,
                day_value: dayValue,
                schedule_time: scheduleTime,
                conditions: currentConditions
            }, { onConflict: 'email' });

        if (tempError) throw tempError;

        // 2. 신규 가입 시도 (signUp 호출 시 유저 생성됨)
        const { data, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: 'dummy-password-1234',
            options: {
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        });

        const isAlreadyRegistered = data?.user && data.user.identities && data.user.identities.length === 0;

        // 3. 이미 가입된 유저라면 매직 링크 발송
        if (isAlreadyRegistered || (signUpError && signUpError.message.includes("already registered"))) {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });
            if (otpError) throw otpError;
            alert("이미 구독 중인 이메일입니다. 수정 내용을 반영하려면 메일함의 '확인' 링크를 클릭해 주세요!");
        } else if (signUpError) {
            throw signUpError;
        } else {
            alert("📧 인증 메일이 발송되었습니다! 메일을 확인해 주세요.");
        }

        window.location.href = "../index.html"; // 폴더 구조에 맞춰 경로 수정

    } catch (err) {
        console.error("처리 중 에러:", err);

        // 에러 세분화
        if (err.message.includes("rate limit")) {
            alert("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
        } else {
            alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});