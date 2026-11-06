/**
 * WeatherCast - Open-Meteo 무료 API 연동 스크립트
 * API Key 없이 전 세계 실시간 날씨, 시간별 예보, 7일 주간 예보 제공
 */

// ==========================================================================
// 1. WMO 날씨 코드 매핑 테이블
// ==========================================================================
const WMO_WEATHER_MAP = {
  0: { label: '맑음', iconDay: 'sun', iconNight: 'moon', theme: 'theme-clear' },
  1: { label: '대체로 맑음', iconDay: 'cloud-sun', iconNight: 'cloud-moon', theme: 'theme-clear' },
  2: { label: '구름 조금', iconDay: 'cloud-sun', iconNight: 'cloud-moon', theme: 'theme-clouds' },
  3: { label: '흐림', iconDay: 'cloud', iconNight: 'cloud', theme: 'theme-clouds' },
  45: { label: '안개', iconDay: 'cloud-fog', iconNight: 'cloud-fog', theme: 'theme-clouds' },
  48: { label: '상에 안개', iconDay: 'cloud-fog', iconNight: 'cloud-fog', theme: 'theme-clouds' },
  51: { label: '약한 이슬비', iconDay: 'cloud-drizzle', iconNight: 'cloud-drizzle', theme: 'theme-rain' },
  53: { label: '이슬비', iconDay: 'cloud-drizzle', iconNight: 'cloud-drizzle', theme: 'theme-rain' },
  55: { label: '강한 이슬비', iconDay: 'cloud-drizzle', iconNight: 'cloud-drizzle', theme: 'theme-rain' },
  56: { label: '어는 이슬비', iconDay: 'cloud-snow', iconNight: 'cloud-snow', theme: 'theme-snow' },
  57: { label: '강한 어는 이슬비', iconDay: 'cloud-snow', iconNight: 'cloud-snow', theme: 'theme-snow' },
  61: { label: '약한 비', iconDay: 'cloud-rain', iconNight: 'cloud-rain', theme: 'theme-rain' },
  63: { label: '비', iconDay: 'cloud-rain', iconNight: 'cloud-rain', theme: 'theme-rain' },
  65: { label: '강한 비', iconDay: 'cloud-rain', iconNight: 'cloud-rain', theme: 'theme-rain' },
  66: { label: '어는 비', iconDay: 'cloud-snow', iconNight: 'cloud-snow', theme: 'theme-snow' },
  67: { label: '강한 어는 비', iconDay: 'cloud-snow', iconNight: 'cloud-snow', theme: 'theme-snow' },
  71: { label: '약한 눈', iconDay: 'snowflake', iconNight: 'snowflake', theme: 'theme-snow' },
  73: { label: '눈', iconDay: 'snowflake', iconNight: 'snowflake', theme: 'theme-snow' },
  75: { label: '강한 눈', iconDay: 'snowflake', iconNight: 'snowflake', theme: 'theme-snow' },
  77: { label: '싸락눈', iconDay: 'snowflake', iconNight: 'snowflake', theme: 'theme-snow' },
  80: { label: '약한 소나기', iconDay: 'cloud-rain', iconNight: 'cloud-rain', theme: 'theme-rain' },
  81: { label: '소나기', iconDay: 'cloud-rain', iconNight: 'cloud-rain', theme: 'theme-rain' },
  82: { label: '강한 소나기', iconDay: 'cloud-rain', iconNight: 'cloud-rain', theme: 'theme-rain' },
  85: { label: '약한 눈 소나기', iconDay: 'cloud-snow', iconNight: 'cloud-snow', theme: 'theme-snow' },
  86: { label: '강한 눈 소나기', iconDay: 'cloud-snow', iconNight: 'cloud-snow', theme: 'theme-snow' },
  95: { label: '뇌우', iconDay: 'cloud-lightning', iconNight: 'cloud-lightning', theme: 'theme-thunder' },
  96: { label: '우박 동반 뇌우', iconDay: 'cloud-lightning', iconNight: 'cloud-lightning', theme: 'theme-thunder' },
  99: { label: '강한 우박 동반 뇌우', iconDay: 'cloud-lightning', iconNight: 'cloud-lightning', theme: 'theme-thunder' },
};

function getWeatherInfo(code, isDay = 1) {
  const item = WMO_WEATHER_MAP[code] || { label: '정보 없음', iconDay: 'cloud', iconNight: 'cloud', theme: 'theme-clouds' };
  let themeName = item.theme;
  if (item.theme === 'theme-clear') {
    themeName = isDay ? 'theme-clear-day' : 'theme-clear-night';
  }
  return {
    label: item.label,
    icon: isDay ? item.iconDay : item.iconNight,
    theme: themeName,
  };
}

