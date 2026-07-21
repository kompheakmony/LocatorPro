# ABA Locator 📍

Locate360 is a high-performance, responsive map-based application designed to help users quickly find business locations. Built with a focus on speed, polish, and usability, it features a modern glassmorphism UI and seamless integration with Google My Maps.

<p align="center">
    <img width="100%" alt="aba-locator vercel app_" src="https://github.com/user-attachments/assets/08830102-879c-4dfe-bf21-dbe42c940b49" />
</p>

## ✨ Features

- **Interactive Map:** Powered by Leaflet/OpenStreetMap with custom high-resolution markers.
- **Smart Filtering:** Search by location name or address, and filter by categories defined in the central configuration.
- **Proximity Awareness:** Detects user location to provide distance-based context and "center on me" functionality.
- **Polished Detail Cards:** Rich location previews with photos, contact details, and one-click navigation.
- **Smooth Navigation:** Integrated with Google Maps for real-time directions.
- **Centralized Branding:** Easily customize brand name, colors, and category labels in one place.
- **Mobile Optimized:** Fully responsive design that adapts from desktop sidebars to mobile-friendly bottom sheets.

## 🛠️ Tech Stack

- **Framework:** [React 18+](https://reactjs.org/)
- **Styling:** [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Animations:** [Motion](https://motion.dev/)
- **Mapping:** [React Leaflet](https://react-leaflet.js.org/) & [Leaflet](https://leafletjs.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)

## 🚀 Getting Started

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## ⚙️ Customization Guide

### 1. Central Branding & Identity
All branding assets are managed in `src/constants.ts`. Update this file to change the identity of your locator:

```typescript
export const BRAND_CONFIG = {
  name: 'Your Brand Name',
  categories: {
    'Branch': { label: 'Branches', short: 'BRCH' },
    '24/7': { label: 'Self-Service', short: '24/7' },
    'ATM': { label: 'ATMs', short: 'ATMS' }
  },
  colors: {
    primary: '#003B5C',
    secondary: '#00ADC6',
    accent: '#00ADC6',
  }
};
```

### 2. Styling with CSS Variables
Colors are also mirrored as CSS variables in `src/index.css` for use in Tailwind and custom styles:

```css
@theme {
  --color-brand-primary: #003B5C;
  --color-brand-secondary: #00ADC6;
  /* ... */
}
```

### 3. Map Data Integration
Locate360 fetches data from Google My Maps via its **Map ID (MID)**.

- **Dynamic Source:** Append `?mid=YOUR_MAP_ID` to the application URL.
- **Default Source:** Set the default MID in `src/services/locationService.ts` or as an environment variable `VITE_MY_MAP_ID`.

To find your MID:
1. Open your map in [Google My Maps](https://www.google.com/maps/d/).
2. Copy the value after `mid=` in the URL.

### 4. Custom Icons
Markers are generated based on category. To change icons:
1. Add your images to the `public/` directory.
2. Update the `ICON_MAPPING` or equivalent constants in `src/components/MapView.tsx`.

## 📱 User Interface

- **Glassmorphism Header:** Floating search and filter interface with real-time results.
- **Actionable Popups (Desktop):** Custom map popups that auto-pan to remain visible.
- **Bottom Sheet (Mobile):** Slide-up details panel optimized for thumb navigation.
- **Live Stats:** Real-time counters showing location density by category.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
