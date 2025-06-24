// 🔧 Firebase Config
const firebaseConfig = {
 // Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzRjmybK73-EJuMBcvZqtqdXvM2Tddne0",
  authDomain: "maptor-f5bcb.firebaseapp.com",
  projectId: "maptor-f5bcb",
  storageBucket: "maptor-f5bcb.appspot.com",
  messagingSenderId: "477187053297",
  appId: "1:477187053297:web:5a391bf2a46dd762767b50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

let selectedLatLng = null;
let map, directionsService, directionsRenderer, userLocation = null;

window.initMap = function () {
  const center = { lat: 19.0760, lng: 72.8777 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  // Detect location for chat
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      map.setCenter(userLocation);
      loadChatMessages(); // Load chat for this location
    });
  }

  map.addListener("click", (e) => {
    selectedLatLng = e.latLng.toJSON();
    new google.maps.Marker({ position: selectedLatLng, map });
  });
};

async function calculateRoute() {
  const from = document.getElementById("fromInput").value;
  const to = document.getElementById("toInput").value;

  if (!from || !to) {
    alert("Please enter both source and destination.");
    return;
  }

  directionsService.route(
    {
      origin: from,
      destination: to,
      travelMode: "DRIVING",
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);
      } else {
        alert("Route not found.");
      }
    }
  );
}

// 📍 Incident Reporting
document.getElementById("incidentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const type = document.getElementById("type").value;
  const file = document.getElementById("imageInput").files[0];

  if (!selectedLatLng || !file) {
    alert("Please select location on map and upload image.");
    return;
  }

  const imageRef = storage.ref().child(`incidents/${Date.now()}_${file.name}`);
  await imageRef.put(file);
  const imageUrl = await imageRef.getDownloadURL();

  await db.collection("incidents").add({
    type,
    location: selectedLatLng,
    imageUrl,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });

  alert("Incident reported successfully!");
});

// 💬 Location-based Chat
function toggleChat() {
  document.getElementById("chatModal").classList.toggle("hidden");
}

function getLocationKey() {
  if (!userLocation) return "global";
  const { lat, lng } = userLocation;
  return `lat${lat.toFixed(2)}_lng${lng.toFixed(2)}`; // round for grouping
}

function loadChatMessages() {
  const chatMessages = document.getElementById("chatMessages");
  const chatRef = db.collection("chats").doc(getLocationKey()).collection("messages").orderBy("timestamp");

  chatRef.onSnapshot((snapshot) => {
    chatMessages.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.textContent = msg.text;
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

document.getElementById("chatForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  const locationKey = getLocationKey();
  await db.collection("chats").doc(locationKey).collection("messages").add({
    text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });

  input.value = "";
});