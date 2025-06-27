# 🎧 Moodify – Mood-Based Playlist Recommender

Moodify is a simple website that gives you a **Spotify playlist** based on your **mood**, **language**, and (optionally) your favorite **artist**.

---

## 🌐 Live Website

🔗 [samiyak2.github.io/moodify](https://samiyak2.github.io/moodify/)

---
## UI Preview 

![image](https://github.com/user-attachments/assets/4d9af1a6-66f2-4787-88d7-baa207672fcc)

----
## 💡 Features

- 🎶 Get playlists based on your mood (happy, sad, etc.)
- 🌍 Choose your preferred language (English, Hindi, etc.)
- 🎤 Add your favorite artist (optional)
- 🔗 Direct Spotify playlist link
- 🌐 Clean, dark-themed UI

---

## ⚙️ Tech Stack

**Frontend:**

- HTML
- CSS (Dark theme, responsive design)
- JavaScript (Vanilla JS)

**Backend:**

- Python (Flask)
- REST API using Flask

---
## ☁️ Google Cloud Services Used

| Service             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| **Cloud Run**       | Hosts the Flask backend API                      |
| **Cloud Pub/Sub**   | Sends playlist data between backend and function |
| **Cloud Functions** | Processes data & stores it in Cloud Storage      |
| **Cloud Storage**   | Saves playlist request logs (JSON format)        |
| **Cloud Build**     | Builds and deploys Docker containers             |
| **IAM**             | Manages permissions and access control           |
| **Cloud Shell**     | Used for deploying and managing services         |


---
## 📁 Project Structure

```
Moodify/
├── backend/                     # Flask app for Cloud Run
│   ├── app.py                   # Main Flask app
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile              # (used with Cloud Build)
│
├── function/                    # Google Cloud Function
│   ├── main.py                  # Cloud Function logic
│   └── requirements.txt         # Dependencies
│  
│
├── frontend/                    # UI files for GitHub Pages
│   ├── index.html               # Homepage
│   ├── style.css                # styling
│   └── script.js                # Handles user input & API call
│
└── README.md                    # Project documentation

```
----


## 🖥️ How It Works

1. The user visits the Moodify frontend hosted on GitHub Pages.
2. They select their current mood and preferred language.
3. Optionally, they can enter a favorite artist.
4. When the user clicks "Get Playlist," the frontend sends the input to the Flask backend hosted on Cloud Run.
5. The backend publishes this data to a Pub/Sub topic.
6. A Cloud Function is triggered on new Pub/Sub messages. It processes the data and selects a predefined Spotify playlist based on the mood and language.
7. The playlist information is logged into a Cloud Storage bucket.
8. The playlist link is sent back and shown on the frontend, allowing the user to open it in Spotify.

---

## 🚀 How to Use

1. 🔗 Go to: [Moodify Website](https://samiyak2.github.io/moodify/)
2. Select a mood & language
3. Add an artist (if you want)
4. Click **Get Playlist**
5. Enjoy! 🎧

---
## 🛠️ Setup & Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/moodify.git
cd moodify
```

---

### 2. Build & Deploy Backend with Cloud Build + Cloud Run

Inside the backend folder:

```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/moodify-backend
gcloud run deploy moodify-backend \
  --image gcr.io/YOUR_PROJECT_ID/moodify-backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT=YOUR_PROJECT_ID,PUBSUB_TOPIC=moodify-topic
```

---

### 3. Create a Pub/Sub Topic

```bash
gcloud pubsub topics create moodify-topic
```

---

### 4. Deploy Cloud Function

Inside the function folder:

```bash
cd ../function
gcloud functions deploy handle_playlist_request \
  --runtime python310 \
  --trigger-topic moodify-topic \
  --entry-point handle_request \
  --region asia-south1 \
  --set-env-vars BUCKET_NAME=YOUR_BUCKET_NAME
```

---

### 5. Create Cloud Storage Bucket

```bash
gsutil mb -l asia-south1 gs://YOUR_BUCKET_NAME
```

---

### 6. Deploy Frontend (GitHub Pages)

1. Go to the frontend folder
2. Push to your GitHub repository
3. On GitHub:
   - Go to Settings → Pages
   - Source: main branch, root folder (/)
4. Your site will be live at:  
   https://yourusername.github.io/moodify/

---
## 📁 Folder Structure

```
moodify/
├── backend/         # Flask backend (Cloud Run)
├── function/        # Cloud Function (Pub/Sub subscriber)
├── frontend/        # HTML, CSS, JS (UI)
└── README.md        # Documentation
```

---

## 🙋‍♀️ Created By

👩‍💻 Samiya Kazi  

---
## 📜 License

Open-source project.  
Free to use, modify, and share with credit 💚

---
