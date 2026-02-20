# 🏔️ Skyrim Wellbeing Manager (Moody Bitch)

[![Deploy to GitHub Pages](https://github.com/woodRock/moody-bitch/actions/workflows/deploy.yml/badge.svg)](https://github.com/woodRock/moody-bitch/actions/workflows/deploy.yml)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen?logo=vitest)](https://github.com/woodRock/moody-bitch/actions)
[![HackerNoon Featured](https://img.shields.io/badge/HackerNoon-Featured-green?logo=hackernoon)](https://hackernoon.com/skyrim-wellbeing-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**An immersive, gamified wellbeing and mood tracker inspired by *The Elder Scrolls V: Skyrim*.**

---

## 📖 Featured on HackerNoon

This project was featured as a **Top Story** on the front page of HackerNoon!
Check out the full article here: [**Skyrim Wellbeing Manager: Turning Life into an RPG**](https://hackernoon.com/skyrim-wellbeing-manager)

---

## ✨ Features

- **🐧 Reactive 3D Penguin Companion:** A Three.js penguin model that lives on your dashboard. Its mood, energy levels, and even eye color change based on your recorded wellbeing metrics.
- **⚔️ Quest-Based Habit Tracking:** Turn your daily goals (exercise, meditation, reading) into quests. Completing them grants XP, skill increases, and "loot" items.
- **📜 AI-Powered Lore Generation:** Integration with **Google Gemini API** to transform your mundane tasks into atmospheric Skyrim-style chronicles.
- **🌌 Literal Skill Tree:** Level up your real-life skills through a constellation-based perk system. Unlock new perks as you grow.
- **🗺️ The Journey Map:** Integrated Leaflet maps to track your physical journey as you progress through your day.
- **🎭 Immersive UI:** A pixel-perfect recreation of the Skyrim HUD, compass, parchment menus, and "Level Up" animations.
- **🎵 Atmospheric Soundscape:** Authentic sound effects for menu navigation, leveling up, and quest completion.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Framer Motion
- **3D Graphics:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Artificial Intelligence:** Google Gemini (Generative Language API)
- **Backend & Auth:** Firebase (Authentication & Firestore)
- **Mapping:** Leaflet & `react-leaflet`
- **Charts:** Recharts (Mood & Energy tracking)
- **Styling:** Custom CSS with Skyrim-inspired design patterns

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Firebase Project
- A Google AI (Gemini) API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/woodj/moody-bitch.git
    cd moody-bitch
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables:**
    Create a `.env` file in the root directory and add your credentials:
    ```env
    VITE_FIREBASE_API_KEY=your_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
    VITE_GOOGLE_API_KEY=your_gemini_api_key
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! If you're a fellow Dragonborn with ideas for new perks, items, or UI improvements, feel free to open an issue or a PR.

*May the Divines guide your path.*
