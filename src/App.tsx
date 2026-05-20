import { useState, useEffect, useMemo, useCallback } from 'react';
import MapView from './components/MapView';
import { Category, UserLocation, Location } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Search, X, Navigation, MapPin } from 'lucide-react';
import { LocationService } from './services/locationService';

import { BRAND_CONFIG } from './constants';

export default function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.5564, 104.9282]); // Default to Phnom Penh
  const [mapZoom, setMapZoom] = useState(13);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const isValidLatLng = (lat: any, lng: any) => {
    return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng);
  };

  useEffect(() => {
    // Fetch dynamic data
    const params = new URLSearchParams(window.location.search);
    const midFromUrl = params.get('mid');
    const MY_MAP_ID = midFromUrl || (import.meta as any).env.VITE_MY_MAP_ID; 
    
    LocationService.fetchLocations(MY_MAP_ID)
      .then(data => {
        setLocations(data);
        if (data.length > 0 && isValidLatLng(data[0].lat, data[0].lng)) {
          setMapCenter([data[0].lat, data[0].lng]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError('Failed to load map data. Please check your Map ID or ensure the map is public.');
        setIsLoading(false);
      });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isValidLatLng(position.coords.latitude, position.coords.longitude)) {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      const loc = locations.find(l => l.id === id);
      if (loc && isValidLatLng(loc.lat, loc.lng)) {
        // Desktop offset to keep marker below floating header
        const isDesktop = window.innerWidth >= 768;
        const latOffset = isDesktop ? 0.003 : 0; // Adjusted for zoom level 16
        setMapCenter([loc.lat + latOffset, loc.lng]);
        setMapZoom(16);
      }
    }
  }, [locations]);

  const centerOnUser = useCallback(() => {
    if (userLocation && isValidLatLng(userLocation.lat, userLocation.lng)) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(15);
    }
  }, [userLocation]);

  const filteredLocations = useMemo(() => {
    const minSearch = searchQuery.toLowerCase().trim();
    if (!minSearch && selectedCategory === 'All') return locations;

    return locations.filter(loc => {
      const matchesSearch = !minSearch || 
                          loc.name.toLowerCase().includes(minSearch) ||
                          loc.address.toLowerCase().includes(minSearch);
      const matchesCategory = selectedCategory === 'All' || loc.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [locations, searchQuery, selectedCategory]);

  const stats = useMemo(() => ({
    branch: locations.filter(l => l.category === 'Branch').length,
    atm: locations.filter(l => l.category === 'ATM').length,
    twentyFourSeven: locations.filter(l => l.category === '24/7').length,
  }), [locations]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Initializing Network...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      {/* Mobile Header (Floating on Map) */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-[2000] pointer-events-none p-4">
        <div className="flex flex-col gap-4">
          {/* Top Bar */}
          <AnimatePresence mode="wait">
            {!isSearchVisible ? (
              <motion.div 
                key="title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 bg-white/95 backdrop-blur-xl px-4 py-3 rounded-[24px] shadow-xl border border-white/50 pointer-events-auto relative h-14 w-full"
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <button className="p-2 -ml-2 text-slate-600 shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <h1 className="text-xl font-bold tracking-tight text-brand-primary truncate">{BRAND_CONFIG.name}</h1>
                </div>
                <button 
                  onClick={() => setIsSearchVisible(true)}
                  className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center active:scale-95 transition-transform border border-slate-100"
                >
                  <Search size={18} className="text-brand-secondary" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="search"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="pointer-events-auto h-14"
              >
                {/* Backdrop for focus */}
                <div 
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[-1]"
                  onClick={() => {
                    setIsSearchVisible(false);
                    setSearchQuery('');
                  }}
                />
                <div className="flex items-center gap-4 bg-slate-500/50 backdrop-blur-xl px-2.5 py-1.5 rounded-[22px] shadow-2xl border border-white/20 h-full relative">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Search size={20} className="text-brand-secondary" />
                  </div>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Find branches or ATMs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[16px] font-bold placeholder:text-white/70 text-white"
                  />
                  <button 
                    onClick={() => {
                      setIsSearchVisible(false);
                      setSearchQuery('');
                    }}
                    className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center text-slate-400 active:scale-90 transition-transform shadow-sm"
                  >
                    <X size={20} />
                  </button>

                  <AnimatePresence>
                    {searchQuery.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white rounded-[32px] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.3)] border border-slate-100/50 overflow-hidden flex flex-col z-[2100]"
                      >
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Results — {filteredLocations.length} locations</span>
                        </div>
                        
                        <div className="overflow-y-auto no-scrollbar max-h-[60vh]">
                          {filteredLocations.length > 0 ? (
                            <div className="py-2">
                              {filteredLocations.slice(0, 10).map((loc) => (
                                <button
                                  key={loc.id}
                                  onClick={() => {
                                    handleSelect(loc.id);
                                    setIsSearchVisible(false);
                                    setSearchQuery('');
                                  }}
                                  className="w-full px-5 py-3.5 hover:bg-slate-50 active:bg-slate-100 flex items-start gap-4 text-left border-b border-slate-50 last:border-0"
                                >
                                <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                                  loc.category === 'Branch' ? 'bg-brand-primary' : 'bg-brand-secondary'
                                }`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[14px] font-bold text-brand-primary truncate tracking-tight">{loc.name}</div>
                                    <div className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">{loc.address}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-10 text-center bg-white">
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching locations</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Pills - Screenshot style */}
          <div className="flex justify-center pointer-events-auto">
            <div className="bg-white p-1 rounded-2xl shadow-xl flex gap-1 w-full max-w-[calc(100vw-48px)] border border-slate-100 h-11 relative overflow-hidden">
              {Object.entries(BRAND_CONFIG.categories).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as Category === selectedCategory ? 'All' : key as Category)}
                  className={`flex-1 relative z-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    selectedCategory === key 
                      ? 'text-white' 
                      : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  {config.label}
                  {selectedCategory === key && (
                    <motion.div 
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-brand-secondary rounded-xl -z-10 shadow-lg shadow-brand-secondary/30"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Floating Cards Layout */}
      <div className="hidden md:flex absolute top-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[1550px] h-16 items-center justify-between gap-4 z-[2000] pointer-events-none">
        
        {/* Block 1: Brand, Search & Filter Unified */}
        <div className="flex-1 max-w-5xl h-full flex items-center gap-6 bg-white/95 backdrop-blur-xl rounded-[24px] shadow-[0_15px_40px_-12px_rgba(0,0,0,0.12)] border border-white/50 px-6 pointer-events-auto">
          <div className="flex items-center gap-3 shrink-0">
            <h1 className="text-xl font-black tracking-tighter text-brand-primary">{BRAND_CONFIG.name}</h1>
          </div>
          <div className="w-[1px] h-8 bg-slate-100 shrink-0" />

          <div className="flex-1 relative">
            <div className="relative group h-11">
              <div className="absolute inset-0 bg-slate-50/50 rounded-2xl group-focus-within:bg-white group-focus-within:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 border border-slate-100" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-secondary transition-colors" />
              <input 
                type="text" 
                placeholder="Find a branch or ATM..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="relative w-full h-full pl-11 pr-10 bg-transparent border-none rounded-2xl text-sm font-bold text-brand-primary focus:outline-none placeholder:text-slate-300"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                  >
                    <X size={12} strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Search Results Popover */}
            <AnimatePresence>
              {searchQuery.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white/98 backdrop-blur-xl rounded-3xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.2)] border border-white/50 overflow-hidden flex flex-col z-[2100]"
                >
                  <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white/50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matched Results — {filteredLocations.length}</span>
                  </div>
                  
                  {filteredLocations.length > 0 ? (
                    <div className="max-h-[380px] overflow-y-auto no-scrollbar py-2">
                      {filteredLocations.slice(0, 8).map((loc, idx) => (
                        <motion.button
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          key={loc.id}
                          onClick={() => {
                            handleSelect(loc.id);
                            setSearchQuery('');
                          }}
                          className="w-full px-5 py-3.5 hover:bg-slate-50/80 flex items-start gap-4 text-left transition-colors border-b border-slate-50 last:border-0 group"
                        >
                          <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 group-hover:scale-150 transition-transform ${
                            loc.category === 'Branch' ? 'bg-brand-primary' : 'bg-brand-secondary'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-brand-primary truncate">{loc.name}</div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">{loc.address}</div>
                          </div>
                          <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            Go to
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">No matches found</div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-[1px] h-8 bg-slate-100 shrink-0" />

          {/* Filter block integrated */}
          <div className="flex items-center gap-1.5">
            {['All', ...Object.keys(BRAND_CONFIG.categories)].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as Category)}
                className={`px-4 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 shrink-0 ${
                  selectedCategory === cat
                  ? 'bg-brand-secondary text-white shadow-lg shadow-brand-secondary/30'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                {cat === 'All' ? 'All' : BRAND_CONFIG.categories[cat as keyof typeof BRAND_CONFIG.categories].label}
              </button>
            ))}
          </div>
        </div>

        {/* Block 2: Location Stats Block */}
        <div className="flex items-center gap-8 bg-white/95 backdrop-blur-xl rounded-[24px] shadow-[0_15px_40px_-12px_rgba(0,0,0,0.12)] border border-white/50 h-full px-8 pointer-events-auto">
          <div className="text-center group min-w-[50px]">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1 transition-colors group-hover:text-brand-primary">{BRAND_CONFIG.categories.Branch.short}</div>
            <div className="text-lg font-black text-brand-primary leading-none tabular-nums tracking-tighter">{stats.branch}</div>
          </div>
          <div className="w-[1px] h-6 bg-slate-100" />
          <div className="text-center group min-w-[50px]">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1 transition-colors group-hover:text-brand-secondary">{BRAND_CONFIG.categories['24/7'].short}</div>
            <div className="text-lg font-black text-brand-secondary leading-none tabular-nums tracking-tighter">{stats.twentyFourSeven}</div>
          </div>
          <div className="w-[1px] h-6 bg-slate-100" />
          <div className="text-center group min-w-[50px]">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1 transition-colors group-hover:text-brand-secondary">{BRAND_CONFIG.categories.ATM.short}</div>
            <div className="text-lg font-black text-brand-secondary leading-none tabular-nums tracking-tighter">{stats.atm}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 relative">
          <MapView
            locations={filteredLocations}
            selectedId={selectedId}
            onSelect={handleSelect}
            center={mapCenter}
            zoom={mapZoom}
          />

          {/* Controls Panel (Vertical on side for mobile) */}
          <div className="absolute right-4 bottom-32 md:bottom-10 md:right-10 z-[2000] flex flex-col gap-3">
            {/* Stats - Vertical List on Mobile */}
            <div className="flex flex-col gap-2 mb-4 md:mb-0 md:hidden">
              <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 flex flex-col items-center">
                <span className="text-[10px] font-black text-brand-primary mb-1">{stats.branch}</span>
                <div className="w-1 h-1 bg-brand-primary rounded-full" />
              </div>
              <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 flex flex-col items-center">
                <span className="text-[10px] font-black text-brand-secondary mb-1">{stats.twentyFourSeven}</span>
                <div className="w-1 h-1 bg-brand-secondary rounded-full" />
              </div>
              <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 flex flex-col items-center">
                <span className="text-[10px] font-black text-brand-secondary mb-1">{stats.atm}</span>
                <div className="w-1 h-1 bg-brand-secondary rounded-full" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button className="h-12 w-12 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-slate-50 border border-slate-200 transition-all">
                <Navigation size={20} className="text-slate-600" />
              </button>
              <AnimatePresence>
                {userLocation && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={centerOnUser}
                    className="h-12 w-12 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-slate-50 border border-slate-200 transition-all group"
                  >
                    <Target size={20} className="text-brand-secondary group-hover:scale-110 transition-transform" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {selectedId && (
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="md:hidden absolute bottom-0 left-0 right-0 z-[3000] p-4 pt-0"
              >
                {(() => {
                  const loc = locations.find(l => l.id === selectedId);
                  if (!loc) return null;
                  return (
                    <div className="bg-white rounded-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.15)] overflow-hidden border border-white/50 flex flex-col p-6 gap-6 relative max-w-lg mx-auto">
                      {/* Pull Indicator */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 bg-slate-200 rounded-full" />
                      
                      <div className="flex gap-6 items-start">
                        <div className="flex-1 min-w-0 pt-1">
                          <h2 className="text-[22px] font-extrabold text-brand-primary leading-tight tracking-tight mb-2">{loc.name}</h2>
                          <div className="flex items-start gap-2 text-slate-500">
                             <MapPin size={14} className="text-brand-secondary mt-0.5 shrink-0" />
                            <p className="text-sm leading-relaxed font-semibold text-slate-600 line-clamp-3">{loc.address}</p>
                          </div>
                        </div>
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden shrink-0 relative shadow-inner ring-1 ring-slate-100">
                          <img 
                            src={loc.photo} 
                            alt={loc.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400') {
                                target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400';
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          <div className="absolute bottom-1.5 right-1.5 bg-brand-secondary text-white px-1.5 py-0.5 rounded-md shadow-sm">
                             <span className="text-[8px] font-black tracking-tighter uppercase">{BRAND_CONFIG.categories[loc.category as keyof typeof BRAND_CONFIG.categories]?.label || loc.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank')}
                          className="flex-1 h-14 bg-brand-secondary text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-secondary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-secondary/30 active:scale-[0.97]"
                        >
                          <Navigation size={15} fill="currentColor" />
                          Get Directions
                        </button>
                        <button 
                          onClick={() => setSelectedId(null)}
                          className="px-6 h-14 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-[0.97]"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
