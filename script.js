"use strict";

/* =========================================================
   API CONFIGURATION
========================================================= */

const WEATHER_API =
  "https://api.open-meteo.com/v1/forecast";

const AIR_QUALITY_API =
  "https://air-quality-api.open-meteo.com/v1/air-quality";

const GEOCODING_API =
  "https://geocoding-api.open-meteo.com/v1/search";

const REVERSE_GEOCODING_API =
  "https://geocoding-api.open-meteo.com/v1/reverse";


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {

  city: "Patna",

  location: null,

  weather: null,

  airQuality: null,

  unit:
    localStorage.getItem("weatherUnit")
    || "celsius",

  theme:
    localStorage.getItem("weatherTheme")
    || "light",

  chart: null,

  lastWeatherResponse: null,

  lastAirResponse: null,

  requestMeta: {

    status: null,

    duration: null,

    endpoint: WEATHER_API,

    calledAt: null

  },

  jsonMode: "formatted"

};


/* =========================================================
   HELPER
========================================================= */

const $ = (id) =>
  document.getElementById(id);


/* =========================================================
   WEATHER CODE MAP
========================================================= */

const weatherCodes = {

  0: ["Clear sky", "☀️"],

  1: ["Mainly clear", "🌤️"],

  2: ["Partly cloudy", "⛅"],

  3: ["Overcast", "☁️"],

  45: ["Fog", "🌫️"],

  48: ["Rime fog", "🌫️"],

  51: ["Light drizzle", "🌦️"],

  53: ["Drizzle", "🌦️"],

  55: ["Heavy drizzle", "🌧️"],

  56: ["Freezing drizzle", "🌧️"],

  57: ["Heavy freezing drizzle", "🌧️"],

  61: ["Light rain", "🌦️"],

  63: ["Rain", "🌧️"],

  65: ["Heavy rain", "🌧️"],

  66: ["Freezing rain", "🌧️"],

  67: ["Heavy freezing rain", "🌧️"],

  71: ["Light snow", "🌨️"],

  73: ["Snow", "❄️"],

  75: ["Heavy snow", "❄️"],

  77: ["Snow grains", "🌨️"],

  80: ["Rain showers", "🌦️"],

  81: ["Rain showers", "🌧️"],

  82: ["Heavy showers", "⛈️"],

  85: ["Snow showers", "🌨️"],

  86: ["Heavy snow showers", "❄️"],

  95: ["Thunderstorm", "⛈️"],

  96: ["Thunderstorm with hail", "⛈️"],

  99: ["Heavy thunderstorm", "⛈️"]

};


function getWeatherInfo(code) {

  return (
    weatherCodes[code]
    || ["Unknown", "🌡️"]
  );

}


/* =========================================================
   SECURITY HELPER
========================================================= */

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


/* =========================================================
   API STATUS
========================================================= */

function setStatus(kind, label) {

  const topDot =
    document.querySelector(
      "#apiChip .status-dot"
    );

  const sidebarDot =
    $("sidebarStatusDot");

  const dots =
    [topDot, sidebarDot].filter(Boolean);

  dots.forEach((node) => {

    node.classList.remove(
      "warning",
      "danger"
    );

    if (kind === "warning") {

      node.classList.add("warning");

    }

    if (kind === "danger") {

      node.classList.add("danger");

    }

  });

  $("apiChipText").textContent = label;

  $("sidebarStatusText").textContent = label;

}


/* =========================================================
   API LIVE STATUS
========================================================= */

function setApiLiveStatus(
  kind,
  text
) {

  const wrap =
    $("apiLiveStatus");

  const dot =
    wrap.querySelector(
      ".status-dot"
    );

  dot.classList.remove(
    "warning",
    "danger"
  );

  if (kind === "warning") {

    dot.classList.add("warning");

  }

  if (kind === "danger") {

    dot.classList.add("danger");

  }

  const label =
    wrap.querySelector(
      "span:last-child"
    );

  label.textContent = text;

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(
  message =
    "Connecting to weather services..."
) {

  $("loadingText").textContent =
    message;

  $("loadingOverlay")
    .classList
    .remove("hidden");

}


function hideLoading() {

  $("loadingOverlay")
    .classList
    .add("hidden");

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

  $("errorText").textContent =
    message;

  $("errorMessage")
    .classList
    .remove("hidden");

  setStatus(
    "danger",
    "API Error"
  );

  setApiLiveStatus(
    "danger",
    "Request failed"
  );

}


function hideError() {

  $("errorMessage")
    .classList
    .add("hidden");

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;

function showToast(message) {

  const toast =
    $("toast");

  toast.textContent =
    message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2600);

}


/* =========================================================
   DATE / TIME HELPERS
========================================================= */

function formatDate(dateString) {

  if (!dateString) {
    return "--";
  }

  return new Date(
    `${dateString}T12:00:00`
  ).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      month: "long",
      day: "numeric"
    }
  );

}