// ==========================================================================
// 1-1. 국내 주요 도시 한글 - 좌표 매핑 테이블 (한국어 검색 100% 보장)
// ==========================================================================
const KOREA_CITY_PRESETS = {
  '서울': { name: '서울특별시', country: '대한민국', lat: 37.5665, lon: 126.9780 },
  '서울특별시': { name: '서울특별시', country: '대한민국', lat: 37.5665, lon: 126.9780 },
  '부산': { name: '부산광역시', country: '대한민국', lat: 35.1796, lon: 129.0756 },
  '부산광역시': { name: '부산광역시', country: '대한민국', lat: 35.1796, lon: 129.0756 },
  '대구': { name: '대구광역시', country: '대한민국', lat: 35.8714, lon: 128.6014 },
  '대구광역시': { name: '대구광역시', country: '대한민국', lat: 35.8714, lon: 128.6014 },
  '인천': { name: '인천광역시', country: '대한민국', lat: 37.4563, lon: 126.7052 },
  '인천광역시': { name: '인천광역시', country: '대한민국', lat: 37.4563, lon: 126.7052 },
  '광주': { name: '광주광역시', country: '대한민국', lat: 35.1595, lon: 126.8526 },
  '광주광역시': { name: '광주광역시', country: '대한민국', lat: 35.1595, lon: 126.8526 },
  '대전': { name: '대전광역시', country: '대한민국', lat: 36.3504, lon: 127.3845 },
  '대전광역시': { name: '대전광역시', country: '대한민국', lat: 36.3504, lon: 127.3845 },
  '울산': { name: '울산광역시', country: '대한민국', lat: 35.5384, lon: 129.3114 },
  '울산광역시': { name: '울산광역시', country: '대한민국', lat: 35.5384, lon: 129.3114 },
  '세종': { name: '세종특별자치시', country: '대한민국', lat: 36.4800, lon: 127.2890 },
  '세종시': { name: '세종특별자치시', country: '대한민국', lat: 36.4800, lon: 127.2890 },
  '제주': { name: '제주특별자치도', country: '대한민국', lat: 33.4996, lon: 126.5312 },
  '제주시': { name: '제주특별자치도', country: '대한민국', lat: 33.4996, lon: 126.5312 },
  '서귀포': { name: '서귀포시, 제주', country: '대한민국', lat: 33.2541, lon: 126.5601 },
  '수원': { name: '수원시, 경기도', country: '대한민국', lat: 37.2636, lon: 127.0286 },
  '수원시': { name: '수원시, 경기도', country: '대한민국', lat: 37.2636, lon: 127.0286 },
  '성남': { name: '성남시, 경기도', country: '대한민국', lat: 37.4201, lon: 127.1265 },
  '고양': { name: '고양시, 경기도', country: '대한민국', lat: 37.6584, lon: 126.8320 },
  '용인': { name: '용인시, 경기도', country: '대한민국', lat: 37.2411, lon: 127.1776 },
  '부천': { name: '부천시, 경기도', country: '대한민국', lat: 37.5034, lon: 126.7660 },
  '안산': { name: '안산시, 경기도', country: '대한민국', lat: 37.3219, lon: 126.8309 },
  '화성': { name: '화성시, 경기도', country: '대한민국', lat: 37.1995, lon: 126.8315 },
  '남양주': { name: '남양주시, 경기도', country: '대한민국', lat: 37.6360, lon: 127.2165 },
  '안양': { name: '안양시, 경기도', country: '대한민국', lat: 37.3943, lon: 126.9568 },
  '평택': { name: '평택시, 경기도', country: '대한민국', lat: 36.9921, lon: 127.1129 },
  '의정부': { name: '의정부시, 경기도', country: '대한민국', lat: 37.7381, lon: 127.0337 },
  '춘천': { name: '춘천시, 강원도', country: '대한민국', lat: 37.8813, lon: 127.7298 },
  '원주': { name: '원주시, 강원도', country: '대한민국', lat: 37.3422, lon: 127.9202 },
  '강릉': { name: '강릉시, 강원도', country: '대한민국', lat: 37.7519, lon: 128.8761 },
  '속초': { name: '속초시, 강원도', country: '대한민국', lat: 38.2070, lon: 128.5918 },
  '청주': { name: '청주시, 충청북도', country: '대한민국', lat: 36.6424, lon: 127.4890 },
  '충주': { name: '충주시, 충청북도', country: '대한민국', lat: 36.9910, lon: 127.9259 },
  '천안': { name: '천안시, 충청남도', country: '대한민국', lat: 36.8151, lon: 127.1139 },
  '공주': { name: '공주시, 충청남도', country: '대한민국', lat: 36.4465, lon: 127.1190 },
  '전주': { name: '전주시, 전북', country: '대한민국', lat: 35.8242, lon: 127.1480 },
  '군산': { name: '군산시, 전북', country: '대한민국', lat: 35.9676, lon: 126.7366 },
  '익산': { name: '익산시, 전북', country: '대한민국', lat: 35.9483, lon: 126.9576 },
  '목포': { name: '목포시, 전남', country: '대한민국', lat: 34.8118, lon: 126.3922 },
  '여수': { name: '여수시, 전남', country: '대한민국', lat: 34.7604, lon: 127.6622 },
  '순천': { name: '순천시, 전남', country: '대한민국', lat: 34.9506, lon: 127.4872 },
  '포항': { name: '포항시, 경북', country: '대한민국', lat: 36.0190, lon: 129.3435 },
  '경주': { name: '경주시, 경북', country: '대한민국', lat: 35.8562, lon: 129.2247 },
  '구미': { name: '구미시, 경북', country: '대한민국', lat: 36.1195, lon: 128.3446 },
  '안동': { name: '안동시, 경북', country: '대한민국', lat: 36.5684, lon: 128.7294 },
  '창원': { name: '창원시, 경남', country: '대한민국', lat: 35.2280, lon: 128.6811 },
  '김해': { name: '김해시, 경남', country: '대한민국', lat: 35.2285, lon: 128.8894 },
  '진주': { name: '진주시, 경남', country: '대한민국', lat: 35.1802, lon: 128.1076 },
  '도쿄': { name: '도쿄 (Tokyo)', country: '일본', lat: 35.6895, lon: 139.6917 },
  '오사카': { name: '오사카 (Osaka)', country: '일본', lat: 34.6937, lon: 135.5023 },
  '후쿠오카': { name: '후쿠오카 (Fukuoka)', country: '일본', lat: 33.5904, lon: 130.4017 },
  '뉴욕': { name: '뉴욕 (New York)', country: '미국', lat: 40.7128, lon: -74.0060 },
  '런던': { name: '런던 (London)', country: '영국', lat: 51.5074, lon: -0.1278 },
  '파리': { name: '파리 (Paris)', country: '프랑스', lat: 48.8566, lon: 2.3522 },
  '베이징': { name: '베이징 (Beijing)', country: '중국', lat: 39.9042, lon: 116.4074 },
  '상하이': { name: '상하이 (Shanghai)', country: '중국', lat: 31.2304, lon: 121.4737 },
  '방콕': { name: '방콕 (Bangkok)', country: '태국', lat: 13.7563, lon: 100.5018 },
  '시드니': { name: '시드니 (Sydney)', country: '호주', lat: -33.8688, lon: 151.2093 }
};
function getDayName(dateString) {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const d = new Date(dateString);
  return days[d.getDay()];
}

