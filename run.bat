@echo off
chcp 65001 > nul
echo ========================================================
echo   WeatherCast - 실시간 날씨 웹 애플리케이션 시작
echo ========================================================
echo.
echo 브라우저에서 날씨 앱을 실행합니다...
echo 종료하시려면 이 창에서 Ctrl + C 를 누르세요.
echo.

start "" "http://localhost:8080"
python -m http.server 8080
pause