function formatTime(value) {

  if (!value) {
    return "--:--";
  }

  return new Date(
    value
  ).toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );

}


function formatHour(value) {

  if (!value) {
    return "--";
  }

  return new Date(
    value
  ).toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric"
    }
  );

}


/* =========================================================
   TEMPERATURE / UNIT
========================================================= */

function convertTemperature(
  celsius
) {

  if (
    state.unit === "fahrenheit"
  ) {

    return Math.round(
      (celsius * 9) / 5 + 32
    );

  }

  return Math.round(celsius);

}


function temperatureText(value) {

  return `${convertTemperature(
    value
  )}${getUnitText()}`;

}


function getUnitText() {

  return (
    state.unit === "fahrenheit"
      ? "°F"
      : "°C"
  );

}


function getWindText(value) {

  if (
    state.unit === "fahrenheit"
  ) {

    return `${Math.round(
      value * 0.621371
    )} mph`;

  }

  return `${Math.round(
    value
  )} km/h`;

}


/* =========================================================
   FORECAST INDEX
========================================================= */

function findCurrentHourIndex(
  times
) {

  const now =
    new Date();

  const index =
    times.findIndex(
      (value) =>
        new Date(value) >= now
    );

  return index < 0
    ? 0
    : index;

}


/* =========================================================
   DAYLIGHT
========================================================= */

function calculateDaylightDuration(
  sunriseValue,
  sunsetValue
) {

  if (
    !sunriseValue
    || !sunsetValue
  ) {

    return "--";

  }

  const diff =
    new Date(sunsetValue)
    - new Date(sunriseValue);

  if (!Number.isFinite(diff)) {

    return "--";

  }

  const totalMinutes =
    Math.max(
      0,
      Math.round(
        diff / 60000
      )
    );

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  return `${hours}h ${minutes}m`;

}


/* =========================================================
   SUN POSITION
========================================================= */

function updateSunPosition(
  sunriseValue,
  sunsetValue,
  timezone
) {

  if (
    !sunriseValue
    || !sunsetValue
  ) {

    return;

  }

  const now =
    new Date();

  const sunrise =
    new Date(sunriseValue);

  const sunset =
    new Date(sunsetValue);

  let ratio =
    (
      now - sunrise
    ) /
    (
      sunset - sunrise
    );

  ratio =
    Math.min(
      1,
      Math.max(
        0,
        ratio
      )
    );

  $("sunOrb").style.left =
    `${8 + ratio * 84}%`;

  $("sunProgress").style.width =
    `${ratio * 84}%`;

  if (timezone) {

    $("apiTimezone").textContent =
      timezone;

  }

}


/* =========================================================
   GENERIC FETCH + JSON HANDLING
========================================================= */

async function fetchJson(
  url,
  label,
  onMeta
) {

  const start =
    performance.now();

  setApiLiveStatus(
    "warning",
    `${label} request`
  );

  setStatus(
    "warning",
    "Fetching..."
  );

  const response =
    await fetch(url);

  const duration =
    Math.round(
      performance.now()
      - start
    );

  if (onMeta) {

    onMeta(
      response,
      duration
    );

  }

  if (!response.ok) {

    throw new Error(
      `${label} request failed with HTTP ${response.status}.`
    );

  }

  return response.json();

}


/* =========================================================
   CITY SUGGESTIONS
========================================================= */

async function searchCities(query) {

  const value =
    query.trim();

  if (value.length < 2) {

    $("suggestions")
      .classList
      .add("hidden");

    return;

  }

  try {

    const url =
      new URL(
        GEOCODING_API
      );

    url.searchParams.set(
      "name",
      value
    );

    url.searchParams.set(
      "count",
      "5"
    );

    url.searchParams.set(
      "language",
      "en"
    );

    url.searchParams.set(
      "format",
      "json"
    );

    const data =
      await fetchJson(
        url,
        "Search",
        () => {}
      );

    renderSuggestions(
      data.results || []
    );

  } catch {

    $("suggestions")
      .classList
      .add("hidden");

  }

}


/* =========================================================
   RENDER CITY SUGGESTIONS
========================================================= */

