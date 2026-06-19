# GitHub 업로드 안내

이 프로젝트는 `docs/` 폴더를 GitHub Pages 배포 대상으로 사용합니다.

## 올려야 하는 주요 파일

- `docs/`
- `sushi_final_system/`
- `package.json`
- `package-lock.json`
- `serve_static.js`
- `README.md`
- `.gitignore`

`.gitignore`에 원천 ZIP/SHP/7z, `node_modules/`, 과거 실험 파일이 제외되도록 설정되어 있습니다.

## Git 명령으로 업로드

Git이 설치되어 있다면 프로젝트 루트에서 다음을 실행합니다.

```bash
git init
git add .
git commit -m "Deploy Pangyo-Cheongna comparison site"
git branch -M main
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

이미 원격 저장소가 연결되어 있다면 `remote add`는 생략하고 `git push`만 실행합니다.

## GitHub Pages 설정

GitHub 저장소에서:

1. `Settings > Pages`
2. `Source`: `Deploy from a branch`
3. `Branch`: `main`
4. `Folder`: `/docs`
5. `Save`

배포 후 URL은 보통 다음 형식입니다.

```text
https://<USER>.github.io/<REPO>/
```

## 배포 전 로컬 확인

```bash
npm install
npm start
```

브라우저에서 확인:

```text
http://127.0.0.1:8765/docs/index.html
```
