import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, X, Phone } from 'lucide-react';
import { Location, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';


const ICON_URLS: Record<Category, string> = {
  'Branch': '/Branch.png',
  '24/7': '/24-7.png',
  'ATM': '/ATM.png'
};

const ICON_CACHE: Record<string, L.Icon> = {};

const getCustomIcon = (category: Category, isActive: boolean) => {
  const key = `${category}-${isActive}`;
  if (ICON_CACHE[key]) return ICON_CACHE[key];

  const size: [number, number] = [32, 38];
  const icon = L.icon({
    iconUrl: ICON_URLS[category],
    iconSize: size,
    iconAnchor: [16, 19],
    popupAnchor: [0, -19],
    className: `custom-marker ${isActive ? 'active' : ''}`
  });
  
  ICON_CACHE[key] = icon;
  return icon;
};

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, {
        duration: 0.8,
        easeLinearity: 0.25
      });
    }
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

function MapClickHandler({ onDeselect }: { onDeselect: () => void }) {
  const map = useMap();
  useEffect(() => {
    map.on('click', () => {
      onDeselect();
    });
  }, [map, onDeselect]);
  return null;
}

interface MarkerWithAutoPopupProps {
  key?: string | number;
  loc: Location;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isMobile: boolean;
}

const MarkerWithAutoPopup = React.memo(({ loc, isSelected, onSelect, isMobile }: MarkerWithAutoPopupProps) => {
  const markerRef = React.useRef<L.Marker>(null);

  useEffect(() => {
    if (isSelected && markerRef.current && !isMobile) {
      markerRef.current.openPopup();
    }
  }, [isSelected, isMobile]);

  return (
    <Marker
      ref={markerRef}
      position={[loc.lat, loc.lng]}
      icon={getCustomIcon(loc.category, isSelected)}
      eventHandlers={{
        click: () => onSelect(loc.id),
      }}
    >
      {!isMobile && <PopupWrapper onSelect={onSelect} loc={loc} />}
    </Marker>
  );
});

export default function MapView({ locations, selectedId, onSelect, center, zoom }: MapViewProps) {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const safeCenter: [number, number] = (center && !isNaN(center[0]) && !isNaN(center[1])) ? center : [11.5564, 104.9282];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={safeCenter}
        zoom={zoom}
        zoomControl={false}
        className="h-full w-full"
      >
        <InvalidateSize />
        <MapClickHandler onDeselect={() => onSelect('')} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomleft" />
        
        {React.useMemo(() => locations.filter(loc => typeof loc.lat === 'number' && typeof loc.lng === 'number' && !isNaN(loc.lat) && !isNaN(loc.lng)).map((loc) => (
          <MarkerWithAutoPopup
            key={loc.id}
            loc={loc}
            isSelected={selectedId === loc.id}
            onSelect={onSelect}
            isMobile={isMobile}
          />
        )), [locations, selectedId, onSelect, isMobile])}

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
    <Popup 
      keepInView 
      minWidth={340} 
      offset={[0, -10]}
      autoPan={true}
      autoPanPadding={[50, 140]}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-[340px] bg-white rounded-[32px] shadow-[0_30px_90px_-20px_rgba(0,59,92,0.25)] overflow-hidden border border-white/50 flex flex-col"
      >
        {/* Header Image Area */}
        <div className="relative h-40 group">
          <img 
            src={loc.photo} 
            alt={loc.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#003B5C]/90 via-[#003B5C]/30 to-transparent" />
          
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 h-9 w-9 bg-black/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
          >
            <X size={18} strokeWidth={2.5} />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full ${
                loc.category === 'Branch' ? 'bg-[#003B5C] text-white' :
                loc.category === '24/7' ? 'bg-[#00ADC6] text-white shadow-lg shadow-[#00ADC6]/30' : 
                'bg-slate-900 text-white'
              }`}>
                {loc.category}
              </span>
            </div>
            <h3 className="text-lg font-black text-white leading-tight tracking-tight">{loc.name}</h3>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5 bg-white">
          <div className="space-y-4">
            <div className="flex items-center gap-4 group">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-[#00ADC6]/10 transition-colors">
                <MapPin size={16} className="text-[#00ADC6]" />
              </div>
              <p className="flex-1 text-[11px] text-[#003B5C]/80 leading-relaxed font-bold">{loc.address}</p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <Phone size={18} className="text-[#00ADC6]" />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Call Center</div>
                  <div className="text-[11px] font-black text-[#003B5C]">1800 203 203</div>
                </div>
                <div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mobile</div>
                  <div className="text-[11px] font-black text-[#003B5C]">098 203 333</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button 
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank')}
              className="flex-1 h-12 bg-[#00ADC6] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0096AD] shadow-[0_8px_20px_-8px_rgba(0,173,198,0.5)] transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              <Navigation size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              Direction
            </button>
          </div>
        </div>
      </motion.div>
    </Popup>
  );
}

