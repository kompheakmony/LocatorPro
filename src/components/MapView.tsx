import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl, Popup } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Building2, Clock, Landmark, MapPin, Navigation, X } from 'lucide-react';
import { Location, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  'Branch': <Landmark size={20} />,
  '24/7': <Clock size={20} />,
  'ATM': <Building2 size={20} />
};

const createCustomIcon = (category: Category, isActive: boolean) => {
  const categoryClass = category === 'Branch' ? 'marker-branch' : 
                       category === '24/7' ? 'marker-247' : 'marker-atm';
  
  const html = renderToStaticMarkup(
    <div className={`custom-marker ${categoryClass} ${isActive ? 'active' : ''} h-9 w-9`}>
      <div className="scale-75">
        {CATEGORY_ICONS[category]}
      </div>
    </div>
  );
  return L.divIcon({
    html,
    className: 'custom-div-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, zoom, map]);
  return null;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

interface MapViewProps {
  locations: Location[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  center: [number, number];
  zoom: number;
}

export default function MapView({ locations, selectedId, onSelect, center, zoom }: MapViewProps) {
  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        className="h-full w-full"
      >
        <InvalidateSize />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />
        
        {locations.map((loc) => {
          const isSelected = selectedId === loc.id;
          
          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={createCustomIcon(loc.category, isSelected)}
              eventHandlers={{
                click: () => onSelect(loc.id),
              }}
            >
              <PopupWrapper onSelect={onSelect} loc={loc} />
            </Marker>
          );
        })}

        <MapUpdater center={center} zoom={zoom} />
      </MapContainer>
    </div>
  );
}

function PopupWrapper({ onSelect, loc }: { onSelect: (id: string) => void, loc: Location }) {
  const map = useMap();
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.closePopup();
    onSelect('');
  };

  return (
    <Popup keepInView minWidth={320} offset={[0, -10]}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-80 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
      >
        <div className="relative h-44">
          <img 
            src={loc.photo} 
            alt={loc.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 h-8 w-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-2 inline-block ${
              loc.category === 'Branch' ? 'bg-blue-500 text-white' :
              loc.category === '24/7' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}>
              {loc.category}
            </span>
            <h3 className="text-lg font-bold text-white leading-tight">{loc.name}</h3>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">{loc.address}</p>
          </div>

          <div className="pt-2 flex gap-2">
            <button className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
              <Navigation size={14} fill="currentColor" />
              Get Directions
            </button>
            <button 
              onClick={handleClose}
              className="h-11 px-4 border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </Popup>
  );
}