function renderSuggestions(
  results
) {

  const box =
    $("suggestions");

  if (!results.length) {

    box.classList.add(
      "hidden"
    );

    return;

  }

  box.innerHTML =
    results
      .map((place) => {

        const meta = [
          place.admin1,
          place.country
        ]
          .filter(Boolean)
          .join(", ");

        return `
          <button
            type="button"
            class="suggestion-item"
            data-latitude="${place.latitude}"
            data-longitude="${place.longitude}"
            data-name="${escapeHtml(place.name)}"
            data-meta="${escapeHtml(meta)}"
          >
            <i class="fa-solid fa-location-dot"></i>

            <span>
              <span class="suggestion-name">
                ${escapeHtml(place.name)}
              </span>

              <span class="suggestion-meta">
                ${escapeHtml(meta || "Location")}
              </span>
            </span>
          </button>
        `;

      })
      .join("");

  box.classList.remove(
    "hidden"
  );

  box
    .querySelectorAll(
      ".suggestion-item"
    )
    .forEach((item) => {

      item.addEventListener(
        "click",
        () => {

          const name =
            item.dataset.name;

          const meta =
            item.dataset.meta;

          $("cityInput").value =
            "";

          box.classList.add(
            "hidden"
          );

          loadWeatherByCoordinates(

            Number(
              item.dataset.latitude
            ),

            Number(
              item.dataset.longitude
            ),

            [name, meta]
              .filter(Boolean)
              .join(", ")

          );

        }
      );

    });

}


/* =========================================================
   SEARCH CITY
========================================================= */

async function searchCity(
  city
) {

  const url =
    new URL(
      GEOCODING_API
    );

  url.searchParams.set(
    "name",
    city
  );

  url.searchParams.set(
    "count",
    "1"
  );

  url.searchParams.set(
    "language",
    "en"
  );

  url.searchParams.set(
    "format",
    "json"
  );

  const data =
    await fetchJson(
      url,
      "City search",
      () => {}
    );

  if (
    !data.results
    ?.length
  ) {

    throw new Error(
      "City not found. Try another location."
    );

  }

  return data.results[0];

}


/* =========================================================
   WEATHER URL
========================================================= */

function buildWeatherUrl(
  latitude,
  longitude
) {

  const url =
    new URL(
      WEATHER_API
    );

  url.searchParams.set(
    "latitude",
    latitude
  );

  url.searchParams.set(
    "longitude",
    longitude
  );

  url.searchParams.set(

    "current",

    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "surface_pressure"

    ].join(",")

  );

  url.searchParams.set(

    "hourly",

    [
      "temperature_2m",
      "weather_code",
      "precipitation_probability"

    ].join(",")

  );

  url.searchParams.set(

    "daily",

    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset"

    ].join(",")

  );

  url.searchParams.set(
    "temperature_unit",
    "celsius"
  );

  url.searchParams.set(
    "wind_speed_unit",
    "kmh"
  );

  url.searchParams.set(
    "timezone",
    "auto"
  );

  url.searchParams.set(
    "forecast_days",
    "7"
  );

  return url;

}


/* =========================================================
   AIR QUALITY URL
========================================================= */

function buildAirQualityUrl(
  latitude,
  longitude
) {

  const url =
    new URL(
      AIR_QUALITY_API
    );

  url.searchParams.set(
    "latitude",
    latitude
  );

  url.searchParams.set(
    "longitude",
    longitude
  );

  url.searchParams.set(

    "current",

    [
      "us_aqi",
      "pm2_5",
      "pm10",
      "carbon_monoxide",
      "dust"

    ].join(",")

  );

  url.searchParams.set(
    "timezone",
    "auto"
  );

  return url;

}


/* =========================================================
   FETCH WEATHER
========================================================= */

async function fetchWeather(
  latitude,
  longitude
) {

  const url =
    buildWeatherUrl(
      latitude,
      longitude
    );

  let meta;

  const data =
    await fetchJson(

      url,

      "Weather",

      (
        response,
        duration
      ) => {

        meta = {
          response,
          duration,
          url: url.toString()
        };

      }

    );

  state.requestMeta = {

    status:
      meta.response.status,

    duration:
      meta.duration,

    endpoint:
      meta.url,

    calledAt:
      new Date()

  };

  state.lastWeatherResponse =
    data;

  renderApiExplorer(
    data
  );

  return data;

}


/* =========================================================
   FETCH AIR QUALITY
========================================================= */

async function fetchAirQuality(
  latitude,
  longitude
) {

  const url =
    buildAirQualityUrl(
      latitude,
      longitude
    );

  const response =
    await fetch(url);

  if (!response.ok) {

    throw new Error(
      `Air-quality request failed with HTTP ${response.status}.`
    );

  }

  return response.json();

}


/* =========================================================
   REVERSE GEOCODING
========================================================= */

