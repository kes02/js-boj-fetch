# BOJ 스터디 문제 출제기 🤖

알고리즘 스터디 그룹을 위한 백준(BOJ) 온라인 저지 문제 자동 추천 서비스입니다. 스터디원들이 아직 풀지 않은 문제를 조건에 맞게 추천하여, 매번 새로운 문제를 찾는 수고를 덜어줍니다.

🔗 Link: https://kes02.github.io/js-boj-fetch/
## ✨ 주요 기능

  * **스터디원 관리**: 백준 ID를 추가하고 목록을 관리할 수 있습니다. (브라우저 `localStorage`에 저장)
  * **다중 조건 설정**: 여러 개의 출제 조건을 동시에 설정하여 다양한 난이도와 유형의 문제를 조합할 수 있습니다.
  * **상세한 필터링**:
      * **난이도(티어)**: 브론즈부터 마스터까지 범위를 지정하여 문제를 필터링합니다.
      * **정렬**: 랜덤, 제출 많은 순, 정답 비율 높은 순 중에 선택할 수 있습니다.
      * **언어**: 한국어, 영어, 일본어 문제 중 원하는 언어를 선택할 수 있습니다.
      * **알고리즘 태그**: `dp`, `graphs`, `string` 등 특정 알고리즘 태그를 포함하거나, 여러 태그를 AND/OR 조건으로 검색합니다.
      * **출제 문제 수 작성**: 각 조건 별로 출제하고 싶은 문제 수를 작성합니다.
      * **푼 문제 제외**: 선택된 스터디원들이 이미 푼 문제는 결과에서 자동으로 제외합니다.
  * **결과 공유**: 추천된 문제의 링크를 간편하게 복사하여 스터디 그룹에 공유할 수 있습니다.

-----

## 🛠️ 기술 스택

  * **Frontend**: `HTML`, `JavaScript`, `Tailwind CSS`
  * **Backend (Proxy)**: `Node.js`, `Vercel Serverless Functions`, `Axios`
  * **Deployment**:
      * Frontend: **GitHub Pages**
      * Backend: **Vercel**
  * **API**: **[solved.ac API](https://www.google.com/search?q=https://solvedac.github.io/unofficial-documentation/%23/)**

-----

## Vercel을 이용한 CORS 문제 해결 🌐

이 프로젝트는 GitHub Pages에 배포된 정적(Static) 웹사이트에서 `solved.ac` API를 직접 호출할 때 발생하는 브라우저의 **CORS(Cross-Origin Resource Sharing) 정책** 문제를 해결해야 했습니다.

### 문제점

> 브라우저 보안 정책상, 웹 페이지(`GitHub Pages`)는 다른 도메인(`solved.ac`)의 API를 직접 호출할 수 없습니다.

### 해결 방법

> **Vercel의 서버리스 함수(Serverless Functions)를 프록시(Proxy) 서버로 활용**하여 이 문제를 우회했습니다. Vercel은 비상업적 용도에 한해 무료로 사용할 수 있어 매우 유용합니다.

#### 동작 흐름

1.  **[클라이언트: GitHub Pages]**

      * 사용자가 '문제 생성하기' 버튼을 누르면, `solved.ac` API 대신 우리가 Vercel에 배포한 프록시 서버로 API 요청을 보냅니다.

2.  **[프록시 서버: Vercel]**

      * 클라이언트의 요청을 받은 Vercel 서버리스 함수는 `solved.ac` API로 다시 요청을 전달합니다. (서버와 서버 간의 통신에는 CORS 정책이 적용되지 않습니다.)

3.  **[API 서버: solved.ac]**

      * 프록시 서버의 요청을 받고, 조건에 맞는 문제 데이터를 응답합니다.

4.  **[프록시 서버: Vercel]**

      * `solved.ac`로부터 받은 데이터를 클라이언트에게 그대로 전달합니다.

5.  **[클라이언트: GitHub Pages]**

      * 최종적으로 데이터를 받아 화면에 문제 목록을 표시합니다.

이러한 구조 덕분에 브라우저의 CORS 정책을 준수하면서도 외부 API 데이터를 안전하고 안정적으로 가져올 수 있었습니다.

-----

## 🚀 커스텀하기

### Frontend (GitHub Pages)

1.  이 저장소를 클론(clone)합니다.
2.  `script.js` 파일의 `apiUrl` 변수 값을 자신의 Vercel 프록시 서버 주소로 변경합니다.
3.  저장소를 GitHub Pages에 배포합니다.
4.  Actions에서 배포된 GitHub Pages 링크를 확인합니다.

### Backend (Vercel Proxy)

1.  `npm install axios`를 설치합니다.
2.  프록시 서버용 `api/proxy.js`와 `package.json` 파일을 준비합니다.
3.  새로운 GitHub 저장소에 업로드합니다.
4.  Vercel에 해당 저장소를 연결하여 배포합니다.

-----

## 📄 라이선스

이 프로젝트는 [MIT License](https://www.google.com/search?q=LICENSE)를 따릅니다.