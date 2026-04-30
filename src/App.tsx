import { useState, useEffect } from 'react';
import MapView from './components/MapView';
import { Category, UserLocation, Location } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Search, X } from 'lucide-react';
import { LocationService } from './services/locationService';

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

  useEffect(() => {
    // Fetch dynamic data
    const MY_MAP_ID = import.meta.env.VITE_MY_MAP_ID; 
    
    LocationService.fetchLocations(MY_MAP_ID)
      .then(data => {
        setLocations(data);
        if (data.length > 0) {
          setMapCenter([data[0].lat, data[0].lng]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError('Failed to load map data. Please check your Map ID or connectivity.');
        setIsLoading(false);
      });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    if (id) {
      const loc = locations.find(l => l.id === id);
      if (loc) {
        setMapCenter([loc.lat, loc.lng]);
        setMapZoom(15);
      }
    }
  };

  const centerOnUser = () => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(15);
    }
  };

  const filteredLocations = locations.filter(loc => {
    const minSearch = searchQuery.toLowerCase();
    const matchesSearch = loc.name.toLowerCase().includes(minSearch) ||
                        loc.address.toLowerCase().includes(minSearch);
    const matchesCategory = selectedCategory === 'All' || loc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    branch: locations.filter(l => l.category === 'Branch').length,
    atm: locations.filter(l => l.category === 'ATM').length,
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Initializing Network...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 z-[2000]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Target size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">LocatorPro</h1>
        </div>
        
        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[3000] w-full max-w-sm px-4">
            <div className="bg-red-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="bg-black/10 p-1.5 rounded-lg">
                  <Target size={14} className="text-white" />
                </div>
                <p className="text-[11px] font-bold tracking-tight">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        
        <div className="flex-1 max-w-xl px-12">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by city, branch name or address..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            {(['All', 'Branch', '24/7', 'ATM'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                  selectedCategory === cat
                  ? 'bg-blue-600 border-blue-700 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="h-8 w-[1px] bg-slate-100" />
          <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 relative">
          <MapView
            locations={filteredLocations}
            selectedId={selectedId}
            onSelect={handleSelect}
            center={mapCenter}
            zoom={mapZoom}
          />

          {/* User Location Button */}
          <div className="absolute bottom-8 right-8 z-[2000]">
            <AnimatePresence>
              {userLocation && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={centerOnUser}
                  className="h-12 w-12 bg-white rounded-xl shadow-2xl flex items-center justify-center hover:bg-slate-50 border border-slate-200 transition-all group"
                  title="Current Location"
                >
                  <Target size={20} className="text-slate-900 group-hover:scale-110 transition-transform" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Statistics Overlay */}
          <div className="absolute top-8 right-8 z-[2000] p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl flex gap-10">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Branches</div>
              <div className="text-xl font-bold text-blue-600 leading-none">{stats.branch}</div>
            </div>
            <div className="text-center pl-10">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">ATMs</div>
              <div className="text-xl font-bold text-amber-600 leading-none">{stats.atm}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