async function reverseGeocode(
  latitude,
  longitude
) {

  try {

    const url =
      new URL(
        REVERSE_GEOCODING_API
      );

    url.searchParams.set(
      "latitude",
      latitude
    );

    url.searchParams.set(
      "longitude",
      longitude
    );

    url.searchParams.set(
      "count",
      "1"
    );

    url.searchParams.set(
      "language",
      "en"
    );

    url.searchParams.set(
      "format",
      "json"
    );

    const response =
      await fetch(url);

    const data =
      await response.json();

    return (
      data.results?.[0]?.name
      || "Current location"
    );

  } catch {

    return "Current location";

  }

}


/* =========================================================
   LOAD WEATHER BY CITY
========================================================= */

async function loadWeatherByCity(
  city
) {

  showLoading(
    "Finding your location..."
  );

  hideError();

  try {

    const location =
      await searchCity(
        city
      );

    await loadWeatherByCoordinates(

      location.latitude,

      location.longitude,

      [
        location.name,
        location.admin1,
        location.country
      ]
        .filter(Boolean)
        .join(", "),

      false

    );

  } catch (error) {

    hideLoading();

    showError(
      error.message
      || "Unable to load weather data."
    );

  }

}


/* =========================================================
   LOAD WEATHER BY COORDINATES
========================================================= */

async function loadWeatherByCoordinates(

  latitude,

  longitude,

  locationName,

  displayLoading = true

) {

  if (displayLoading) {

    showLoading(
      "Fetching live weather data..."
    );

  }

  hideError();

  try {

    const [
      weather,
      airQuality
    ] = await Promise.all([

      fetchWeather(
        latitude,
        longitude
      ),

      fetchAirQuality(
        latitude,
        longitude
      )

    ]);

    state.location = {

      latitude,

      longitude,

      name: locationName

    };

    state.city =
      locationName
        .split(",")[0]
        .trim();

    state.weather =
      weather;

    state.airQuality =
      airQuality;

    state.lastAirResponse =
      airQuality;

    renderAll();

    saveRecentSearch(
      state.city
    );

    hideLoading();

    setStatus(
      "success",
      "API Connected"
    );

    setApiLiveStatus(

      "success",

      `200 OK • ${state.requestMeta.duration} ms`

    );

    showToast(
      `Weather updated for ${state.city}`
    );

  } catch (error) {

    hideLoading();

    showError(
      error.message
      || "Unable to load weather data."
    );

  }

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

  renderCurrentWeather();

  renderStats();

  renderHourlyForecast();

  renderDailyForecast();

  renderAirQuality();

  renderChart();

  renderRecentSearches();

  renderApiExplorer(
    state.lastWeatherResponse
  );

  $("lastUpdated")
    .textContent =
      new Date()
        .toLocaleTimeString(
          "en-IN",
          {
            hour: "numeric",
            minute: "2-digit"
          }
        );

}


/* =========================================================
   CURRENT WEATHER
========================================================= */

function renderCurrentWeather() {

  const weather =
    state.weather;

  const current =
    weather.current;

  const daily =
    weather.daily;

  const [
    condition,
    icon
  ] =
    getWeatherInfo(
      current.weather_code
    );

  $("locationName")
    .textContent =
      state.location.name;

  $("currentDate")
    .textContent =
      formatDate(
        daily.time[0]
      );

  $("conditionIcon")
    .textContent =
      icon;

  $("conditionText")
    .textContent =
      condition;

  $("temperature")
    .textContent =
      convertTemperature(
        current.temperature_2m
      );

  $("temperatureUnit")
    .textContent =
      getUnitText();

  $("feelsLike")
    .textContent =
      `${convertTemperature(
        current.apparent_temperature
      )}${getUnitText()}`;

  $("todayHigh")
    .textContent =
      `${convertTemperature(
        daily.temperature_2m_max[0]
      )}${getUnitText()}`;

  $("todayLow")
    .textContent =
      `${convertTemperature(
        daily.temperature_2m_min[0]
      )}${getUnitText()}`;

  $("sunrise")
    .textContent =
      formatTime(
        daily.sunrise[0]
      );

  $("sunset")
    .textContent =
      formatTime(
        daily.sunset[0]
      );

  $("sunriseSecondary")
    .textContent =
      formatTime(
        daily.sunrise[0]
      );

  $("sunsetSecondary")
    .textContent =
      formatTime(
        daily.sunset[0]
      );

  $("daylightDuration")
    .textContent =
      calculateDaylightDuration(

        daily.sunrise[0],

        daily.sunset[0]

      );

  $("celsiusButton")
    .classList.toggle(

      "active",

      state.unit === "celsius"

    );

  $("fahrenheitButton")
    .classList.toggle(

      "active",

      state.unit === "fahrenheit"

    );

  updateSunPosition(

    daily.sunrise[0],

    daily.sunset[0],

    weather.timezone

  );

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

  const current =
    state.weather.current;

  $("humidity")
    .textContent =
      `${current.relative_humidity_2m}%`;

  $("windSpeed")
    .textContent =
      getWindText(
        current.wind_speed_10m
      );

  $("precipitation")
    .textContent =
      `${current.precipitation} mm`;

  $("pressure")
    .textContent =
      `${Math.round(
        current.surface_pressure
      )} hPa`;

}