function formatDate(dateString) {
  const d = new Date(dateString);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}월 ${day}일`;
}

// ==========================================================================
// 2. DOM 요소 선택
// ==========================================================================
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const suggestionsBox = document.getElementById('search-suggestions');
const geoBtn = document.getElementById('geo-btn');
const quickChips = document.querySelectorAll('.city-chip');

const loadingEl = document.getElementById('loading');
const errorBanner = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const weatherContent = document.getElementById('weather-content');

// 날씨 정보 요소
const cityNameEl = document.getElementById('city-name');
const countryNameEl = document.getElementById('country-name');
const mapLinkBtn = document.getElementById('map-link-btn');
const currentTimeEl = document.getElementById('current-time');
const localDateEl = document.getElementById('local-date');
const localTimezoneEl = document.getElementById('local-timezone');
const weatherIconWrapper = document.getElementById('weather-icon-wrapper');
const weatherDescEl = document.getElementById('weather-description');
const currentTempEl = document.getElementById('current-temp');
const tempMinEl = document.getElementById('temp-min');
const tempMaxEl = document.getElementById('temp-max');
const apparentTempEl = document.getElementById('apparent-temp');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const precipitationEl = document.getElementById('precipitation');

const hourlyForecastList = document.getElementById('hourly-forecast-list');
const dailyForecastList = document.getElementById('daily-forecast-list');

// 미세먼지 요소
const airOverallBadge = document.getElementById('air-overall-badge');
const pm10ValEl = document.getElementById('pm10-val');
const pm10StatusEl = document.getElementById('pm10-status');
const pm10BarEl = document.getElementById('pm10-bar');
const pm25ValEl = document.getElementById('pm25-val');
const pm25StatusEl = document.getElementById('pm25-status');
const pm25BarEl = document.getElementById('pm25-bar');

// 해외 항공기 결항 모니터링 요소
const flightAlertSection = document.getElementById('flight-alert-section');
const flightAirportInfo = document.getElementById('flight-airport-info');
const flightRiskBadge = document.getElementById('flight-risk-badge');
const flightRiskText = document.getElementById('flight-risk-text');
const flightAlertBanner = document.getElementById('flight-alert-banner');
const flightAlertDesc = document.getElementById('flight-alert-desc');
const flightDisruptionIndex = document.getElementById('flight-disruption-index');
const flightWeatherFactor = document.getElementById('flight-weather-factor');
const flightRouteStatus = document.getElementById('flight-route-status');
const flightTrackerLink = document.getElementById('flight-tracker-link');

// ==========================================================================
// 2-1. 해외 주요 도시 공항 IATA 매핑 테이블
// ==========================================================================
const GLOBAL_AIRPORT_MAP = {
  '도쿄': { name: '도쿄 하네다 / 나리타 공항 (HND / NRT)', iata: 'HND' },
  '오사카': { name: '오사카 간사이 국제공항 (KIX)', iata: 'KIX' },
  '후쿠오카': { name: '후쿠오카 국제공항 (FUK)', iata: 'FUK' },
  '뉴욕': { name: '뉴욕 존 F. 케네디 국제공항 (JFK)', iata: 'JFK' },
  '런던': { name: '런던 히드로 공항 (LHR)', iata: 'LHR' },
  '파리': { name: '파리 샤를 드 골 공항 (CDG)', iata: 'CDG' },
  '로스앤젤레스': { name: '로스앤젤레스 국제공항 (LAX)', iata: 'LAX' },
  '샌프란시스코': { name: '샌프란시스코 국제공항 (SFO)', iata: 'SFO' },
  '시드니': { name: '시드니 킹스포드 스미스 공항 (SYD)', iata: 'SYD' },
  '방콕': { name: '방콕 수완나품 국제공항 (BKK)', iata: 'BKK' },
  '싱가포르': { name: '싱가포르 창이 국제공항 (SIN)', iata: 'SIN' },
  '베이징': { name: '베이징 서우두 / 다싱 국제공항 (PEK)', iata: 'PEK' },
  '상하이': { name: '상하이 푸둥 국제공항 (PVG)', iata: 'PVG' },
  '타이베이': { name: '타이베이 타오위안 국제공항 (TPE)', iata: 'TPE' },
  '홍콩': { name: '홍콩 첵랍콕 국제공항 (HKG)', iata: 'HKG' },
  '프랑크푸르트': { name: '프랑크푸르트 국제공항 (FRA)', iata: 'FRA' },
  '로마': { name: '로마 레오나르도 다 빈치 공항 (FCO)', iata: 'FCO' }
};

// ==========================================================================
// 3. API 요청 로직
// ==========================================================================

/**
 * 도시 이름으로 위도, 경도 검색 (프리셋 매핑 우선 + Open-Meteo Geocoding API)
 */
async function searchLocation(query) {
  const normalized = query.trim();
  const lower = normalized.toLowerCase();

  // 1. 프리셋 딕셔너리에서 일치 또는 부분 일치 검색
  const presetMatches = [];
  for (const [key, val] of Object.entries(KOREA_CITY_PRESETS)) {
    if (key === normalized || key.includes(normalized) || normalized.includes(key)) {
      presetMatches.push({
        name: val.name,
        country: val.country,
        latitude: val.lat,
        longitude: val.lon,
        isPreset: true
      });
    }
  }

  // 정확히 매치되는 항목이 있으면 상위 배치
  if (presetMatches.length > 0 && presetMatches[0].name.includes(normalized)) {
    // 중복 제거 후 반환
    const unique = [];
    const seen = new Set();
    for (const item of presetMatches) {
      if (!seen.has(item.name)) {
        seen.add(item.name);
        unique.push(item);
      }
    }
    return unique.slice(0, 5);
  }

  // 2. Open-Meteo Geocoding API 호출
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalized)}&count=5&language=ko&format=json`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return [...presetMatches, ...data.results].slice(0, 5);
      }
    }
  } catch (err) {
    console.warn('Geocoding API 호출 오류:', err);
  }

  return presetMatches.slice(0, 5);
}

/**
 * 위도, 경도로 날씨 데이터 호출 (Open-Meteo Forecast API)
 */
async function fetchWeatherData(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto'
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('날씨 데이터를 가져오지 못했습니다.');
  return await response.json();
}

/**
 * 위도, 경도로 미세먼지 데이터 호출 (Open-Meteo Air Quality API - 무료 & No Key)
 */
