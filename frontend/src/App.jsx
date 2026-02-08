
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminPanel from './components/AdminPanel';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import {
    ParkingCircle,
    Map as MapIcon,
    LayoutDashboard,
    Calendar,
    Settings,
    Clock,
    ChevronRight,
    TrendingUp,
    Info,
    Star,
    Search,
    LogIn,
    LogOut,
    User as UserIcon,
    ShieldCheck,
    CalendarPlus,
    Trash2,
    BarChart,
    Navigation2,
    MapPin,
    Menu,
    X,
    CreditCard,
    History,
    Home
} from 'lucide-react';
import { format, addHours } from 'date-fns';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { GoogleLogin } from '@react-oauth/google';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
    // Theme State
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

    // Theme Effect
    // Theme Effect - Robust Handling
    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = () => {
            const isDark = theme === 'dark' ||
                (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

            if (isDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme();

        // Persist to LocalStorage safely
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            console.error('Failed to save theme preference:', e);
        }

        // Listen for system changes if in system mode
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme();

            // Modern addEventListener
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange);
                return () => mediaQuery.removeEventListener('change', handleChange);
            }
            // Fallback for older browsers
            else {
                mediaQuery.addListener(handleChange);
                return () => mediaQuery.removeListener(handleChange);
            }
        }
    }, [theme]);

    const [zones, setZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [events, setEvents] = useState([]);
    const [timeOffset, setTimeOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('dashboard'); // 'dashboard', 'map', 'events', 'admin'
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [favorites, setFavorites] = useState([]);
    const [batchPredictions, setBatchPredictions] = useState({}); // zone_id -> predicted_availability
    const [history, setHistory] = useState(null);
    const [userLocation, setUserLocation] = useState(null); // { lat, lng }
    const [authLoading, setAuthLoading] = useState(!!localStorage.getItem('token'));

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // Live Location Tracking
    useEffect(() => {
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.error("Error getting location", error),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetchZones();
            fetchEvents();
            const init = async () => {
                setAuthLoading(true);
                await Promise.all([fetchFavorites(), fetchUserProfile(token)]);
                setAuthLoading(false);
            };
            init();
        } else {
            setAuthLoading(false);
        }
    }, [token]);

    const fetchUserProfile = async (tokenToUse) => {
        const activeToken = tokenToUse || token;
        if (!activeToken) return;
        try {
            const resp = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            setUser(resp.data);
        } catch (err) {
            console.error("Error fetching user profile", err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            }
        }
    };

    useEffect(() => {
        if (timeOffset > 0 && token) {
            fetchBatchPredictions();
        } else {
            setBatchPredictions({});
        }
    }, [timeOffset, token]);

    const fetchBatchPredictions = async () => {
        try {
            const time = addHours(new Date(), timeOffset).toISOString();
            const zone_ids = zones.map(z => z.zone_id);

            const resp = await axios.post(`${API_BASE_URL}/api/v1/predictions/batch`, {
                zone_ids,
                time
            });

            const predMap = {};
            resp.data.predictions.forEach(p => {
                predMap[p.zone_id] = p.predicted_availability;
            });
            setBatchPredictions(predMap);
        } catch (err) {
            console.error("Error fetching batch predictions", err);
        }
    };

    const fetchFavorites = async () => {
        try {
            const resp = await axios.get(`${API_BASE_URL}/api/v1/users/favorites`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFavorites(resp.data);
        } catch (err) {
            console.error("Error fetching favorites", err);
        }
    };

    const toggleFavorite = async (zoneId) => {
        try {
            await axios.post(`${API_BASE_URL}/api/v1/users/favorites`, null, {
                params: { zone_id: zoneId },
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFavorites();
        } catch (err) {
            console.error("Error toggling favorite", err);
        }
    };

    const fetchZones = async () => {
        try {
            const resp = await axios.get(`${API_BASE_URL}/api/v1/zones`);
            setZones(resp.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching zones", err);
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const resp = await axios.get(`${API_BASE_URL}/api/v1/events`);
            setEvents(resp.data);
        } catch (err) {
            console.error("Error fetching events", err);
        }
    };

    const fetchPrediction = async (zoneId, offset = 0) => {
        try {
            const time = offset === 0 ? null : addHours(new Date(), offset).toISOString();
            const resp = await axios.get(`${API_BASE_URL}/api/v1/zones/${zoneId}/prediction`, {
                params: { time }
            });
            setPrediction(resp.data);
        } catch (err) {
            console.error("Error fetching prediction", err);
        }
    };

    const fetchHistory = async (zoneId) => {
        try {
            const resp = await axios.get(`${API_BASE_URL}/api/v1/zones/${zoneId}/history`);
            setHistory(resp.data);
        } catch (err) {
            console.error("Error fetching history", err);
        }
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        setView('dashboard');
    };

    const handleZoneClick = (zone) => {
        setSelectedZone(zone);
        fetchPrediction(zone.zone_id, timeOffset);
        fetchHistory(zone.zone_id);
    };

    const handleTimeChange = (offset) => {
        setTimeOffset(offset);
        if (selectedZone) {
            fetchPrediction(selectedZone.zone_id, offset);
        }
    };

    const getMarkerColor = (availability) => {
        if (availability > 60) return '#10B981'; // Green
        if (availability > 30) return '#F59E0B'; // Yellow
        return '#EF4444'; // Red
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const getNearbyAlternatives = (currentZone) => {
        return zones
            .filter(z => z.zone_id !== currentZone.zone_id)
            .map(z => ({
                ...z,
                distance: calculateDistance(currentZone.latitude, currentZone.longitude, z.latitude, z.longitude),
                predicted_availability: batchPredictions[z.zone_id] ?? z.current_availability
            }))
            .filter(z => z.distance < 1.0) // within 1km
            .sort((a, b) => b.predicted_availability - a.predicted_availability)
            .slice(0, 2);
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const mapContainerStyle = {
        width: '100%',
        height: '100%'
    };

    const center = {
        lat: 23.0225,
        lng: 72.5714
    };

    const lightMapStyle = [
        { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#f8fafc" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#334155" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#334155" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#f1f5f9" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#10b981" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }, { strokeWeight: 2 }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#e2e8f0" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#eff6ff" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#2563eb" }],
        },
    ];

    // --- Dedicated Auth Page Check ---
    if (!token && !authLoading) {
        return <AuthPage setToken={setToken} setUser={setUser} />;
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden font-inter pb-16 md:pb-0 transition-colors duration-300">
            {/* Sidebar (Desktop Only) */}
            <aside className="hidden md:flex w-64 border-r border-slate-100 dark:border-slate-800 flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="p-6 flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
                        <ParkingCircle size={24} />
                    </div>
                    <span className="text-xl font-bold font-outfit tracking-tight">SmartPark AI</span>
                </div>

                <nav className="mt-8 flex-1 px-4 space-y-1">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active={view === 'dashboard'}
                        onClick={() => setView('dashboard')}
                    />
                    <NavItem
                        icon={<MapIcon size={20} />}
                        label="Live Map"
                        active={view === 'map'}
                        onClick={() => setView('map')}
                    />
                    <NavItem
                        icon={<Calendar size={20} />}
                        label="Events"
                        active={view === 'events'}
                        onClick={() => setView('events')}
                    />
                    <NavItem
                        icon={<Settings size={20} />}
                        label="Settings"
                        active={view === 'settings'}
                        onClick={() => setView('settings')}
                    />
                    {user?.is_admin && (
                        <NavItem
                            icon={<ShieldCheck size={20} />}
                            label="Admin AI"
                            active={view === 'admin'}
                            onClick={() => setView('admin')}
                        />
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 m-4 rounded-2xl bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{user?.name}</p>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{user?.is_admin ? 'Admin' : 'Driver'}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation (Mobile Only) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 h-16 flex items-center justify-around z-50 pb-safe">
                <MobileNavItem icon={<Home size={24} />} label="Home" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                <MobileNavItem icon={<MapIcon size={24} />} label="Map" active={view === 'map'} onClick={() => setView('map')} />
                <MobileNavItem icon={<Calendar size={24} />} label="Events" active={view === 'events'} onClick={() => setView('events')} />
                <MobileNavItem icon={<Settings size={24} />} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
                {user?.is_admin && (
                    <MobileNavItem icon={<ShieldCheck size={24} />} label="Admin" active={view === 'admin'} onClick={() => setView('admin')} />
                )}
                <button onClick={handleLogout} className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-red-500">
                    <LogOut size={24} />
                    <span className="text-[10px] font-bold mt-1">Logout</span>
                </button>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
                {/* Header */}
                <header className="h-14 md:h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-3 md:px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
                    <div className="flex md:hidden items-center gap-2 flex-1">
                        <div className="p-1.5 bg-primary rounded-lg text-white shadow-sm">
                            <ParkingCircle size={18} />
                        </div>
                        <span className="text-base font-bold font-outfit text-slate-900 dark:text-white truncate">SmartPark AI</span>
                    </div>

                    <div className="relative w-full max-w-md z-50 flex-1 md:flex-initial mx-2 md:mx-0">
                        <div className="flex items-center gap-2 md:gap-4 bg-slate-50 dark:bg-slate-900 px-3 md:px-4 py-2 md:py-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 w-full group focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                            <Search size={16} className="text-slate-400 group-focus-within:text-primary transition-colors shrink-0" />
                            <input
                                type="text"
                                placeholder="Search zones..."
                                className="bg-transparent border-none focus:outline-none text-xs md:text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (e.target.value.length > 0) {
                                        const term = e.target.value.toLowerCase();
                                        const results = zones.filter(z =>
                                            z.zone_name.toLowerCase().includes(term) ||
                                            z.district.toLowerCase().includes(term)
                                        );
                                        setSearchResults(results);
                                        setShowSearchDropdown(true);
                                    } else {
                                        setShowSearchDropdown(false);
                                    }
                                }}
                                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                                onFocus={() => searchTerm.length > 0 && setShowSearchDropdown(true)}
                            />
                            {searchTerm && (
                                <button onClick={() => { setSearchTerm(''); setShowSearchDropdown(false); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Search Dropdown */}
                        {showSearchDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
                                {searchResults.length > 0 ? (
                                    searchResults.map(result => (
                                        <button
                                            key={result.zone_id}
                                            onClick={() => {
                                                handleZoneClick(result);
                                                setSearchTerm('');
                                                setShowSearchDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 flex items-center justify-between group"
                                        >
                                            <div>
                                                <div className="text-xs md:text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{result.zone_name}</div>
                                                <div className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 font-medium">{result.district}</div>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-slate-400 text-[10px] md:text-xs font-medium italic">
                                        No zones found matching "{searchTerm}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 ml-auto md:ml-0">
                        <div className="flex bg-slate-50 dark:bg-slate-900 p-1 md:p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
                            <TimeFilterBtn active={timeOffset === 0} onClick={() => handleTimeChange(0)}>Now</TimeFilterBtn>
                            <TimeFilterBtn active={timeOffset === 1} onClick={() => handleTimeChange(1)}>+1h</TimeFilterBtn>
                            <TimeFilterBtn active={timeOffset === 2} onClick={() => handleTimeChange(2)}>+2h</TimeFilterBtn>
                            <TimeFilterBtn active={timeOffset === 4} onClick={() => handleTimeChange(4)}>+4h</TimeFilterBtn>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <Clock size={14} className="text-primary hidden md:block" />
                            <span className="whitespace-nowrap">{format(addHours(new Date(), timeOffset), 'h:mm a')}</span>
                            <span className="hidden md:block">, {format(addHours(new Date(), timeOffset), 'MMM d')}</span>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {view === 'admin' && user?.is_admin ? (
                        <AdminPanel token={token} />
                    ) : view === 'admin' ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-red-100">
                                <ShieldCheck size={40} />
                            </div>
                            <h3 className="text-2xl font-black font-outfit text-slate-900 mb-2">Access Restricted</h3>
                            <p className="text-slate-500 font-medium max-w-sm">This secure management console is reserved for city parking personnel with administrative level clearance.</p>
                            <button
                                onClick={() => setView('dashboard')}
                                className="mt-8 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-slate-200"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    ) : view === 'settings' ? (
                        <SettingsView theme={theme} setTheme={setTheme} user={user} />
                    ) : view === 'events' ? (
                        <EventsView
                            events={events}
                            onZoneSelect={(z) => { setView('dashboard'); handleZoneClick(z); }}
                            user={user}
                            token={token}
                            onRefresh={fetchEvents}
                        />
                    ) : view === 'map' ? (
                        <div className="flex-1 relative bg-slate-50 overflow-hidden h-full">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={center}
                                    zoom={13}
                                    options={{
                                        styles: lightMapStyle,
                                        disableDefaultUI: true,
                                        zoomControl: true,
                                    }}
                                >
                                    {zones.map(zone => {
                                        const currentAvailability = batchPredictions[zone.zone_id] ?? zone.current_availability;
                                        return (
                                            <MarkerF
                                                key={zone.zone_id}
                                                position={{ lat: zone.latitude, lng: zone.longitude }}
                                                icon={{
                                                    path: window.google ? window.google.maps.SymbolPath.CIRCLE : 0,
                                                    fillColor: getMarkerColor(currentAvailability),
                                                    fillOpacity: 1,
                                                    strokeWeight: 2,
                                                    strokeColor: '#FFFFFF',
                                                    scale: selectedZone?.zone_id === zone.zone_id ? 14 : 10,
                                                }}
                                                onClick={() => handleZoneClick(zone)}
                                            />
                                        );
                                    })}
                                    {selectedZone && (
                                        <InfoWindowF
                                            position={{ lat: selectedZone.latitude, lng: selectedZone.longitude }}
                                            onCloseClick={() => setSelectedZone(null)}
                                        >
                                            <div className="text-slate-900 p-2 min-w-[150px]">
                                                <h3 className="font-bold border-b pb-1 mb-1">{selectedZone.zone_name}</h3>
                                                <p className="text-sm">Available: {selectedZone.current_availability?.toFixed(0)}%</p>
                                                <button
                                                    className="mt-2 text-xs bg-primary text-white px-3 py-1.5 rounded-lg w-full font-bold shadow-lg shadow-primary/20"
                                                    onClick={() => { setView('dashboard'); handleZoneClick(selectedZone); }}
                                                >
                                                    View Analytics
                                                </button>
                                            </div>
                                        </InfoWindowF>
                                    )}
                                </GoogleMap>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">Loading Map...</div>
                            )}
                        </div>
                    ) : (
                        // Default Dashboard View (Map + Panel)
                        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                            {/* Map Section - Mobile: Hidden when Zone Selected, Desktop: Always visible */}
                            <div className={`flex-1 bg-slate-50 dark:bg-slate-950 relative ${selectedZone ? 'hidden md:block' : 'block'}`}>
                                {!isLoaded ? (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={selectedZone ? { lat: selectedZone.latitude, lng: selectedZone.longitude } : (userLocation || center)}
                                        zoom={14}
                                        options={{
                                            styles: lightMapStyle, // You might want to switch this to dark style in dark mode, but keeping simple for now
                                            disableDefaultUI: true,
                                            zoomControl: true,
                                        }}
                                    >
                                        {/* Live User Location Marker */}
                                        {userLocation && (
                                            <MarkerF
                                                position={userLocation}
                                                icon={{
                                                    path: "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-3.002,8.51c-0.598,0-5.408-1.359-9.643-1.359c-3.175,0-5.322,0.922-5.748,1.487l-0.203-7.989l0.552-3.649 C5.224,5.245,7.979,4.428,11.391,4.428C14.803,4.428,17.558,5.245,20.625,10.773z M1.996,14.188l2.729,7.21v4.806L1.996,25.853 V14.188z M11.454,42.068c-2.414,0-6.178-0.899-6.938-1.554l-0.589-8.471h15.222l-0.589,8.471 C18.348,41.144,13.869,42.068,11.454,42.068z",
                                                    fillColor: "#3B82F6",
                                                    fillOpacity: 1,
                                                    strokeWeight: 1,
                                                    strokeColor: "#ffffff",
                                                    rotation: 0,
                                                    scale: 0.6,
                                                    anchor: { x: 11.5, y: 21 },
                                                }}
                                                zIndex={100}
                                            />
                                        )}
                                        {zones.map(zone => (
                                            <MarkerF
                                                key={zone.zone_id}
                                                position={{ lat: zone.latitude, lng: zone.longitude }}
                                                icon={{
                                                    path: window.google ? window.google.maps.SymbolPath.CIRCLE : 0,
                                                    fillColor: getMarkerColor(zone.current_availability),
                                                    fillOpacity: 1,
                                                    strokeWeight: 2,
                                                    strokeColor: '#FFFFFF',
                                                    scale: selectedZone?.zone_id === zone.zone_id ? 14 : 10,
                                                }}
                                                onClick={() => handleZoneClick(zone)}
                                            />
                                        ))}
                                    </GoogleMap>
                                )}

                                {/* Map Legend Overlay */}
                                <div className="absolute bottom-6 left-6 z-[10] bg-white/90 dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none backdrop-blur-md hidden md:block">
                                    <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-4">Live Availability</h4>
                                    <div className="flex flex-col gap-3">
                                        <LegendItem color="#10B981" label="High (>60%)" />
                                        <LegendItem color="#F59E0B" label="Medium (30-60%)" />
                                        <LegendItem color="#EF4444" label="Low (<30%)" />
                                    </div>
                                </div>
                            </div>

                            {/* Details Panel - Mobile Full Screen on Selection */}
                            <aside className={`w-full md:w-[400px] border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar ${selectedZone ? 'block fixed inset-0 z-20 md:relative md:inset-auto' : 'hidden md:block'}`}>
                                {selectedZone ? (
                                    <div className="p-8 h-full flex flex-col">
                                        <button
                                            onClick={() => setSelectedZone(null)}
                                            className="md:hidden self-start mb-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-900 dark:text-white"
                                        >
                                            <ChevronRight size={24} className="rotate-180" />
                                        </button>

                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <h2 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white leading-tight">{selectedZone.zone_name}</h2>
                                                    <button
                                                        onClick={() => toggleFavorite(selectedZone.zone_id)}
                                                        className={`p-1 transition-all ${favorites.some(f => f.zone_id === selectedZone.zone_id) ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
                                                    >
                                                        <Star size={20} className={favorites.some(f => f.zone_id === selectedZone.zone_id) ? "fill-amber-400" : ""} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <MapPin size={13} className="text-primary" />
                                                    <span className="text-[13px] font-medium">{selectedZone.district}</span>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${prediction?.availability_level === 'high' ? 'bg-emerald-500 text-white' :
                                                prediction?.availability_level === 'medium' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                                                }`}>
                                                {prediction?.availability_level || 'Checking'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <StatCard
                                                label="Availability"
                                                value={`${prediction?.predicted_availability?.toFixed(0) || selectedZone.current_availability?.toFixed(0)}%`}
                                                subValue={`${selectedZone.total_capacity} spots`}
                                                icon={<ParkingCircle size={18} className="text-primary" />}
                                            />
                                            <StatCard
                                                label="Confidence"
                                                value={`${prediction?.confidence_score?.toFixed(0) || 85}%`}
                                                subValue="AI Certainty"
                                                icon={<TrendingUp size={18} className="text-emerald-500" />}
                                            />
                                        </div>

                                        <div className="mb-6 flex-1">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                                <BarChart size={16} className="text-slate-400" />
                                                Historical Insights
                                            </h3>
                                            <div className="h-44 w-full bg-white dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-slate-800 mb-4">
                                                {prediction?.trend && <PredictionChart data={prediction.trend} />}
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <Navigation2 size={16} className="text-slate-400" />
                                                Nearby Alternatives
                                            </h3>
                                            {(() => {
                                                const alts = zones
                                                    .filter(z => z.zone_id !== selectedZone.zone_id && z.district === selectedZone.district)
                                                    .sort((a, b) => (b.current_availability || 0) - (a.current_availability || 0))
                                                    .slice(0, 2);

                                                if (alts.length === 0) return <div className="text-xs text-slate-400 italic">No alternatives in this district.</div>;

                                                return (
                                                    <div className="space-y-3 pt-2">
                                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Better Options in {selectedZone.district}</h4>
                                                        {alts.map(alt => (
                                                            <button
                                                                key={alt.zone_id}
                                                                onClick={() => handleZoneClick(alt)}
                                                                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary hover:shadow-md transition-all text-left group"
                                                            >
                                                                <div>
                                                                    <div className="text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{alt.zone_name}</div>
                                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{alt.district}</div>
                                                                </div>
                                                                <div className={`text-xs font-bold px-2 py-1 rounded ${(alt.current_availability || 0) > 60 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                                    }`}>
                                                                    {(alt.current_availability || 0).toFixed(0)}%
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <button
                                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedZone.latitude},${selectedZone.longitude}`, '_blank')}
                                            className="w-full mt-auto bg-primary hover:bg-primary-dark text-white font-bold py-3 md:py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-xs md:text-sm tracking-wide mb-20 md:mb-0 transform active:scale-[0.98]"
                                        >
                                            Navigate to Zone <ChevronRight size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                                        <MapIcon size={48} className="mb-4 opacity-20" />
                                        <h3 className="text-lg font-bold text-slate-300">Select a Zone</h3>
                                        <p className="text-sm mt-2">Click on a marker on the map to see real-time availability and AI predictions.</p>
                                    </div>
                                )}
                            </aside>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function AuthPage({ setToken, setUser }) {
    const [authMode, setAuthMode] = useState('login');

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = new URLSearchParams(formData);

        try {
            const resp = await axios.post(`${API_BASE_URL}/api/v1/users/login`, data);
            const newToken = resp.data.access_token;
            localStorage.setItem('token', newToken); // Persist

            // Immediately fetch user profile
            const profileResp = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
                headers: { Authorization: `Bearer ${newToken}` }
            });

            setUser(profileResp.data);
            setToken(newToken); // Triggers main app render
        } catch (err) {
            alert("Login failed. Check your credentials.");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());

        try {
            await axios.post(`${API_BASE_URL}/api/v1/users/register`, payload);
            alert("Registration successful! Please login.");
            setAuthMode('login');
        } catch (err) {
            alert(err.response?.data?.detail || "Registration failed");
        }
    };

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const resp = await axios.post(`${API_BASE_URL}/api/v1/users/google-login`, {
                token: credentialResponse.credential
            });
            const newToken = resp.data.access_token;
            localStorage.setItem('token', newToken);

            // Immediately fetch user profile
            const profileResp = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
                headers: { Authorization: `Bearer ${newToken}` }
            });

            setUser(profileResp.data);
            setToken(newToken);
        } catch (err) {
            console.error("Google Login Failed", err);
            alert("Google Login failed. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 font-inter dark:from-slate-950 dark:to-slate-900">
            <div className="bg-white dark:bg-slate-950 w-full max-w-md p-6 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-500 overflow-hidden">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 shadow-sm">
                        <ParkingCircle size={40} />
                    </div>
                    <h1 className="text-4xl font-black font-outfit text-slate-900 mb-2 tracking-tight">
                        {authMode === 'login' ? 'Welcome Back' : 'Get Started'}
                    </h1>
                    <p className="text-slate-400 font-medium text-lg">SmartPark AI Urban Mobility</p>

                    <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-2xl text-left animate-pulse">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 text-center">Admin Evaluation Login</p>
                        <div className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            <span>Email: <code className="text-primary italic">admin@smartpark.ai</code></span>
                            <span>Pass: <code className="text-primary italic">password123</code></span>
                        </div>
                    </div>
                </div>

                <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-6">
                    {authMode === 'register' && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                            <input
                                name="name"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-300 font-medium"
                                placeholder="John Doe"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                        <input
                            name={authMode === 'login' ? "username" : "email"}
                            type="email"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-300 font-medium"
                            placeholder="name@company.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-300 font-medium"
                        />
                    </div>
                    {authMode === 'register' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">State</label>
                                    <input name="state" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="State" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Country</label>
                                    <input name="country" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="Country" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Pincode</label>
                                <input name="pincode" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="123456" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Full Address</label>
                                <input name="address_line" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="Building, Street, Area" />
                            </div>
                        </>
                    )}

                    <button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl mt-6 transition-all shadow-xl shadow-primary/20 text-sm uppercase tracking-widest transform active:scale-95">
                        {authMode === 'login' ? 'Access Dashboard' : 'Create Profile'}
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Or Continue With</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleLogin}
                            onError={() => {
                                console.log('Login Failed');
                            }}
                            useOneTap
                            theme="filled_blue"
                            shape="pill"
                            width="350"
                        />
                    </div>
                </form>

                <p className="text-center text-slate-400 text-sm mt-8 font-medium">
                    {authMode === 'login' ? (
                        <>New here? <span onClick={() => setAuthMode('register')} className="text-primary hover:text-primary-dark cursor-pointer font-bold ml-1 transition-colors">Apply for Access</span></>
                    ) : (
                        <>Have an account? <span onClick={() => setAuthMode('login')} className="text-primary hover:text-primary-dark cursor-pointer font-bold ml-1 transition-colors">Sign In</span></>
                    )}
                </p>
            </div>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-5 py-3 transition-all rounded-lg group ${active ? 'bg-white text-primary border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}>
            <div className={`transition-colors ${active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {icon}
            </div>
            <span className="text-sm font-bold tracking-tight">{label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
        </button>
    );
}

function MobileNavItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${active ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <div className={`mb-1 transition-transform ${active ? 'scale-110' : ''}`}>
                {icon}
            </div>
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    );
}

function TimeFilterBtn({ children, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 md:min-w-[60px] px-2 md:px-4 py-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
        >
            {children}
        </button>
    );
}

// ... EventsView, StatCard, LegendItem, PredictionChart (unchanged) ...
function EventsView({ events, onZoneSelect, user, token, onRefresh }) {
    const [showModal, setShowModal] = useState(false);

    const handleDelete = async (id) => {
        if (!confirm("Delete this event?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/v1/events/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRefresh();
        } catch (err) {
            alert("Failed to delete event");
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());
        payload.latitude = parseFloat(payload.latitude);
        payload.longitude = parseFloat(payload.longitude);
        payload.expected_attendance = parseInt(payload.expected_attendance);

        try {
            await axios.post(`${API_BASE_URL}/api/v1/events`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            onRefresh();
        } catch (err) {
            alert("Failed to add event: " + (err.response?.data?.detail || err.message));
        }
    };

    return (
        <div className="flex-1 p-4 md:p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full bg-white custom-scrollbar pb-24 md:pb-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black font-outfit text-slate-900 leading-none mb-2">City Events</h2>
                    <p className="text-slate-500 font-medium">Urban mobility impact tracking.</p>
                </div>
                {user?.is_admin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all w-full md:w-auto justify-center text-sm"
                    >
                        <CalendarPlus size={18} />
                        Add Event
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                    <div key={event.event_id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-md transition-all group relative">
                        {user?.is_admin && (
                            <button
                                onClick={() => handleDelete(event.event_id)}
                                className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10"
                                title="Delete Event"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                                    {event.event_type}
                                </span>
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Clock size={12} />
                                    {format(new Date(event.start_time), 'MMM d, h:mm a')}
                                </span>
                            </div>
                            <h3 className="text-xl font-black font-outfit text-slate-900 mb-3">{event.event_name}</h3>
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                    <MapIcon size={14} className="text-primary" />
                                    <span>{event.venue}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                    <UserIcon size={14} className="text-primary" />
                                    <span>{event.expected_attendance?.toLocaleString()} attending</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">AI Mobility Impact</p>
                                <div className="flex items-center gap-2 text-sm text-orange-600 font-extrabold mb-1">
                                    <TrendingUp size={14} />
                                    <span>High Impact (+15% Demand)</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">System predicts peak congestion in nearby Zone 5 and Zone 12.</p>
                            </div>
                        </div>
                    </div>
                ))}
                {events.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <Calendar size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-bold text-slate-500">No scheduled events found.</p>
                        {user?.is_admin && <p className="text-[11px] mt-1 text-slate-400">System is ready for new entries.</p>}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl w-full max-w-2xl relative animate-in zoom-in duration-300 shadow-2xl">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all">
                            <X size={20} />
                        </button>
                        <h3 className="text-3xl font-black font-outfit text-slate-900 dark:text-white mb-8">Register City Event</h3>
                        <form onSubmit={handleAddSubmit} className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Event Name</label>
                                <input name="event_name" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white dark:focus:bg-slate-900 dark:text-white outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Category</label>
                                <select name="event_type" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white dark:focus:bg-slate-900 dark:text-white outline-none transition-all">
                                    <option>Concert</option>
                                    <option>Sports</option>
                                    <option>Festival</option>
                                    <option>Conference</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Venue</label>
                                <input name="venue" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Attendance</label>
                                <input name="expected_attendance" type="number" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Start Time</label>
                                <input name="start_time" type="datetime-local" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">End Time</label>
                                <input name="end_time" type="datetime-local" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Latitude</label>
                                <input name="latitude" type="number" step="0.0001" required defaultValue="23.0225" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Longitude</label>
                                <input name="longitude" type="number" step="0.0001" required defaultValue="72.5714" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white outline-none transition-all" />
                            </div>
                            <div className="col-span-2 pt-4">
                                <button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 uppercase tracking-widest text-[11px]">
                                    Confirm Registration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, subValue, icon }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-primary/30 transition-all">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 text-slate-400">
                {icon}
                <span className="text-[9px] md:text-[11px] uppercase tracking-widest font-black leading-none">{label}</span>
            </div>
            <div className="text-lg md:text-2xl font-bold font-outfit text-slate-900 dark:text-white leading-none mb-1 md:mb-1.5">{value}</div>
            <div className="text-[10px] md:text-[11px] text-slate-500 font-medium flex items-center gap-1.5 opacity-80">
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                {subValue}
            </div>
        </div>
    );
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
            {label}
        </div>
    );
}

function PredictionChart({ data }) {
    const chartData = {
        labels: data.map(d => format(new Date(d.time), 'HH:mm')),
        datasets: [
            {
                label: 'Predicted Availability %',
                data: data.map(d => d.availability),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3B82F6',
                pointBorderColor: '#fff',
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#ffffff',
                titleColor: '#0f172a',
                bodyColor: '#64748b',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                titleFont: { size: 12, weight: 'bold', family: 'Outfit' },
                bodyFont: { size: 12, family: 'Inter' }
            }
        },
        scales: {
            y: {
                min: 0,
                max: 100,
                grid: { color: 'rgba(0, 0, 0, 0.03)' },
                ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
            }
        }
    };

    return <Line data={chartData} options={options} />;
}

export default App;

// --- New Settings View Component ---
function SettingsView({ theme, setTheme, user }) {
    return (
        <div className="flex-1 p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full bg-white dark:bg-slate-950 custom-scrollbar pb-24 md:pb-8">
            <header>
                <h2 className="text-3xl font-black font-outfit text-slate-900 dark:text-white leading-none mb-2">Settings</h2>
                <p className="text-slate-500 font-medium">Manage your app experience.</p>
            </header>

            <div className="max-w-2xl space-y-8">
                {/* Theme Section */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Settings size={16} className="text-primary" />
                        Appearance
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <ThemeOption
                            label="Light"
                            active={theme === 'light'}
                            onClick={() => setTheme('light')}
                            preview={<div className="w-full h-8 bg-white border border-slate-200 rounded mb-2"></div>}
                        />
                        <ThemeOption
                            label="Dark"
                            active={theme === 'dark'}
                            onClick={() => setTheme('dark')}
                            preview={<div className="w-full h-8 bg-slate-900 border border-slate-800 rounded mb-2"></div>}
                        />
                        <ThemeOption
                            label="System"
                            active={theme === 'system'}
                            onClick={() => setTheme('system')}
                            preview={<div className="w-full h-8 bg-gradient-to-r from-white to-slate-900 border border-slate-200 rounded mb-2"></div>}
                        />
                    </div>
                </section>

                {/* Profile Section */}
                <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <UserIcon size={16} className="text-primary" />
                        Profile
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{user?.name}</h4>
                            <p className="text-slate-500 text-sm mb-4">{user?.email}</p>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                    {user?.state}, {user?.country}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function ThemeOption({ label, active, onClick, preview }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-4 rounded-xl border-2 transition-all text-left ${active
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
        >
            {preview}
            <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${active ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>{label}</span>
                {active && <div className="w-2 h-2 rounded-full bg-primary"></div>}
            </div>
        </button>
    );
}