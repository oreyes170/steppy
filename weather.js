// Live weather from Open-Meteo (free, no account or API key, works from the browser).
// The pure parts (describe, walkingTip) are unit tested; fetchWeather is the only network call.

export const PLACES = {
  nyc: { name: 'New York', lat: 40.71, lon: -74.01 },
  nh: { name: 'North Conway', lat: 44.05, lon: -71.13 }, // North Conway, NH
};

/** WMO weather codes → emoji + words. */
export function describe(code, isDay = true) {
  const c = Number(code);
  if (c === 0) return isDay ? ['☀️', 'Sunny'] : ['🌙', 'Clear'];
  if (c === 1) return isDay ? ['🌤️', 'Mostly sunny'] : ['🌙', 'Mostly clear'];
  if (c === 2) return ['⛅', 'Partly cloudy'];
  if (c === 3) return ['☁️', 'Cloudy'];
  if (c === 45 || c === 48) return ['🌫️', 'Foggy'];
  if (c >= 51 && c <= 57) return ['🌦️', 'Drizzle'];
  if (c >= 61 && c <= 67) return ['🌧️', c >= 65 ? 'Heavy rain' : 'Rain'];
  if (c >= 71 && c <= 77) return ['🌨️', c >= 75 ? 'Heavy snow' : 'Snow'];
  if (c >= 80 && c <= 82) return ['🌧️', 'Showers'];
  if (c === 85 || c === 86) return ['🌨️', 'Snow showers'];
  if (c >= 95) return ['⛈️', 'Thunderstorms'];
  return ['🌡️', 'Weather'];
}

const isWet = (code) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
const isSnow = (code) => (code >= 71 && code <= 77) || code === 85 || code === 86;

function hourLabel(iso) {
  const h = Number(iso.slice(11, 13));
  if (h === 0) return 'midnight';
  if (h === 12) return 'noon';
  return `${h % 12} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * A short walking tip from an Open-Meteo forecast, or '' when there's nothing worth saying.
 * Looks from now until the end of today (in the forecast location's own time).
 */
export function walkingTip(data) {
  const cur = data?.current;
  if (!cur) return '';
  const code = Number(cur.weather_code);
  if (isWet(code)) return '☔ It’s wet out. Laps around the house count too!';
  if (isSnow(code)) return '❄️ Snowy! Bundle up, or get your steps in indoors.';
  const now = String(cur.time).slice(0, 13); // "2026-11-02T14"
  const today = now.slice(0, 10);
  const times = data.hourly?.time || [];
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (t.slice(0, 13) <= now || t.slice(0, 10) !== today) continue;
    const c = Number(data.hourly.weather_code?.[i]);
    const p = Number(data.hourly.precipitation_probability?.[i] ?? 0);
    if (p >= 50 && (isWet(c) || isSnow(c) || c === 3)) {
      return `${isSnow(c) ? '🌨️ Snow' : '🌧️ Rain'} likely around ${hourLabel(t)}. Walk before then!`;
    }
  }
  const temp = Number(cur.temperature_2m);
  if (temp >= 88) return '🥵 Hot one! Walk early or late, and bring water.';
  if (temp <= 25) return '🧣 Brr! Bundle up for your walk.';
  if (temp >= 55 && temp <= 78 && code <= 2) return '😎 Great walking weather!';
  return '';
}

export function weatherUrl(lat, lon) {
  const q = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,weather_code,is_day',
    hourly: 'precipitation_probability,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
    forecast_days: '1',
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

export async function fetchWeather(lat, lon) {
  const res = await fetch(weatherUrl(lat, lon));
  if (!res.ok) throw new Error('Weather unavailable');
  return res.json();
}