async function fetchAirQuality(lat, lon) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,european_aqi,us_aqi`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('대기질 데이터 호출 실패:', err);
    return null;
  }
}

/**
 * 역지오코딩 (위도/경도 -> 도시 이름)
 * 무료 역지오코딩 API (BigDataCloud)
 */
async function reverseGeocode(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const city = data.city || data.locality || data.principalSubdivision || '현재 위치';
    const country = data.countryName || '대한민국';
    return { city, country };
  } catch (err) {
    console.warn('역지오코딩 실패:', err);
    return null;
  }
}

// ==========================================================================
// 4. UI 렌더링 함수
// ==========================================================================

function showLoading() {
  loadingEl.classList.remove('hidden');
  weatherContent.classList.add('hidden');
  errorBanner.classList.add('hidden');
}

function hideLoading() {
  loadingEl.classList.add('hidden');
}

function showError(msg) {
  hideLoading();
  errorText.textContent = msg;
  errorBanner.classList.remove('hidden');
}

// ==========================================================================
// 4-1. 도시별 실시간 현지 시계 로직 (1초 단위 자동 갱신)
// ==========================================================================
let localClockInterval = null;

function updateLocalClock(timeZone) {
  if (!timeZone) return;
  const now = new Date();

  try {
    // 1. 시간 포맷 (오전/오후 HH:MM:SS)
    const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    if (currentTimeEl) {
      currentTimeEl.textContent = timeFormatter.format(now);
    }

    // 2. 날짜 포맷 (YYYY년 M월 D일 (요일))
    const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
    if (localDateEl) {
      localDateEl.textContent = dateFormatter.format(now);
    }

    // 3. 타임존 표시 (예: Asia/Seoul, America/New_York)
    if (localTimezoneEl) {
      localTimezoneEl.textContent = timeZone;
    }
  } catch (err) {
    console.warn('타임존 포맷 에러:', err);
  }
}

function startCityClock(timeZone) {
  if (localClockInterval) {
    clearInterval(localClockInterval);
  }
  updateLocalClock(timeZone);
  localClockInterval = setInterval(() => {
    updateLocalClock(timeZone);
  }, 1000);
}

// ==========================================================================
// 4-2. 미세먼지 및 항공편 결항 분석 렌더링 함수
// ==========================================================================

function evaluateAirQuality(pm10, pm25) {
  // PM10 기준 (0~30 좋음, 31~80 보통, 81~150 나쁨, 151+ 매우나쁨)
  let pm10Grade = { text: '좋음', class: 'grade-good', bg: 'bg-good', badge: 'badge-good' };
  if (pm10 > 150) {
    pm10Grade = { text: '매우 나쁨', class: 'grade-very-unhealthy', bg: 'bg-very-unhealthy', badge: 'badge-very-unhealthy' };
  } else if (pm10 > 80) {
    pm10Grade = { text: '나쁨', class: 'grade-unhealthy', bg: 'bg-unhealthy', badge: 'badge-unhealthy' };
  } else if (pm10 > 30) {
    pm10Grade = { text: '보통', class: 'grade-moderate', bg: 'bg-moderate', badge: 'badge-moderate' };
  }

  // PM2.5 기준 (0~15 좋음, 16~35 보통, 36~75 나쁨, 76+ 매우나쁨)
  let pm25Grade = { text: '좋음', class: 'grade-good', bg: 'bg-good', badge: 'badge-good' };
  if (pm25 > 75) {
    pm25Grade = { text: '매우 나쁨', class: 'grade-very-unhealthy', bg: 'bg-very-unhealthy', badge: 'badge-very-unhealthy' };
  } else if (pm25 > 35) {
    pm25Grade = { text: '나쁨', class: 'grade-unhealthy', bg: 'bg-unhealthy', badge: 'badge-unhealthy' };
  } else if (pm25 > 15) {
    pm25Grade = { text: '보통', class: 'grade-moderate', bg: 'bg-moderate', badge: 'badge-moderate' };
  }

  // 둘 중 더 나쁜 상태를 종합 배지로 설정
  const rank = { '좋음': 1, '보통': 2, '나쁨': 3, '매우 나쁨': 4 };
  const overall = rank[pm10Grade.text] >= rank[pm25Grade.text] ? pm10Grade : pm25Grade;

  return { pm10Grade, pm25Grade, overall };
}

function renderAirQuality(airData) {
  if (!airData || !airData.current) {
    if (airOverallBadge) airOverallBadge.textContent = '정보 없음';
    return;
  }

  const pm10 = Math.round(airData.current.pm10 || 0);
  const pm25 = Math.round(airData.current.pm2_5 || 0);

  const { pm10Grade, pm25Grade, overall } = evaluateAirQuality(pm10, pm25);

  if (pm10ValEl) pm10ValEl.textContent = pm10;
  if (pm10StatusEl) {
    pm10StatusEl.textContent = pm10Grade.text;
    pm10StatusEl.className = `air-grade ${pm10Grade.class}`;
  }

  if (pm25ValEl) pm25ValEl.textContent = pm25;
  if (pm25StatusEl) {
    pm25StatusEl.textContent = pm25Grade.text;
    pm25StatusEl.className = `air-grade ${pm25Grade.class}`;
  }

  // 프로그레스 바 갱신
  if (pm10BarEl) {
    const pm10Percent = Math.min(100, Math.round((pm10 / 150) * 100));
    pm10BarEl.style.width = `${Math.max(6, pm10Percent)}%`;
    pm10BarEl.className = `air-bar-fill ${pm10Grade.bg}`;
  }

  if (pm25BarEl) {
    const pm25Percent = Math.min(100, Math.round((pm25 / 75) * 100));
    pm25BarEl.style.width = `${Math.max(6, pm25Percent)}%`;
    pm25BarEl.className = `air-bar-fill ${pm25Grade.bg}`;
  }

  // 종합 배지 갱신
  if (airOverallBadge) {
    airOverallBadge.textContent = overall.text;
    airOverallBadge.className = `air-badge ${overall.badge}`;
  }
}

function renderFlightStatus(cityName, countryName, weatherData) {
  if (!flightAlertSection) return;

  // 한국인지 여부 검사 (한국 지역 검색 시 해외 결항 섹션 숨김)
  const isKorea = countryName.includes('대한민국') || countryName.includes('한국') || countryName.includes('Korea') || countryName.includes('KR');
  if (isKorea) {
    flightAlertSection.classList.add('hidden');
    return;
  }

  // 해외 도시인 경우 섹션 노출!
  flightAlertSection.classList.remove('hidden');

  // 해당 도시 공항 정보 매핑
  let airport = null;
  for (const [key, val] of Object.entries(GLOBAL_AIRPORT_MAP)) {
    if (cityName.includes(key) || key.includes(cityName)) {
      airport = val;
      break;
    }
  }
  if (!airport) {
    airport = {
      name: `${cityName} 국제공항 (International Airport)`,
      iata: cityName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'APT'
    };
  }

  if (flightAirportInfo) flightAirportInfo.textContent = airport.name;
  if (flightTrackerLink) {
    const cleanIata = airport.iata.split(' ')[0];
    flightTrackerLink.href = `https://www.flightradar24.com/airport/${cleanIata}`;
  }

  const current = weatherData.current;
  const weatherCode = current.weather_code;
  const windSpeed = current.wind_speed_10m;
  const precip = current.precipitation;

  // 기상에 따른 항공기 결항/지연 위험도 평가
  let riskLevel = 'normal'; // 'normal' | 'warning' | 'danger'
  let riskPercent = 5;
  let reason = '현재 공항 및 주변 상공의 기상이 안정적이어서 결항 위험이 매우 낮으며 정상 운항 중입니다.';
  let weatherFactorText = `풍속 ${windSpeed}km/h · 시정 양호`;
  let routeStatusText = '인천(ICN) 노선 정상 운항';

  // 1. 심각한 기상 조건 (폭설, 뇌우, 우박, 태풍급 돌풍) -> 결항 경보
  if ([95, 96, 99].includes(weatherCode)) {
    riskLevel = 'danger';
    riskPercent = 88;
    reason = '⚠️ 현지 뇌우 및 낙뢰로 인해 항공기 이착륙이 전면 중단/제한되어 다수의 결항 및 심각한 지연이 발생하고 있습니다.';
    weatherFactorText = '뇌우/낙뢰 특보 (위험)';
    routeStatusText = '다수 결항 및 지연 발생';
  } else if ([75, 86].includes(weatherCode)) {
    riskLevel = 'danger';
    riskPercent = 92;
    reason = '⚠️ 활주로 폭설 및 결빙으로 인해 항공편 결항 사태 및 활주로 제설 작업으로 장시간 폐쇄될 우려가 있습니다.';
    weatherFactorText = '대설/활주로 결빙 경보';
    routeStatusText = '결항 경보 발령 (출발 지연)';
  } else if (windSpeed >= 50) {
    riskLevel = 'danger';
    riskPercent = 78;
    reason = `⚠️ 급변풍(윈드시어) 및 순간 최대 강풍(${windSpeed}km/h)으로 인해 착륙 불발 및 회항·결항이 발생하고 있습니다.`;
    weatherFactorText = `태풍급 강풍 (${windSpeed}km/h)`;
    routeStatusText = '회항 및 결항 주의';
  } 
  // 2. 주의 수준 (짙은 안개, 강한 비, 보통 눈, 어는 비)
  else if ([45, 48].includes(weatherCode)) {
    riskLevel = 'warning';
    riskPercent = 60;
    reason = '시정 장애(짙은 안개)로 인해 저시정 운항 절차가 가동되어 출도착 지연 및 일부 편의 결항이 우려됩니다.';
    weatherFactorText = '저시정 안개 (주의)';
    routeStatusText = '순차적 출도착 지연';
  } else if ([65, 82].includes(weatherCode)) {
    riskLevel = 'warning';
    riskPercent = 45;
    reason = `집중 호우(시간당 강수량 ${precip}mm)로 인해 활주로 배수 및 지상 조업 지연으로 일부 편 차질이 우려됩니다.`;
    weatherFactorText = `호우 (${precip}mm)`;
    routeStatusText = '일부 편 지연 운항';
  } else if ([71, 73, 85].includes(weatherCode)) {
    riskLevel = 'warning';
    riskPercent = 52;
    reason = '강설로 인한 항공기 디아이싱(제빙·방빙) 작업 진행으로 평균 30분~1시간 내외의 출발 지연이 예상됩니다.';
    weatherFactorText = '강설 및 제빙 작업';
    routeStatusText = '30~60분 지연 운항 예상';
  } else if (windSpeed >= 35) {
    riskLevel = 'warning';
    riskPercent = 38;
    reason = `다소 강한 측풍(${windSpeed}km/h)으로 인해 항공기 진입 간격이 조정되어 일부 지연이 발생할 수 있습니다.`;
    weatherFactorText = `강풍 주의 (${windSpeed}km/h)`;
    routeStatusText = '대체로 정상 / 일부 지연';
  }

  // UI 적용
  if (flightDisruptionIndex) {
    flightDisruptionIndex.textContent = `${riskPercent}% (${riskLevel === 'danger' ? '위험' : riskLevel === 'warning' ? '주의' : '낮음'})`;
  }
  if (flightWeatherFactor) flightWeatherFactor.textContent = weatherFactorText;
  if (flightRouteStatus) flightRouteStatus.textContent = routeStatusText;
  if (flightAlertDesc) flightAlertDesc.textContent = reason;

  if (riskLevel === 'danger') {
    if (flightRiskBadge) {
      flightRiskBadge.className = 'flight-badge badge-danger';
      flightRiskText.textContent = '결항 경보';
    }
    if (flightAlertBanner) flightAlertBanner.className = 'flight-alert-banner banner-danger';
    if (flightDisruptionIndex) flightDisruptionIndex.className = 'stat-value text-red';
    if (flightRouteStatus) flightRouteStatus.className = 'stat-value text-red';
  } else if (riskLevel === 'warning') {
    if (flightRiskBadge) {
      flightRiskBadge.className = 'flight-badge badge-warning';
      flightRiskText.textContent = '지연/결항 주의';
    }
    if (flightAlertBanner) flightAlertBanner.className = 'flight-alert-banner banner-warning';
    if (flightDisruptionIndex) flightDisruptionIndex.className = 'stat-value text-yellow';
    if (flightRouteStatus) flightRouteStatus.className = 'stat-value text-yellow';
  } else {
    if (flightRiskBadge) {
      flightRiskBadge.className = 'flight-badge badge-normal';
      flightRiskText.textContent = '정상 운항';
    }
    if (flightAlertBanner) flightAlertBanner.className = 'flight-alert-banner banner-normal';
    if (flightDisruptionIndex) flightDisruptionIndex.className = 'stat-value text-green';
    if (flightRouteStatus) flightRouteStatus.className = 'stat-value text-green';
  }
}

