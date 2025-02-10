// API Key and Base URL
const API_KEY = "Add Your Api key" // Replace with your API key
const BASE_URL = "http://api.weatherapi.com/v1"

// DOM Elements
const searchBar = document.getElementById("search-bar")
const searchButton = document.getElementById("search-button")
const locationButton = document.getElementById("location-button")
const themeButton = document.getElementById("theme-button")
const body = document.body
const currentWeatherContainer = document.querySelector(".current-weather .weather-info")
const forecastContainer = document.querySelector(".forecast-days")
const mapContainer = document.getElementById("map")

let map

// Theme Toggle
themeButton.addEventListener("click", () => {
    body.classList.toggle("dark")
    themeButton.textContent = body.classList.contains("dark") ? "☀️" : "🌙"
})

// Update Current Weather
function updateWeather(data) {
    const { current, location } = data
    currentWeatherContainer.innerHTML = `
        <div class="temperature">${current.temp_c}°C</div>
        <div class="weather-icon">${getWeatherIcon(
        current.condition.text
    )}</div>
        <div class="condition">${current.condition.text}</div>
        <div class="humidity">Humidity: ${current.humidity}%</div>
        <div class="precipitation">Precipitation: ${current.precip_mm}mm</div>
        <div class="sunrise-sunset">Sunrise: ${location.localtime}</div>
    `
    checkSevereWeather(current.condition.text)
}

// Fetch Forecast Data
async function fetchForecast(location) {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast.json?key=${API_KEY}&q=${location}&days=3`
        )
        const data = await response.json()
        updateForecast(data.forecast.forecastday)
    } catch (error) {
        console.error("Error fetching forecast data:", error)
    }
}

// Update Forecast
function updateForecast(forecastDays) {
    forecastContainer.innerHTML = forecastDays
        .map(
            (day) => `
    <div class="forecast-day">
        <div class="date">${new Date(day.date).toLocaleDateString()}</div>
        <div class="weather-icon">${getWeatherIcon(
                day.day.condition.text
            )}</div>
        <div class="temp">${day.day.avgtemp_c}°C</div>
        <div class="condition">${day.day.condition.text}</div>
    </div>
    `
        )
        .join("")
}

// Initialize Map
function initMap(lat, lon) {
    // Check if the map container exists
    const mapContainer = document.getElementById("map")
    if (!mapContainer) {
        console.error("Map container not found!")
        return
    }

    // Remove existing map if it exists
    if (map) {
        map.remove()
    }

    // Initialize the map
    map = L.map("map").setView([lat, lon], 10)
    console.log(map)

    // Add a tile layer (OpenStreetMap)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // Add a marker for the location
    L.marker([lat, lon]).addTo(map)
}

// Example usage
initMap(52.9667, 90.25) // Uncomment to test with hardcoded values

// Get Weather Icon
function getWeatherIcon(condition) {
    if (condition.toLowerCase().includes("sun")) return "☀️"
    if (condition.toLowerCase().includes("rain")) return "🌧️"
    if (condition.toLowerCase().includes("cloud")) return "☁️"
    return "🌈"
}

// Check for Severe Weather
function checkSevereWeather(condition) {
    const severeConditions = ["storm", "tornado", "hurricane", "high wind"]
    if (severeConditions.some((cond) => condition.toLowerCase().includes(cond))) {
        alert(`Severe Weather Alert: ${condition}`)
    }
}

// Cache Weather Data
function getCachedWeather(location) {
    const cachedData = localStorage.getItem(location)
    if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData)
        if (Date.now() - timestamp < 600000) {
            // 10 minutes
            return data
        }
    }
    return null
}

function cacheWeather(location, data) {
    localStorage.setItem(
        location,
        JSON.stringify({ data, timestamp: Date.now() })
    )
}

// Event Listeners
searchButton.addEventListener("click", () => {
    const location = searchBar.value
    console.log
    if (location) fetchWeather(location)
})

locationButton.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords
            fetchWeather(`${latitude},${longitude}`)
        })
    } else {
        alert("Geolocation is not supported by your browser.")
    }
})

// Fetch Weather Data
async function fetchWeather(location) {
    const cachedData = getCachedWeather(location)
    if (cachedData) {
        updateWeather(cachedData)
        return
    }

    try {
        const response = await fetch(
            `${BASE_URL}/current.json?key=${API_KEY}&q=${location}=yes`
        )
        const data = await response.json()
        console.log(data)
        cacheWeather(location, data)
        updateWeather(data)
        fetchForecast(location)
        initMap(data.location.lat, data.location.lon)
    } catch (error) {
        console.error("Error fetching weather data:", error)
        alert("Failed to fetch weather data. Please try again.")
    }
}
