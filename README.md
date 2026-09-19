# 🕷️ Spider-Man: Web-Shooter AR Simulator

An interactive Augmented Reality web application that turns your webcam into Peter Parker's web-shooters! Using real-time computer vision (MediaPipe Hands), it detects the iconic **Spider-Man hand gesture (🤟)** to shoot synthetic dynamic webs directly from your hands onto flying Marvel villains.

---

## 🌐 Live Website

### 🚀 **Play Now Live:** [https://lspider.netlify.app/](https://lspider.netlify.app/)

> [!TIP]
> Experience real-time AI hand-tracking web-shooting directly in your browser with webcam enabled!

---

## 🚀 Netlify Deployment & Hosting

The website is actively deployed at **[lspider.netlify.app](https://lspider.netlify.app/)**.

If you ever want to update or re-upload your files:
### 👉 **[Click Here to Go to Netlify Drop (app.netlify.com/drop)](https://app.netlify.com/drop)**

### 📦 Quick 3-Step Hosting Instructions:
1. **Open the Netlify Drop link above** in your browser and log in or sign up (free).
2. **Locate your project folder** on your computer:
   - Path: `spiderman website/frontend`
3. **Drag and drop the `frontend` folder** directly onto the Netlify Drop page in your browser.
4. 🎉 **Done!** Netlify will immediately deploy your site and provide you with a live `https://...` URL.

> [!IMPORTANT]
> **Why Netlify HTTPS is required:** Modern web browsers require a secure connection (`https://` or `localhost`) to access your webcam. Netlify automatically provides free SSL/HTTPS, making hand gesture detection work seamlessly out of the box!

---

## 🎮 How to Play & Web-Shooter Controls

### 1. The Iconic Spider-Man Pose (🤟)
* **Middle & Ring fingers**: Curled down to touch your palm.
* **Index & Pinky fingers**: Extended straight out.
* **Thumb**: Extended outward.
* *When detected, the web-shooter triggers instantly with a realistic **"THWIP!"** sound, firing webs in your hand's direction!*

### 2. Reloading Web Fluid (✊)
* Each cartridge contains **10 web fluid charges**.
* **Clench your fist (✊)** for 1 second in front of the camera, OR press **`R`**, OR tap the screen to swap cartridges.

### 3. Gadgets & Web Types (Keys 1 - 4)
* **[1] Classic Web (🕸️):** Standard high-tensile web strand & splat net.
* **[2] Impact Web (💥):** High-density concussive web ball for heavy damage.
* **[3] Venom Taser (⚡):** Miles Morales bio-electric lightning webs that shock targets.
* **[4] Web Grenade (💣):** Wide-area sticky cluster net trapping multiple targets at once.

### 4. Villains & Targets
* 🎃 **Pumpkin Bombs:** Disarm them before they explode! Triggers precognitive **Spider-Sense** danger alert.
* 👺 **Green Goblin:** Agile glider flights across the screen (+300 pts).
* 🐙 **Doc Ock Tentacles:** Mechanical arms striking from screen borders (+250 pts).
* 👾 **Venom Symbiote:** Heavy symbiote entities requiring multiple hits (+400 pts).

---

## 📁 Project Architecture

```
spiderman website/
├── frontend/                 # 🚀 Standalone Drag & Drop folder for Netlify
│   ├── index.html            # Main AR Canvas, Stark-Tech HUD & UI
│   ├── style.css             # Marvel / Spider-Verse visual styles & animations
│   ├── game.js               # MediaPipe Hands CV engine & procedural audio
│   ├── netlify.toml          # Netlify camera permissions & header config
│   └── _redirects            # SPA fallback routes
├── backend/                  # Optional Node.js / Express Leaderboard API
│   ├── server.js             # High scores REST API & local static server
│   └── package.json          # Dependencies (express, cors)
├── netlify.toml              # Root Netlify configuration file
└── README.md                 # Deployment and user guide
```

---

## 💻 Running Locally (Optional)

### Option A: Open Directly (No Install Needed)
Simply double-click [`frontend/index.html`](frontend/index.html) in your browser!

### Option B: Run Fullstack Server
If you want to use the local Express backend with leaderboard storage:
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start local server
npm start
```
Then visit: `http://localhost:5000`

---

## 🛡️ Privacy & Tech Stack
* **MediaPipe Hands (Google)**: High-speed hand landmark detection (60 FPS via WebAssembly/WebGL).
* **100% Client-Side**: No video frames are ever recorded or uploaded to any server.
* **Web Audio API**: Procedurally synthesized Marvel "THWIP!" whip, impact, and Spider-Sense sound effects with zero external audio download dependencies.
* **Vanilla HTML5 / CSS3 / JavaScript**: Blazing fast, lightweight, and compatible everywhere.