function renderWeather(locationName, countryName, data, airData = null) {
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;
  const timeZone = data.timezone || 'Asia/Seoul';

  const weatherInfo = getWeatherInfo(current.weather_code, current.is_day);

  // 1. 테마 적용
  document.body.className = weatherInfo.theme;
  if (window.weatherEngine) {
    window.weatherEngine.setTheme(weatherInfo.theme);
  }

  // 2. 헤더 및 지역 정보 & 구글 맵 연동
  cityNameEl.textContent = locationName;
  countryNameEl.textContent = countryName || '대한민국';
  if (mapLinkBtn && data.latitude !== undefined && data.longitude !== undefined) {
    mapLinkBtn.href = `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`;
    mapLinkBtn.title = `구글 맵에서 '${locationName}' 위치 열기 (위도: ${data.latitude.toFixed(2)}, 경도: ${data.longitude.toFixed(2)})`;
  }
  
  // 3. 해당 나라/도시의 실시간 현지 시계 시작 (초 단위 갱신)
  startCityClock(timeZone);

  // 3. 메인 기온 및 날씨 정보
  currentTempEl.textContent = Math.round(current.temperature_2m);
  weatherDescEl.textContent = weatherInfo.label;

  // 아이콘 갱신
  weatherIconWrapper.innerHTML = `<i data-lucide="${weatherInfo.icon}" class="main-weather-icon"></i>`;

  // 최저/최고 (오늘 기준)
  if (daily && daily.temperature_2m_min && daily.temperature_2m_max) {
    tempMinEl.textContent = `${Math.round(daily.temperature_2m_min[0])}°`;
    tempMaxEl.textContent = `${Math.round(daily.temperature_2m_max[0])}°`;
  }

  // 4. 상세 그리드
  apparentTempEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidityEl.textContent = `${current.relative_humidity_2m}%`;
  windSpeedEl.textContent = `${current.wind_speed_10m} km/h`;
  precipitationEl.textContent = `${current.precipitation} mm`;

  // 5. 24시간 시간별 예보 렌더링
  renderHourlyForecast(hourly, current.time);

  // 6. 주간 7일 예보 렌더링
  renderDailyForecast(daily);

  // 7. 대기질 및 미세먼지 정보 렌더링
  renderAirQuality(airData);

  // 8. 해외 국가일 경우 항공기 결항 & 운항 모니터링 렌더링
  renderFlightStatus(locationName, countryName, data);

  // Lucide 아이콘 활성화
  if (window.lucide) {
    lucide.createIcons();
  }

  hideLoading();
  weatherContent.classList.remove('hidden');
}