/* =========================================================
   HOURLY FORECAST
========================================================= */

function renderHourlyForecast() {

  const hourly =
    state.weather.hourly;

  const startIndex =
    findCurrentHourIndex(
      hourly.time
    );

  const selectedTimes =
    hourly.time.slice(
      startIndex,
      startIndex + 12
    );

  $("hourlyList").innerHTML =
    selectedTimes
      .map(
        (time, index) => {

          const actualIndex =
            startIndex + index;

          const [
            ,
            icon
          ] =
            getWeatherInfo(
              hourly.weather_code[
                actualIndex
              ]
            );

          const rain =
            hourly
              .precipitation_probability
              ?.[actualIndex]
            ?? 0;

          return `
            <div
              class="hourly-item ${
                index === 0
                  ? "active"
                  : ""
              }"
            >

              <span class="hourly-time">
                ${
                  index === 0
                    ? "Now"
                    : formatHour(time)
                }
              </span>

              <span class="hourly-icon">
                ${icon}
              </span>

              <strong class="hourly-temp">
                ${temperatureText(
                  hourly.temperature_2m[
                    actualIndex
                  ]
                )}
              </strong>

              <span class="hourly-rain">
                <i class="fa-solid fa-droplet"></i>
                ${rain}%
              </span>

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   DAILY FORECAST
========================================================= */

function renderDailyForecast() {

  const daily =
    state.weather.daily;

  $("forecastList").innerHTML =
    daily.time
      .map(
        (date, index) => {

          const [
            condition,
            icon
          ] =
            getWeatherInfo(
              daily.weather_code[
                index
              ]
            );

          const day =
            index === 0

              ? "Today"

              : new Date(
                  `${date}T12:00:00`
                )
                .toLocaleDateString(
                  "en-IN",
                  {
                    weekday: "short"
                  }
                );

          const rain =
            daily
              .precipitation_probability_max
              ?.[index]
            ?? 0;

          return `
            <div class="forecast-row">

              <span class="forecast-day">
                ${day}
              </span>

              <span class="forecast-weather-icon">
                ${icon}
              </span>

              <span class="forecast-condition">
                ${condition}
              </span>

              <span class="forecast-temperature">

                <span>
                  ${temperatureText(
                    daily.temperature_2m_max[
                      index
                    ]
                  )}
                </span>

                <span>
                  ${temperatureText(
                    daily.temperature_2m_min[
                      index
                    ]
                  )}
                </span>

              </span>

              <span class="rain-probability">

                <i class="fa-solid fa-droplet"></i>

                ${rain}%

              </span>

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   AQI STATUS
========================================================= */

function getAqiStatus(
  aqi
) {

  if (aqi <= 50) {

    return [
      "Good",
      "Air quality is considered satisfactory.",
      "success"
    ];

  }

  if (aqi <= 100) {

    return [
      "Moderate",
      "Sensitive groups may want to reduce prolonged exposure.",
      "warning"
    ];

  }

  if (aqi <= 150) {

    return [
      "Unhealthy for sensitive groups",
      "Some people may experience effects.",
      "warning"
    ];

  }

  if (aqi <= 200) {

    return [
      "Unhealthy",
      "Health risk is increased for everyone.",
      "danger"
    ];

  }

  if (aqi <= 300) {

    return [
      "Very unhealthy",
      "Health alert conditions.",
      "danger"
    ];

  }

  return [
    "Hazardous",
    "Health warning of emergency conditions.",
    "danger"
  ];

}


/* =========================================================
   AIR QUALITY
========================================================= */

function renderAirQuality() {

  const current =
    state.airQuality.current;

  const aqi =
    Math.round(
      current.us_aqi ?? 0
    );

  const [
    label,
    note,
    level
  ] =
    getAqiStatus(aqi);

  $("aqiValue")
    .textContent =
      aqi;

  $("aqiStatus")
    .textContent =
      label;

  $("aqiNote")
    .textContent =
      note;

  const gaugeDegrees =
    Math.min(
      300,
      Math.max(0, aqi)
    )
    / 300
    * 270;

  const gaugeColor =
    level === "danger"
      ? "var(--danger)"
      : level === "warning"
        ? "var(--warning)"
        : "var(--success)";

  $("aqiGauge").style.background = `

    radial-gradient(
      circle at center,
      var(--surface) 56%,
      transparent 57%
    ),

    conic-gradient(
      ${gaugeColor} 0deg,
      ${gaugeColor} ${gaugeDegrees}deg,
      var(--border) ${gaugeDegrees}deg
    )

  `;

  $("aqiStatus").style.color =
    gaugeColor;

  $("pm25")
    .textContent =
      `${Math.round(
        current.pm2_5 ?? 0
      )} μg/m³`;

  $("pm10")
    .textContent =
      `${Math.round(
        current.pm10 ?? 0
      )} μg/m³`;

  $("carbonMonoxide")
    .textContent =
      `${Math.round(
        current.carbon_monoxide
        ?? 0
      )} μg/m³`;

  $("dust")
    .textContent =
      `${Math.round(
        current.dust ?? 0
      )} μg/m³`;

}


/* =========================================================
   CHART
========================================================= */

function renderChart() {

  const hourly =
    state.weather.hourly;

  const startIndex =
    findCurrentHourIndex(
      hourly.time
    );

  const labels =
    hourly.time

      .slice(
        startIndex,
        startIndex + 24
      )

      .map(
        formatHour
      );

  const values =
    hourly.temperature_2m

      .slice(
        startIndex,
        startIndex + 24
      )

      .map(
        convertTemperature
      );

  const isDark =
    document.documentElement
      .getAttribute(
        "data-theme"
      )
    === "dark";

  const textColor =
    isDark
      ? "#a5afc2"
      : "#667089";

  const gridColor =
    isDark
      ? "#28354a"
      : "#e7eaf1";

  if (state.chart) {

    state.chart.destroy();

  }

  state.chart =
    new Chart(
      $("temperatureChart"),
      {

        type: "line",

        data: {

          labels,

          datasets: [

            {

              data: values,

              borderColor:
                "#5b6cff",

              backgroundColor:
                "rgba(91, 108, 255, 0.11)",

              borderWidth: 3,

              fill: true,

              tension: 0.42,

              pointRadius: 2.5,

              pointHoverRadius: 6,

              pointBackgroundColor:
                "#5b6cff",

              pointBorderColor:
                isDark
                  ? "#151d2c"
                  : "#ffffff",

              pointBorderWidth: 2

            }

          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          interaction: {

            mode: "index",

            intersect: false

          },

          plugins: {

            legend: {
              display: false
            },

            tooltip: {

              backgroundColor:
                "#172033",

              padding: 10,

              displayColors:
                false,

              callbacks: {

                label: (
                  context
                ) =>
                  `${context.parsed.y}${getUnitText()}`

              }

            }

          },

          scales: {

            x: {

              grid: {
                display: false
              },

              ticks: {

                color:
                  textColor,

                maxTicksLimit:
                  8,

                font: {
                  size: 9
                }

              }

            },

            y: {

              grid: {

                color:
                  gridColor

              },

              ticks: {

                color:
                  textColor,

                font: {
                  size: 9
                },

                callback: (
                  value
                ) =>
                  `${value}${getUnitText()}`

              }

            }

          }

        }

      }
    );

}


/* =========================================================
   RECENT SEARCHES
========================================================= */

function renderRecentSearches() {

  const recent =
    JSON.parse(
      localStorage.getItem(
        "weatherRecentSearches"
      )
      || "[]"
    );

  if (!recent.length) {

    $("recentList").innerHTML = `

      <span class="empty-text">
        No recent searches yet.
      </span>

    `;

    return;

  }

  $("recentList").innerHTML =
    recent
      .map(
        (city) => `

          <button
            type="button"
            class="recent-item"
            data-city="${escapeHtml(city)}"
          >

            <i class="fa-solid fa-location-dot"></i>

            ${escapeHtml(city)}

          </button>

        `
      )
      .join("");

  $("recentList")
    .querySelectorAll(
      ".recent-item"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            loadWeatherByCity(
              button.dataset.city
            );

          }
        );

      }
    );

}


function saveRecentSearch(
  city
) {

  let recent =
    JSON.parse(
      localStorage.getItem(
        "weatherRecentSearches"
      )
      || "[]"
    );

  recent =
    recent.filter(
      (item) =>
        item.toLowerCase()
        !==
        city.toLowerCase()
    );

  recent.unshift(city);

  recent =
    recent.slice(
      0,
      8
    );

  localStorage.setItem(
    "weatherRecentSearches",
    JSON.stringify(recent)
  );

}


/* =========================================================
   API EXPLORER
========================================================= */

function renderApiExplorer(
  data
) {

  const pretty =
    data

      ? JSON.stringify(

          data,

          null,

          state.jsonMode
            === "formatted"
            ? 2
            : 0

        )

      : "Waiting for your first API response...";

  $("jsonOutput")
    .textContent =
      pretty;

  $("jsonSize")
    .textContent =
      `${pretty.length.toLocaleString()} characters`;

  $("apiHttpStatus")
    .textContent =
      state.requestMeta.status
        ? `${state.requestMeta.status} OK`
        : "--";

  $("apiResponseTime")
    .textContent =
      state.requestMeta.duration != null

        ? `${state.requestMeta.duration} ms`

        : "-- ms";

  $("apiEndpointShort")
    .textContent =
      state.requestMeta.endpoint
      || WEATHER_API;

  $("apiCoordinates")
    .textContent =
      state.location

        ? `${state.location.latitude.toFixed(4)}, ${state.location.longitude.toFixed(4)}`

        : "--";

  $("apiLastCall")
    .textContent =
      state.requestMeta.calledAt

        ? state.requestMeta.calledAt
            .toLocaleTimeString(
              "en-IN",
              {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit"
              }
            )

        : "--";

}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

  document.documentElement
    .setAttribute(
      "data-theme",
      state.theme
    );

  $("themeButton")
    .innerHTML =
      state.theme === "dark"

        ? `<i class="fa-solid fa-sun"></i>`

        : `<i class="fa-solid fa-moon"></i>`;

}


