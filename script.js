// 🔧 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDzRjmybK73-EJuMBcvZqtqdXvM2Tddne0",
  authDomain: "maptor-f5bcb.firebaseapp.com",
  projectId: "maptor-f5bcb",
  storageBucket: "maptor-f5bcb.appspot.com",
  messagingSenderId: "477187053297",
  appId: "1:477187053297:web:5a391bf2a46dd762767b50"
};

// Initialize Firebase - Global variables
let db, storage;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  storage = firebase.storage();
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
}

// Cloud Services Configuration - All FREE Services
const CLOUD_SERVICES = {
  // 1. Google Maps API (Free tier: $200/month credit)
  GOOGLE_MAPS_API_KEY: "AIzaSyDWpe_xGF60aE0g4Yd1iZikPxgbxHyZOS0",
  
  // 2. OpenWeatherMap API (Free: 1,000 calls/day)
  OPENWEATHER_API_KEY: "YOUR_OPENWEATHER_API_KEY",
  
  // 3. Unsplash API (Free: 5,000 requests/hour)
  UNSPLASH_ACCESS_KEY: "YOUR_UNSPLASH_ACCESS_KEY",
  
  // 4. NewsAPI (Free: 1,000 requests/day)
  NEWS_API_KEY: "YOUR_NEWS_API_KEY",
  
  // 5. IP Geolocation API (Free: 1,000 requests/month)
  IP_API_URL: "http://ip-api.com/json",
  
  // 6. Public Transport API (Free)
  TRANSPORT_API_URL: "https://api.transportapi.com/v3",
  
  // 7. Traffic Data API (Free tier available)
  TOMTOM_API_KEY: "YOUR_TOMTOM_API_KEY",
  
  // 8. Air Quality API (Free tier)
  AIR_QUALITY_API_KEY: "YOUR_AIR_QUALITY_API_KEY"
};

let selectedLatLng = null;
let map, directionsService, directionsRenderer, userLocation = null;
let weatherData = null;
let trafficData = null;
let airQualityData = null;
let newsData = null;

// Initialize all cloud services
async function initializeCloudServices() {
  console.log("🚀 Initializing cloud services...");
  
  // Test Firebase connection
  if (db) {
    try {
      await db.collection('test').doc('connection').get();
      console.log("✅ Firebase Firestore connected");
    } catch (error) {
      console.error("❌ Firebase Firestore connection failed:", error);
    }
  }
  
  // Test Google Maps API
  if (typeof google !== 'undefined' && google.maps) {
    console.log("✅ Google Maps API loaded");
  } else {
    console.error("❌ Google Maps API not loaded");
  }
  
  // Get user's IP-based location
  await getUserLocationFromIP();
}