function renderHourlyForecast(hourly, currentTimeStr) {
  if (!hourly || !hourly.time) return;
  hourlyForecastList.innerHTML = '';

  const currentIdx = hourly.time.findIndex(t => t >= currentTimeStr);
  const startIdx = currentIdx >= 0 ? currentIdx : 0;
  // 향후 24개 시간대 표시
  const next24Hours = hourly.time.slice(startIdx, startIdx + 24);

  next24Hours.forEach((timeStr, idx) => {
    const originalIdx = startIdx + idx;
    const temp = Math.round(hourly.temperature_2m[originalIdx]);
    const code = hourly.weather_code[originalIdx];
    const isDay = hourly.is_day[originalIdx];
    const rainProb = hourly.precipitation_probability ? hourly.precipitation_probability[originalIdx] : 0;
    const info = getWeatherInfo(code, isDay);

    const timeDate = new Date(timeStr);
    const hourFormatted = idx === 0 ? '지금' : `${timeDate.getHours()}시`;

    const card = document.createElement('div');
    card.className = `hourly-card ${idx === 0 ? 'active-now' : ''}`;
    card.innerHTML = `
      <span class="hourly-time">${hourFormatted}</span>
      <i data-lucide="${info.icon}"></i>
      <span class="hourly-temp">${temp}°</span>
      ${rainProb > 0 ? `<span class="hourly-rain"><i data-lucide="droplet" style="width:11px;height:11px;"></i>${rainProb}%</span>` : ''}
    `;
    hourlyForecastList.appendChild(card);
  });
}

// ==========================================================================
// 4-3. 토스트 알림 메시지 함수
// ==========================================================================
let toastTimer = null;
function showWeatherToast(message) {
  const toast = document.getElementById('weather-toast');
  if (!toast) return;

  clearTimeout(toastTimer);
  toast.innerHTML = `<i data-lucide="sparkles" style="width:18px;height:18px;color:var(--accent-color);"></i><span>${message}</span>`;
  if (window.lucide) lucide.createIcons();

  toast.classList.add('show');
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function renderDailyForecast(daily) {
  if (!daily || !daily.time) return;
  dailyForecastList.innerHTML = '';

  daily.time.forEach((dateStr, idx) => {
    const dayName = idx === 0 ? '오늘' : idx === 1 ? '내일' : getDayName(dateStr);
    const formattedDate = formatDate(dateStr);
    const code = daily.weather_code[idx];
    const info = getWeatherInfo(code, 1);
    const minTemp = Math.round(daily.temperature_2m_min[idx]);
    const maxTemp = Math.round(daily.temperature_2m_max[idx]);

    const row = document.createElement('div');
    row.className = `daily-row ${idx === 0 ? 'selected-day' : ''}`;
    row.setAttribute('title', `${dayName} 날씨(${info.label}) 배경으로 보기`);
    row.innerHTML = `
      <div class="daily-day-info">
        <span class="daily-day-name">${dayName}</span>
        <span class="daily-date">${formattedDate}</span>
      </div>
      <div class="daily-icon-col">
        <i data-lucide="${info.icon}"></i>
      </div>
      <div class="daily-desc">${info.label}</div>
      <div class="daily-temp-bar-wrapper">
        <span class="daily-temp-min">${minTemp}°</span>
        <span>/</span>
        <span class="daily-temp-max">${maxTemp}°</span>
      </div>
    `;

    // 클릭 시 해당 날짜의 날씨로 뒷 배경 및 캔버스 애니메이션 전환!
    row.addEventListener('click', () => {
      document.querySelectorAll('.daily-row').forEach(r => r.classList.remove('selected-day'));
      row.classList.add('selected-day');

      // 배경 및 파티클 엔진 테마 전환
      document.body.className = info.theme;
      if (window.weatherEngine) {
        window.weatherEngine.setTheme(info.theme);
      }

      // 안내 토스트 노출
      showWeatherToast(`${dayName}(${formattedDate}) '${info.label}' 날씨 배경으로 전환되었습니다.`);
    });

    dailyForecastList.appendChild(row);
  });
}

// ==========================================================================
// 5. 비즈니스 로직 및 이벤트 핸들러
// ==========================================================================

async function loadWeatherForCity(cityName) {
  showLoading();
  try {
    const results = await searchLocation(cityName);
    if (!results || results.length === 0) {
      showError(`'${cityName}'에 대한 검색 결과를 찾을 수 없습니다. 철자를 확인해주세요.`);
      return;
    }

    const first = results[0];
    const [data, airData] = await Promise.all([
      fetchWeatherData(first.latitude, first.longitude),
      fetchAirQuality(first.latitude, first.longitude)
    ]);

    const displayName = first.name;
    const country = first.isPreset ? first.country : [first.admin1, first.country].filter(Boolean).join(', ');

    renderWeather(displayName, country, data, airData);
  } catch (err) {
    console.error(err);
    showError(err.message || '날씨 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

async function loadWeatherForCoordinates(lat, lon, fallbackName = '현재 위치') {
  showLoading();
  try {
    const [weatherData, locationData, airData] = await Promise.all([
      fetchWeatherData(lat, lon),
      reverseGeocode(lat, lon),
      fetchAirQuality(lat, lon)
    ]);

    const cityName = locationData?.city || fallbackName;
    const countryName = locationData?.country || '내 위치';

    renderWeather(cityName, countryName, weatherData, airData);
  } catch (err) {
    console.error(err);
    showError('현재 위치의 날씨 정보를 가져오지 못했습니다.');
  }
}

// 검색 폼 제출
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = cityInput.value.trim();
  if (!query) return;
  suggestionsBox.classList.add('hidden');
  loadWeatherForCity(query);
});

// 내 위치 버튼 클릭
geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('이 브라우저는 위치 정보(Geolocation)를 지원하지 않습니다.');
    return;
  }

  showLoading();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      loadWeatherForCoordinates(latitude, longitude, '현재 위치');
    },
    (error) => {
      let msg = '위치 접근 권한이 거부되었거나 위치를 가져올 수 없습니다.';
      if (error.code === error.PERMISSION_DENIED) {
        msg = '브라우저 위치 접근 권한이 차단되었습니다. 기본 위치(서울) 날씨를 표시합니다.';
      }
      showError(msg);
      loadWeatherForCity('서울');
    },
    { timeout: 10000 }
  );
});

