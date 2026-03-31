import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { findProblemsForRule } from '../js/api.js';

// 난이도 변환용 맵핑 객체
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

// 1. Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        // 2. 현재 한국 시간(KST) 구하기
        const now = new Date();
        const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const kstHour = kstTime.getUTCHours();
        const kstMinute = kstTime.getUTCMinutes();
        const kstDayOfWeek = kstTime.getUTCDay().toString(); // 0(일요일) ~ 6(토요일)
        const kstDayOfMonth = kstTime.getUTCDate().toString(); // 1 ~ 31

        // 3. DB에서 전체 구독자 목록 가져오기
        const { data: subscribers, error } = await supabase
            .from('subscribers')
            .select('*');

        if (error) throw error;
        if (!subscribers || subscribers.length === 0) {
            console.log(`등록된 구독자가 없습니다.`);
            return;
        }

        // 4. [테스트용] 현재 시간에 상관없이 나에게만 발송되도록 수정
        // const targetUsers = subscribers.filter(sub => {
        //     // 본인의 테스트용 이메일 주소를 여기에 입력하세요.
        //     const myTestEmail = '본인 이메일 주소';
        //
        //     if (sub.email === myTestEmail) {
        //         console.log(`✅ 테스트 대상 발견: ${sub.email}`);
        //         return true; // 시간/요일 따지지 않고 무조건 발송 대상에 포함
        //     }
        //
        //     return false; // 다른 구독자들에게는 발송되지 않음
        // });
        //
        // console.log(`🚀 총 발송 대상자: ${targetUsers.length}명`);

        // 4. 현재 시간에 메일을 받아야 하는 구독자 필터링
        const targetUsers = subscribers.filter(sub => {
            if (!sub.schedule_time || !sub.frequency) return false;

            // --- [시간 매칭 로직 시작] ---
            const [subHourStr, subMinStr] = sub.schedule_time.split(':');
            const subHour = parseInt(subHourStr, 10);
            const subMin = parseInt(subMinStr, 10);

            const currentTotalMins = kstHour * 60 + kstMinute;
            const subTotalMins = subHour * 60 + subMin;

            let diff = currentTotalMins - subTotalMins;
            if (diff < 0) diff += 24 * 60;

            const isTimeMatch = diff >= 0 && diff < 15;
            if (!isTimeMatch) return false;
            // --- [시간 매칭 로직 끝] ---

            // --- [주기 및 날짜 보정 로직 시작] ---
            if (sub.frequency === 'daily') return true;

            if (sub.frequency === 'weekly') {
                return Array.isArray(sub.day_value)
                    ? sub.day_value.includes(kstDayOfWeek)
                    : String(sub.day_value) === kstDayOfWeek;
            }

            if (sub.frequency === 'monthly') {
                const requestedDay = parseInt(sub.day_value, 10);

                // 해당 월의 마지막 날짜 구하기 (다음달의 0번째 날)
                const lastDayOfMonth = new Date(kstTime.getUTCFullYear(), kstTime.getUTCMonth() + 1, 0).getUTCDate();

                // 보정된 발송일 계산 (예: 31일 설정했으나 2월이면 28일로 계산)
                const actualSendDay = Math.min(requestedDay, lastDayOfMonth);

                // 오늘 날짜(kstDayOfMonth)가 보정된 발송일과 일치하는지 확인
                return parseInt(kstDayOfMonth, 10) === actualSendDay;
            }

            return false;
        });

        if (targetUsers.length === 0) {
            console.log(`${kstHour}:${kstMinute.toString().padStart(2, '0')} (KST) 기준 발송 대상자가 없습니다.`);
            return;
        }

        // 5. 이메일 전송기 설정 (Gmail 기준)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const TIER_COLORS = {
            Bronze: '#ad5600', Silver: '#435f7a', Gold: '#ec9a00',
            Platinum: '#27e2a4', Diamond: '#00b4fc', Ruby: '#ff0062', Master: '#ff4000'
        };

        // 6. 대상자별 문제 검색 및 이메일 발송
        for (const sub of targetUsers) {
            let problems = await findProblemsForRule(sub.conditions);

            if(sub.conditions.count) {
                problems = problems.slice(0, sub.conditions.count);
            }

            // 카드형 문제 리스트 생성
            const problemCardsHtml = problems.map(p => {
                const tierName = TIER_MAP[p.level] || 'Unknown';
                const tierBase = tierName.split(' ')[0];
                const tierColor = TIER_COLORS[tierBase] || '#333';
                const title = p.titleKo || p.titleEn || '제목 없음';

                return `
                  <div style="margin-bottom: 12px; padding: 12px 16px; border: 1px solid #e1e4e8; border-radius: 8px; background-color: #ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0; padding: 0; border-collapse: collapse;">
                      <tr>
                        <td align="left" valign="middle" style="padding-right: 12px;">
                          <span style="display: inline-block; vertical-align: middle; background-color: ${tierColor}; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; line-height: 1; margin-right: 6px;">
                            ${tierName}
                          </span>
                          <span style="display: inline-block; vertical-align: middle; color: #6a737d; font-size: 13px; font-family: monospace; margin-right: 6px;">
                            #${p.problemId}
                          </span>
                          <span style="display: inline-block; vertical-align: middle; font-size: 15px; font-weight: bold; color: #24292e;">
                            ${title}
                          </span>
                        </td>
                        
                        <td align="right" valign="middle" style="width: 100px; white-space: nowrap;">
                          <a href="https://www.acmicpc.net/problem/${p.problemId}" 
                             style="display: inline-block; padding: 7px 14px; background-color: #0366d6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center;">
                            풀러 가기
                          </a>
                        </td>
                      </tr>
                    </table>
                  </div>`;
            }).join('');

            const unsubscribeUrl = `https://kes02.github.io/js-boj-fetch/unsubscribe/index.html?email=${encodeURIComponent(sub.email)}`;
            const subscribeUrl = `https://kes02.github.io/js-boj-fetch/subscribe`;

            const sendTimeForBypass = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: sub.email,
                subject: `📬 [BOJ] 오늘의 알고리즘 추천 문제가 도착했습니다!`,
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard', sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #f6f8fa; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                      <h2 style="color: #24292e; margin: 0; font-size: 20px; letter-spacing: -0.5px;">오늘의 추천 문제</h2>
                      <p style="color: #586069; font-size: 14px; margin-top: 8px;">설정하신 조건에 맞는 문제를 배달해 드립니다.</p>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                      ${problemCardsHtml}
                    </div>
        
                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e1e4e8;">
                      <p style="font-size: 12px; color: #6a737d; line-height: 1.6; margin: 0;">
                        boj 문제 구독 서비스를 이용해 주셔서 감사합니다.<br>
                        설정 변경은 
                        <a href="${subscribeUrl}" style="color: #0366d6; text-decoration: none; font-weight: 500;">구독 페이지</a>에서, 구독을 원치 않으시면 
                        <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline; font-weight: 500;">구독 취소</a>를 클릭해 주세요.
                      </p>
                      <p style="font-size: 10px; color: #cccccc; margin-top: 8px;">
                        (발송 시간: ${sendTimeForBypass})
                      </p>
                    </div>
                  </div>
                `
            });
            console.log(`${sub.email} 발송 완료`);
        }
    } catch (err) {
        console.error('실행 중 에러 발생:', err);
        process.exit(1);
    }
}

run();