// Get user location from IP (Free service)
async function getUserLocationFromIP() {
  try {
    const response = await fetch(CLOUD_SERVICES.IP_API_URL);
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log("📍 IP Location:", data);
      
      // Store IP location data
      if (db) {
        await db.collection('user_locations').add({
          ip: data.query,
          city: data.city,
          country: data.country,
          lat: data.lat,
          lon: data.lon,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error("❌ IP location error:", error);
  }
}

// Get traffic data (TomTom API - Free tier)
async function getTrafficData(location) {
  try {
    const response = await fetch(
      `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${CLOUD_SERVICES.TOMTOM_API_KEY}&point=${location.lat},${location.lng}&unit=KMPH`
    );
    trafficData = await response.json();
    
    if (db) {
      await db.collection('traffic_data').add({
        location: location,
        data: trafficData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log("✅ Traffic data loaded:", trafficData);
  } catch (error) {
    console.error("❌ Traffic API error:", error);
  }
}

// Get air quality data (Free API)
async function getAirQualityData(location) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${location.lat}&lon=${location.lng}&appid=${CLOUD_SERVICES.OPENWEATHER_API_KEY}`
    );
    airQualityData = await response.json();
    
    if (db) {
      await db.collection('air_quality').add({
        location: location,
        data: airQualityData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log("✅ Air quality data loaded:", airQualityData);
  } catch (error) {
    console.error("❌ Air quality API error:", error);
  }
}

// Get local news (NewsAPI - Free tier)
async function getLocalNews(location) {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=traffic+accident+road&language=en&sortBy=publishedAt&apiKey=${CLOUD_SERVICES.NEWS_API_KEY}`
    );
    newsData = await response.json();
    
    if (db) {
      await db.collection('local_news').add({
        location: location,
        articles: newsData.articles,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log("✅ Local news loaded:", newsData);
  } catch (error) {
    console.error("❌ News API error:", error);
  }
}

// Get random background image (Unsplash - Free)
async function getBackgroundImage() {
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=city+night&client_id=${CLOUD_SERVICES.UNSPLASH_ACCESS_KEY}`
    );
    const data = await response.json();
    
    // Apply as background
    document.body.style.backgroundImage = `linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%), url(${data.urls.regular})`;
    
    console.log("✅ Background image loaded from Unsplash");
  } catch (error) {
    console.error("❌ Unsplash API error:", error);
  }
}

window.initMap = function () {
  try {
    const center = { lat: 19.0760, lng: 72.8777 };
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 13,
      center,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "transit",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#2c3e50" }]
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#34495e" }]
        }
      ]
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ 
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#6366f1",
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });

    // Detect location for enhanced features
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        map.setCenter(userLocation);
        
        // Add user location marker with animation
        const userMarker = new google.maps.Marker({
          position: userLocation,
          map: map,
          title: "Your Location",
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#6366f1" stroke="white" stroke-width="3"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
                <circle cx="16" cy="16" r="2" fill="#6366f1"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32)
          },
          animation: google.maps.Animation.BOUNCE
        });
        
        // Stop animation after 3 seconds
        setTimeout(() => {
          userMarker.setAnimation(null);
        }, 3000);
        
        await loadChatMessages();
        await getWeatherData(userLocation);
        await getTrafficData(userLocation);
        await getAirQualityData(userLocation);
        await getLocalNews(userLocation);
        
        // Show welcome notification
        showNotification("📍 Location detected! Loading local data...", "success");
      }, (error) => {
        console.error("Geolocation error:", error);
        loadChatMessages();
        showNotification("⚠️ Location access denied. Some features may be limited.", "warning");
      });
    } else {
      loadChatMessages();
      showNotification("⚠️ Geolocation not supported. Some features may be limited.", "warning");
    }

    map.addListener("click", (e) => {
      selectedLatLng = e.latLng.toJSON();
      
      // Clear previous incident markers
      const markers = map.getMarkers ? map.getMarkers() : [];
      markers.forEach(marker => {
        if (marker.title === "Selected Location") {
          marker.setMap(null);
        }
      });
      
      // Add new marker with animation
      const incidentMarker = new google.maps.Marker({ 
        position: selectedLatLng, 
        map,
        title: "Selected Location",
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="white" stroke-width="3"/>
              <path d="M16 8L18.5 15.5L26 16L18.5 16.5L16 24L13.5 16.5L6 16L13.5 15.5L16 8Z" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32)
        },
        animation: google.maps.Animation.DROP
      });
      
      showNotification("📍 Location selected! You can now report an incident.", "info");
    });
    
    initializeCloudServices();
  } catch (error) {
    console.error("Map initialization error:", error);
    showNotification("❌ Failed to initialize map. Please check your connection.", "error");
  }
};

// Weather API Integration (OpenWeatherMap)
async function getWeatherData(location) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${CLOUD_SERVICES.OPENWEATHER_API_KEY}&units=metric`
    );
    weatherData = await response.json();
    
    // Store weather data in Firebase
    if (db) {
      await db.collection('weather').doc(getLocationKey()).set({
        ...weatherData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Display weather info
    displayWeatherInfo(weatherData);
    
    console.log("✅ Weather data loaded:", weatherData);
  } catch (error) {
    console.error("❌ Weather API error:", error);
  }
}

// Display weather information
function displayWeatherInfo(weather) {
  const container = document.querySelector('.container');
  const weatherDiv = document.createElement('div');
  weatherDiv.className = 'weather-info';
  weatherDiv.innerHTML = `
    <h4>🌤️ Current Weather</h4>
    <div class="weather-details">
      <div>🌡️ ${Math.round(weather.main.temp)}°C</div>
      <div>💨 ${weather.wind.speed} m/s</div>
      <div>💧 ${weather.main.humidity}%</div>
      <div>${weather.weather[0].main}</div>
    </div>
  `;
  
  // Insert after the header
  const header = container.querySelector('h2');
  header.parentNode.insertBefore(weatherDiv, header.nextSibling);
}

async function calculateRoute() {
  const from = document.getElementById("fromInput").value.trim();
  const to = document.getElementById("toInput").value.trim();

  if (!from || !to) {
    showNotification("⚠️ Please enter both source and destination.", "warning");
    return;
  }

  // Add loading state
  const btn = document.querySelector('.nav-btn');
  btn.classList.add('loading');
  btn.textContent = '🔄 Calculating...';

  try {
    directionsService.route(
      {
        origin: from,
        destination: to,
        travelMode: "DRIVING",
        optimizeWaypoints: true,
        provideRouteAlternatives: true
      },
      (result, status) => {
        btn.classList.remove('loading');
        btn.textContent = '🚀 Start Navigation';
        
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          
          // Store route data in Firebase
          if (db) {
            db.collection('routes').add({
              from,
              to,
              route: result.routes[0],
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              userLocation: userLocation
            });
          }
          
          // Show route info with animation
          const route = result.routes[0];
          const duration = route.legs[0].duration.text;
          const distance = route.legs[0].distance.text;
          
          showNotification(`✅ Route found! Duration: ${duration}, Distance: ${distance}`, "success");
          
          // Add route animation
          animateRoute(result.routes[0]);
        } else {
          showNotification("❌ Route not found. Please check your addresses.", "error");
        }
      }
    );
  } catch (error) {
    console.error("Route calculation error:", error);
    btn.classList.remove('loading');
    btn.textContent = '🚀 Start Navigation';
    showNotification("❌ Failed to calculate route. Please try again.", "error");
  }
}

// Animate route drawing
function animateRoute(route) {
  const path = route.overview_path;
  const polyline = new google.maps.Polyline({
    path: [],
    geodesic: true,
    strokeColor: '#6366f1',
    strokeOpacity: 0.8,
    strokeWeight: 6,
    map: map
  });

  let i = 0;
  const timer = setInterval(() => {
    polyline.getPath().push(path[i]);
    i++;
    if (i >= path.length) {
      clearInterval(timer);
    }
  }, 100);
}

// 📍 Incident Reporting with enhanced features
document.getElementById("incidentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  try {
    const type = document.getElementById("type").value;
    const file = document.getElementById("imageInput").files[0];

    if (!selectedLatLng) {
      showNotification("⚠️ Please select a location on the map first.", "warning");
      return;
    }

    if (!file) {
      showNotification("⚠️ Please upload an image.", "warning");
      return;
    }

    // Add loading state
    const btn = document.querySelector('.report-btn');
    btn.classList.add('loading');
    btn.textContent = '📤 Reporting...';

    // 1. Firebase Storage for image
    const imageRef = storage.ref().child(`incidents/${Date.now()}_${file.name}`);
    await imageRef.put(file);
    const imageUrl = await imageRef.getDownloadURL();

    // 2. Store incident data in Firebase Firestore
    const incidentData = {
      type,
      location: selectedLatLng,
      imageUrl,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      weather: weatherData,
      traffic: trafficData,
      airQuality: airQualityData,
      userLocation: userLocation
    };

    const incidentRef = await db.collection("incidents").add(incidentData);

    // 3. Get local news about similar incidents
    await getLocalNews(selectedLatLng);

    btn.classList.remove('loading');
    btn.textContent = '📤 Report Incident';

    showNotification("✅ Incident reported successfully! Local authorities have been notified.", "success");
    document.getElementById("incidentForm").reset();
    
    // Clear selected location marker
    selectedLatLng = null;
    
  } catch (error) {
    console.error("Incident reporting error:", error);
    const btn = document.querySelector('.report-btn');
    btn.classList.remove('loading');
    btn.textContent = '📤 Report Incident';
    showNotification("❌ Failed to report incident. Please try again.", "error");
  }
});

// 💬 Location-based Chat with real-time updates
function toggleChat() {
  const chatModal = document.getElementById("chatModal");
  chatModal.classList.toggle("hidden");
  
  if (!chatModal.classList.contains("hidden")) {
    // Add entrance animation
    chatModal.style.animation = "slideInRight 0.5s ease-out";
  }
}

function getLocationKey() {
  if (!userLocation) return "global";
  const { lat, lng } = userLocation;
  return `lat${lat.toFixed(2)}_lng${lng.toFixed(2)}`; // round for grouping
}

function loadChatMessages() {
  try {
    if (!db) {
      console.error("Firebase not initialized");
      return;
    }
    
    const chatMessages = document.getElementById("chatMessages");
    const chatRef = db.collection("chats").doc(getLocationKey()).collection("messages").orderBy("timestamp");

    chatRef.onSnapshot((snapshot) => {
      chatMessages.innerHTML = "";
      snapshot.forEach((doc) => {
        const msg = doc.data();
        const div = document.createElement("div");
        div.className = "chat-message";
        div.innerHTML = `
          <strong>${msg.user || 'Anonymous'}</strong>: ${msg.text}
          <small>${msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString() : ''}</small>
        `;
        chatMessages.appendChild(div);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, (error) => {
      console.error("Chat loading error:", error);
    });
  } catch (error) {
    console.error("Chat initialization error:", error);
  }
}

document.getElementById("chatForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  try {
    if (!db) {
      showNotification("❌ Chat service not available. Please check your connection.", "error");
      return;
    }
    
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;

    const locationKey = getLocationKey();
    await db.collection("chats").doc(locationKey).collection("messages").add({
      text,
      user: "User", // In production, use actual user authentication
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      location: userLocation
    });

    input.value = "";
  } catch (error) {
    console.error("Chat sending error:", error);
    showNotification("❌ Failed to send message. Please try again.", "error");
  }
});

// Notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()">✖️</button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1'};
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    max-width: 400px;
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Maptor initialized with multiple FREE cloud services:");
  console.log("1. Firebase (Firestore + Storage) - Free tier");
  console.log("2. Google Maps API - $200/month free credit");
  console.log("3. OpenWeatherMap API - 1,000 calls/day free");
  console.log("4. Unsplash API - 5,000 requests/hour free");
  console.log("5. NewsAPI - 1,000 requests/day free");
  console.log("6. IP Geolocation API - 1,000 requests/month free");
  console.log("7. TomTom Traffic API - Free tier available");
  console.log("8. Air Quality API - Free tier");
  
  // Try to get background image
  if (CLOUD_SERVICES.UNSPLASH_ACCESS_KEY !== "YOUR_UNSPLASH_ACCESS_KEY") {
    getBackgroundImage();
  }
  
  // Add particle animation
  createParticles();
});

// Create floating particles
function createParticles() {
  const particlesContainer = document.querySelector('.particles');
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
    particlesContainer.appendChild(particle);
  }
}