// 퀵 추천 도시 칩 클릭
quickChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const city = chip.getAttribute('data-city');
    cityInput.value = city;
    loadWeatherForCity(city);
  });
});

// 검색어 입력 시 자동완성 디바운스
let debounceTimer = null;
cityInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  clearTimeout(debounceTimer);

  if (!query || query.length < 2) {
    suggestionsBox.classList.add('hidden');
    suggestionsBox.innerHTML = '';
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const results = await searchLocation(query);
      if (results && results.length > 0) {
        suggestionsBox.innerHTML = '';
        results.slice(0, 5).forEach((place) => {
          const item = document.createElement('button');
          item.className = 'suggestion-item';
          const subInfo = [place.admin1, place.country].filter(Boolean).join(', ');
          item.innerHTML = `
            <span><strong>${place.name}</strong></span>
            <span class="country">${subInfo}</span>
          `;
          item.addEventListener('click', async () => {
            cityInput.value = place.name;
            suggestionsBox.classList.add('hidden');
            showLoading();
            try {
              const [data, airData] = await Promise.all([
                fetchWeatherData(place.latitude, place.longitude),
                fetchAirQuality(place.latitude, place.longitude)
              ]);
              const subCountry = place.isPreset ? place.country : [place.admin1, place.country].filter(Boolean).join(', ');
              renderWeather(place.name, subCountry, data, airData);
            } catch (err) {
              showError('날씨 정보를 불러오는 중 오류가 발생했습니다.');
            }
          });
          suggestionsBox.appendChild(item);
        });
        suggestionsBox.classList.remove('hidden');
      } else {
        suggestionsBox.classList.add('hidden');
      }
    } catch {
      suggestionsBox.classList.add('hidden');
    }
  }, 350);
});

// 문서 외부 클릭 시 자동완성창 닫기
document.addEventListener('click', (e) => {
  if (!searchForm.contains(e.target) && !suggestionsBox.contains(e.target)) {
    suggestionsBox.classList.add('hidden');
  }
});