function toggleTheme() {

  state.theme =
    state.theme === "dark"
      ? "light"
      : "dark";

  localStorage.setItem(
    "weatherTheme",
    state.theme
  );

  loadTheme();

  if (state.weather) {

    renderChart();

  }

}


/* =========================================================
   UNIT
========================================================= */

function changeUnit(
  unit
) {

  state.unit =
    unit;

  localStorage.setItem(
    "weatherUnit",
    unit
  );

  if (state.weather) {

    renderAll();

  }

}


/* =========================================================
   CURRENT LOCATION
========================================================= */

function loadCurrentLocation() {

  if (!navigator.geolocation) {

    showError(
      "Geolocation is not supported by your browser."
    );

    return;

  }

  showLoading(
    "Requesting your current location..."
  );

  hideError();

  navigator.geolocation.getCurrentPosition(

    async (
      position
    ) => {

      const {
        latitude,
        longitude
      } = position.coords;

      const locationName =
        await reverseGeocode(
          latitude,
          longitude
        );

      await loadWeatherByCoordinates(

        latitude,

        longitude,

        locationName,

        false

      );

    },

    () => {

      hideLoading();

      showError(
        "Location permission was denied. Search for a city instead."
      );

    },

    {

      enableHighAccuracy: true,

      timeout: 10000,

      maximumAge: 300000

    }

  );

}


