# 판교-청라 업무지구 비교분석 시스템

판교테크노밸리와 청라국제업무지구를 정적 웹사이트로 비교하는 분석 시스템입니다.

## 배포 구조

- GitHub Pages 배포 폴더: `docs/`
- 진입 파일: `docs/index.html`
- 정적 데이터: `docs/data/site-data.json`
- 별도 서버 DB 없이 브라우저에서 GeoJSON/JSON을 직접 읽어 동작합니다.

## GitHub Pages 설정

1. 이 폴더를 GitHub 레포지토리에 업로드합니다.
2. GitHub 레포지토리의 `Settings > Pages`로 이동합니다.
3. `Build and deployment`에서 다음처럼 설정합니다.
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`
4. 저장 후 표시되는 Pages URL로 접속합니다.

## 로컬 확인

```bash
npm install
npm start
```

접속:

```text
http://127.0.0.1:8765/docs/index.html
```

## 데이터 갱신

원천 데이터가 로컬에 있을 때 다음 명령으로 정적 데이터를 다시 생성합니다.

```bash
npm run build-pages
```

주의: 원천 SHP/ZIP/7z 파일과 `node_modules/`는 `.gitignore`에 의해 GitHub 업로드 대상에서 제외됩니다. 배포에는 `docs/` 안의 정적 파일만 필요합니다.

## 현재 반영 내용

- 판교·청라 종합 비교
- 토지이용 및 건축물 용도/용도지역 비교
- 지하철 30분/60분 접근권 폴리곤
- 접근 시간별 지하철 노드 색상 구분
- 인구·종사자·사업체 및 밀도 지표 비교