// ==========================================================================
// 7. 실시간 움직이는 날씨 배경 캔버스 엔진 (Live Weather Effects)
// ==========================================================================
class WeatherEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.theme = 'theme-default';
    this.particles = [];
    this.lightningTimer = null;
    this.activeLightning = null;
    this.flashEl = document.getElementById('lightning-flash');

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  setTheme(newTheme) {
    if (this.theme === newTheme) return;
    this.theme = newTheme;
    this.initParticles();

    // 번개 타이머 관리
    if (this.lightningTimer) {
      clearInterval(this.lightningTimer);
      this.lightningTimer = null;
    }
    if (this.theme === 'theme-thunder') {
      this.startLightningLoop();
    }
  }

  initParticles() {
    this.particles = [];
    const count = this.width < 768 ? 60 : 120;

    if (this.theme === 'theme-clear-day') {
      // 맑은 낮: 따뜻한 햇살 부유 파티클
      for (let i = 0; i < 40; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 3 + 1,
          speedY: -(Math.random() * 0.4 + 0.1),
          speedX: Math.random() * 0.3 - 0.15,
          alpha: Math.random() * 0.5 + 0.2,
          glow: Math.random() * 8 + 4
        });
      }
    } else if (this.theme === 'theme-clear-night') {
      // 맑은 밤: 반짝이는 별 + 유성
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 1.8 + 0.5,
          alpha: Math.random() * 0.8 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.005,
          phase: Math.random() * Math.PI * 2
        });
      }
      this.shootingStar = null;
      this.shootingStarCooldown = 120;
    } else if (this.theme === 'theme-rain' || this.theme === 'theme-thunder') {
      // 비/뇌우: 빠른 사선 빗줄기
      const rainCount = this.theme === 'theme-thunder' ? count * 1.5 : count;
      for (let i = 0; i < rainCount; i++) {
        this.particles.push({
          x: Math.random() * (this.width + 200) - 100,
          y: Math.random() * this.height,
          length: Math.random() * 22 + 14,
          speedY: Math.random() * 14 + 16,
          speedX: -2.5,
          alpha: Math.random() * 0.35 + 0.2,
          thickness: Math.random() * 1.2 + 0.6
        });
      }
    } else if (this.theme === 'theme-snow') {
      // 눈: 입체적이고 살랑거리는 눈송이
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 3.5 + 1.2,
          speedY: Math.random() * 1.2 + 0.6,
          swingAmplitude: Math.random() * 1.5 + 0.5,
          swingSpeed: Math.random() * 0.02 + 0.01,
          angle: Math.random() * Math.PI * 2,
          alpha: Math.random() * 0.6 + 0.3
        });
      }
    } else if (this.theme === 'theme-clouds') {
      // 흐림/구름: 부드럽게 흐르는 안개 파티클
      for (let i = 0; i < 25; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height * 0.65,
          radius: Math.random() * 120 + 80,
          speedX: Math.random() * 0.4 + 0.15,
          alpha: Math.random() * 0.08 + 0.03
        });
      }
    }
  }

  startLightningLoop() {
    const trigger = () => {
      if (this.theme !== 'theme-thunder') return;
      if (this.flashEl) {
        this.flashEl.classList.remove('strike');
        void this.flashEl.offsetWidth; // 트리거 리셋
        this.flashEl.classList.add('strike');
      }

      // 화면에 지그재그 번개 가지 생성
      this.generateLightningBolt();

      // 다음 번개 주기 (3초 ~ 7초 사이 랜덤)
      const nextInterval = Math.random() * 4000 + 3000;
      this.lightningTimer = setTimeout(trigger, nextInterval);
    };

    this.lightningTimer = setTimeout(trigger, 2000);
  }

  generateLightningBolt() {
    const startX = Math.random() * (this.width * 0.7) + this.width * 0.15;
    const startY = 0;
    const segments = [];
    let curX = startX;
    let curY = startY;

    while (curY < this.height * 0.75) {
      const nextX = curX + (Math.random() - 0.5) * 45;
      const nextY = curY + Math.random() * 30 + 15;
      segments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });
      curX = nextX;
      curY = nextY;
    }

    this.activeLightning = {
      segments,
      alpha: 1.0,
      life: 14
    };
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.theme === 'theme-clear-day') {
      this.renderClearDay();
    } else if (this.theme === 'theme-clear-night') {
      this.renderClearNight();
    } else if (this.theme === 'theme-rain' || this.theme === 'theme-thunder') {
      this.renderRain();
      if (this.theme === 'theme-thunder') {
        this.renderLightning();
      }
    } else if (this.theme === 'theme-snow') {
      this.renderSnow();
    } else if (this.theme === 'theme-clouds') {
      this.renderClouds();
    }

    requestAnimationFrame(this.animate);
  }

  renderClearDay() {
    // 부드러운 회전 햇살 광선 렌즈 플레어
    const time = Date.now() * 0.0005;
    const sunX = this.width * 0.85;
    const sunY = this.height * 0.15;

    const gradient = this.ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 350);
    gradient.addColorStop(0, 'rgba(253, 224, 71, 0.35)');
    gradient.addColorStop(0.4, 'rgba(251, 191, 36, 0.12)');
    gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, 350, 0, Math.PI * 2);
    this.ctx.fill();

    // 부유 입자
    this.particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y < -10) p.y = this.height + 10;
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(254, 240, 138, ${p.alpha})`;
      this.ctx.shadowColor = 'rgba(253, 224, 71, 0.8)';
      this.ctx.shadowBlur = p.glow;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }

  renderClearNight() {
    // 별빛 반짝임
    this.particles.forEach(p => {
      p.phase += p.pulseSpeed;
      const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
      this.ctx.fill();
    });

    // 가끔 떨어지는 유성 (Shooting Star)
    if (!this.shootingStar) {
      this.shootingStarCooldown--;
      if (this.shootingStarCooldown <= 0 && Math.random() < 0.02) {
        this.shootingStar = {
          x: Math.random() * (this.width * 0.7),
          y: Math.random() * (this.height * 0.3),
          len: Math.random() * 80 + 70,
          speed: Math.random() * 10 + 12,
          life: 0,
          maxLife: 35
        };
        this.shootingStarCooldown = 180 + Math.random() * 120;
      }
    } else {
      const s = this.shootingStar;
      s.x += s.speed;
      s.y += s.speed * 0.6;
      s.life++;

      const grad = this.ctx.createLinearGradient(s.x, s.y, s.x - s.len, s.y - s.len * 0.6);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.beginPath();
      this.ctx.moveTo(s.x, s.y);
      this.ctx.lineTo(s.x - s.len, s.y - s.len * 0.6);
      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      if (s.life >= s.maxLife || s.x > this.width || s.y > this.height) {
        this.shootingStar = null;
      }
    }
  }

  renderRain() {
    this.ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
    this.particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y > this.height) {
        p.y = -p.length;
        p.x = Math.random() * (this.width + 200) - 100;
      }

      this.ctx.lineWidth = p.thickness;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x + p.speedX * 2, p.y + p.length);
      this.ctx.stroke();
    });
  }

  renderLightning() {
    if (!this.activeLightning) return;
    const l = this.activeLightning;
    l.life--;

    this.ctx.strokeStyle = `rgba(255, 255, 255, ${l.alpha})`;
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowColor = '#60a5fa';
    this.ctx.shadowBlur = 15;

    l.segments.forEach(seg => {
      this.ctx.beginPath();
      this.ctx.moveTo(seg.x1, seg.y1);
      this.ctx.lineTo(seg.x2, seg.y2);
      this.ctx.stroke();
    });

    this.ctx.shadowBlur = 0;

    if (l.life <= 0) {
      this.activeLightning = null;
    }
  }

  renderSnow() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.particles.forEach(p => {
      p.angle += p.swingSpeed;
      p.x += Math.sin(p.angle) * p.swingAmplitude;
      p.y += p.speedY;

      if (p.y > this.height + 10) {
        p.y = -10;
        p.x = Math.random() * this.width;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      this.ctx.fill();
    });
  }

  renderClouds() {
    this.particles.forEach(p => {
      p.x += p.speedX;
      if (p.x - p.radius > this.width) {
        p.x = -p.radius;
        p.y = Math.random() * this.height * 0.65;
      }

      const grad = this.ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, p.radius);
      grad.addColorStop(0, `rgba(226, 232, 240, ${p.alpha})`);
      grad.addColorStop(1, 'rgba(226, 232, 240, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}

// ==========================================================================
// 6. 초기 실행
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 실시간 움직이는 날씨 효과 엔진 가동
  window.weatherEngine = new WeatherEngine('weather-canvas');

  // Lucide 아이콘 최초 렌더링
  if (window.lucide) {
    lucide.createIcons();
  }

  // 첫 진입 시 브라우저 위치 권한을 확인하고 없으면 서울 날씨 기본 로딩
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadWeatherForCoordinates(position.coords.latitude, position.coords.longitude, '현재 위치');
      },
      () => {
        // 위치 허용을 안 했거나 오류 시 기본 '서울' 날씨
        loadWeatherForCity('서울');
      },
      { timeout: 4000 }
    );
  } else {
    loadWeatherForCity('서울');
  }
});
