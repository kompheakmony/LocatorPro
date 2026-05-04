# Locate360 - Business Hub 📍

Locate360 is a high-performance, responsive map-based application designed to help users quickly find business locations, including mobile branches, 24/7 centers, and ATMs. Built with a focus on speed, polish, and usability.

## ✨ Features

- **Interactive Map:** Powered by Leaflet/OpenStreetMap with custom high-resolution markers.
- **Smart Filtering:** Search by location name or address, and filter by category (Branch, ATM, 24/7).
- **Proximity Awareness:** Automatically detects user location to provide distance-based context.
- **Polished Detail Cards:** Rich location previews with photos, contact details, and one-click navigation.
- **Smooth Navigation:** Integrated with Google Maps for real-time directions.
- **Optimized Performance:** Uses React memoization (`useMemo`, `useCallback`) and icon caching for buttery-smooth panning and zooming.
- **Mobile First:** Fully responsive design that adapts seamlessly from desktop sidebars to mobile-optimized overlays.

## 🛠️ Tech Stack

- **Framework:** [React 18+](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Motion](https://motion.dev/)
- **Mapping:** [React Leaflet](https://react-leaflet.js.org/) & [Leaflet](https://leafletjs.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kompheakmony/locate360.git
   cd locate360
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🗺️ Google My Maps MID Guide

If you manage your location data via Google My Maps, here is how you can find your **Map ID (MID)** and integrate it:

### 1. Finding the Map ID (MID)
The MID is the unique identifier for your custom map. To find it:
1. Open your map in [Google My Maps](https://www.google.com/maps/d/).
2. Look at the URL in your browser's address bar. It will look like this:
   `https://www.google.com/maps/d/u/0/edit?mid=1vX...&ll=...`
3. The value after `mid=` (the long string of characters) is your **MID**.

### 2. Using Data in Locate360
This application stores location data in `src/data.ts`. To update it with your My Maps data:
1. In Google My Maps, click the **Menu** (three dots) next to the map title.
2. Select **Export to KML/KMZ**.
3. Choose "Export as KML" (for easier conversion).
4. Use a tool like [kml2json](https://www.google.com/search?q=kml+to+json+converter) to convert your KML file to a JSON format.
5. Map the resulting coordinates and properties to the `Location` interface in `src/data.ts`.

## 📱 User Interface

- **Floating Header:** Glassmorphism-style search and filter bar.
- **Side Drawer (Desktop):** Quick access list for all locations with distance indicators.
- **Actionable Popups:** Custom map popups that auto-pan to clear UI elements.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