/* =========================================================
   COPY
========================================================= */

async function copyText(
  text,
  successMessage
) {

  try {

    await navigator
      .clipboard
      .writeText(text);

    showToast(
      successMessage
    );

  } catch {

    showToast(
      "Copy is unavailable in this browser."
    );

  }

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(
      (item) => {

        item.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".nav-item"
              )
              .forEach(
                (link) =>
                  link.classList.remove(
                    "active"
                  )
              );

            item.classList.add(
              "active"
            );

            $("sidebar")
              .classList
              .remove("open");

          }
        );

      }
    );

  const observer =
    new IntersectionObserver(

      (entries) => {

        const visible =
          entries

            .filter(
              (entry) =>
                entry.isIntersecting
            )

            .sort(
              (a, b) =>
                b.intersectionRatio
                -
                a.intersectionRatio
            )[0];

        if (!visible) {
          return;
        }

        document
          .querySelectorAll(
            ".nav-item"
          )
          .forEach(
            (item) => {

              item.classList.toggle(

                "active",

                item.dataset.section
                ===
                visible.target.id

              );

            }
          );

      },

      {

        rootMargin:
          "-35% 0px -55% 0px",

        threshold: [
          0.1,
          0.25,
          0.5
        ]

      }

    );

  [
    "dashboard",
    "hourly",
    "forecast",
    "airQuality",
    "apiExplorer",
    "recent"
  ]
    .forEach(
      (id) => {

        const node =
          $(id);

        if (node) {

          observer.observe(
            node
          );

        }

      }
    );

}


/* =========================================================
   SEARCH FORM
========================================================= */

$("searchForm")
  .addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      const city =
        $("cityInput")
          .value
          .trim();

      if (city) {

        $("suggestions")
          .classList
          .add("hidden");

        loadWeatherByCity(
          city
        );

      }

    }
  );


/* =========================================================
   SEARCH INPUT
========================================================= */

$("cityInput")
  .addEventListener(
    "input",
    (event) => {

      searchCities(
        event.target.value
      );

    }
  );


/* =========================================================
   LOCATION BUTTON
========================================================= */

$("locationButton")
  .addEventListener(
    "click",
    loadCurrentLocation
  );


/* =========================================================
   THEME BUTTON
========================================================= */

$("themeButton")
  .addEventListener(
    "click",
    toggleTheme
  );


/* =========================================================
   REFRESH BUTTON
========================================================= */

$("refreshButton")
  .addEventListener(
    "click",
    () => {

      if (
        state.location
      ) {

        loadWeatherByCoordinates(

          state.location.latitude,

          state.location.longitude,

          state.location.name

        );

      }

    }
  );


/* =========================================================
   CHART UPDATE
========================================================= */

$("chartRefreshButton")
  .addEventListener(
    "click",
    () => {

      if (state.weather) {

        renderChart();

        showToast(
          "Temperature chart updated."
        );

      }

    }
  );


/* =========================================================
   RETRY BUTTON
========================================================= */

$("retryButton")
  .addEventListener(
    "click",
    () => {

      if (
        state.location
      ) {

        loadWeatherByCoordinates(

          state.location.latitude,

          state.location.longitude,

          state.location.name

        );

      } else {

        loadWeatherByCity(
          state.city
        );

      }

    }
  );


/* =========================================================
   UNIT BUTTONS
========================================================= */

$("celsiusButton")
  .addEventListener(
    "click",
    () =>
      changeUnit(
        "celsius"
      )
  );


$("fahrenheitButton")
  .addEventListener(
    "click",
    () =>
      changeUnit(
        "fahrenheit"
      )
  );


/* =========================================================
   CLEAR RECENT
========================================================= */

$("clearRecent")
  .addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        "weatherRecentSearches"
      );

      renderRecentSearches();

      showToast(
        "Recent searches cleared."
      );

    }
  );


/* =========================================================
   PROMO BUTTON
========================================================= */

$("promoButton")
  .addEventListener(
    "click",
    () => {

      document
        .querySelector(
          "#apiExplorer"
        )
        .scrollIntoView({
          behavior: "smooth"
        });

      showToast(
        "Welcome to the Pro API workspace."
      );

    }
  );


/* =========================================================
   MOBILE MENU
========================================================= */

$("mobileMenuButton")
  .addEventListener(
    "click",
    () => {

      $("sidebar")
        .classList
        .toggle("open");

    }
  );


/* =========================================================
   QUICK SEARCH BUTTONS
========================================================= */

document
  .querySelectorAll(
    ".quick-city"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          loadWeatherByCity(
            button.dataset.city
          );

        }
      );

    }
  );


/* =========================================================
   JSON TABS
========================================================= */

document
  .querySelectorAll(
    ".json-tab"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".json-tab"
            )
            .forEach(
              (tab) =>
                tab.classList.remove(
                  "active"
                )
            );

          button.classList.add(
            "active"
          );

          state.jsonMode =
            button.dataset.jsonMode;

          renderApiExplorer(
            state.lastWeatherResponse
          );

        }
      );

    }
  );


/* =========================================================
   COPY ENDPOINT
========================================================= */

$("copyEndpointButton")
  .addEventListener(
    "click",
    () => {

      copyText(

        state.requestMeta.endpoint
        || WEATHER_API,

        "API endpoint copied."

      );

    }
  );


/* =========================================================
   COPY JSON
========================================================= */

$("copyJsonButton")
  .addEventListener(
    "click",
    () => {

      const value =
        state.lastWeatherResponse

          ? JSON.stringify(

              state.lastWeatherResponse,

              null,

              state.jsonMode
                === "formatted"
                ? 2
                : 0

            )

          : "";

      copyText(

        value,

        value
          ? "JSON response copied."
          : "No JSON response yet."

      );

    }
  );


/* =========================================================
   CLICK OUTSIDE SUGGESTIONS
========================================================= */

document.addEventListener(
  "click",
  (event) => {

    if (
      !event.target.closest(
        ".search-wrap"
      )
    ) {

      $("suggestions")
        .classList
        .add("hidden");

    }

  }
);


/* =========================================================
   INITIALIZATION
========================================================= */

loadTheme();

renderRecentSearches();

setupNavigation();

loadWeatherByCity(
  "Patna"
);