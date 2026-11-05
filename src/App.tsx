import { stationTimeZone, stationDate, zonedParts, formatTime, formatMetric } from './utils/time';
import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Calendar, 
  MapPin, 
  Moon, 
  Sun, 
  Info, 
  Navigation, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Eye, 
  Compass, 
  Sparkles, 
  Clock, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  Telescope, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  BookmarkPlus, 
  Trash2, 
  Sliders,
  Globe2,
  Search,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MoonPhaseSvg } from "./components/MoonPhaseSvg";
import { 
  calculateMoonDetails, 
  ObserverLocation, 
  SightingVisibility,
  MoonCalculationResult,
  getStationTelemetry
} from "./utils/astronomy";
import { COMMON_STATIONS, ObserverStation, isObserverStation } from "./data/stations";
import { StationSelectorModal } from "./components/StationSelectorModal";
import { StationDetailsModal } from "./components/StationDetailsModal";
import { AddCustomCityModal } from "./components/AddCustomCityModal";

export type StationTabRegion = "All" | "Middle East" | "Asia" | "Europe" | "Americas" | "Africa" | "Oceania" | "Custom";



interface SightingRecord {
  id: string;
  dateStr: string;
  location: string;
  status: "naked_eye" | "optical_aid" | "clouded_out" | "not_visible";
  notes?: string;
  timestamp: number;
}

export default function App() {
  // Current live clock reference
  const [liveNow, setLiveNow] = useState<Date>(new Date());

  const initialCivil = useMemo(() => zonedParts(liveNow, stationTimeZone(COMMON_STATIONS[0].latitude, COMMON_STATIONS[0].longitude)), []);

  // --- TIME MODE ---
  // "live": follows real-time clock
  // "sunset": locked to astronomical sunset at observer's station
  // "custom": user manually picks date/time
  const [timeMode, setTimeMode] = useState<"live" | "sunset" | "custom">("sunset");

  // --- SELECTED DATE & TIME ---
  const [selectedYear, setSelectedYear] = useState<number>(() => initialCivil.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => initialCivil.month - 1); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number>(() => initialCivil.day);
  const [selectedHour, setSelectedHour] = useState<number>(() => initialCivil.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(() => initialCivil.minute);

  // Time-lapse simulation state
  const [isPlayingTimelapse, setIsPlayingTimelapse] = useState<boolean>(false);
  const timelapseIntervalRef = useRef<number | null>(null);

  // --- OBSERVER STATION STATE ---
  const [currentStation, setCurrentStation] = useState<ObserverStation>(() => COMMON_STATIONS[0]);
  const [isStationModalOpen, setIsStationModalOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isAddCityModalOpen, setIsAddCityModalOpen] = useState<boolean>(false);
  const [stationForDetails, setStationForDetails] = useState<ObserverStation | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Station Tab filter state for 30+ stations
  const [selectedStationTab, setSelectedStationTab] = useState<StationTabRegion>("All");
  const [stationSearchFilter, setStationSearchFilter] = useState<string>("");

  // Saved Custom Stations in localStorage
  const [savedStations, setSavedStations] = useState<ObserverStation[]>(() => {
    try {
      const stored = localStorage.getItem("luna_saved_stations");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.filter(isObserverStation) : [];
    } catch {
      return [];
    }
  });

  // Dynamic regional station tabs
  const stationTabOptions = useMemo(() => [
    { id: "All" as StationTabRegion, label: "All Stations", icon: "🌐", count: COMMON_STATIONS.length },
    { id: "Middle East" as StationTabRegion, label: "Middle East", icon: "🕋", count: COMMON_STATIONS.filter(s => s.region === "Middle East").length },
    { id: "Asia" as StationTabRegion, label: "Asia", icon: "🌏", count: COMMON_STATIONS.filter(s => s.region === "Asia").length },
    { id: "Europe" as StationTabRegion, label: "Europe", icon: "🏛️", count: COMMON_STATIONS.filter(s => s.region === "Europe").length },
    { id: "Americas" as StationTabRegion, label: "Americas", icon: "🌎", count: COMMON_STATIONS.filter(s => s.region === "Americas").length },
    { id: "Africa" as StationTabRegion, label: "Africa", icon: "🌍", count: COMMON_STATIONS.filter(s => s.region === "Africa").length },
    { id: "Oceania" as StationTabRegion, label: "Oceania", icon: "🦘", count: COMMON_STATIONS.filter(s => s.region === "Oceania").length },
    { id: "Custom" as StationTabRegion, label: "Custom & GPS", icon: "📍", count: savedStations.length + (currentStation.isCustom && !savedStations.some(s => s.id === currentStation.id) ? 1 : 0) },
  ], [savedStations, currentStation]);

  // Stations displayed under the active tab
  const displayedStations = useMemo(() => {
    if (selectedStationTab === "Custom") {
      const list = [...savedStations];
      if (currentStation.isCustom && !list.some(s => s.id === currentStation.id)) {
        list.unshift(currentStation);
      }
      return list;
    }
    return COMMON_STATIONS.filter(s => {
      const matchesTab = selectedStationTab === "All" || s.region === selectedStationTab;
      const q = stationSearchFilter.toLowerCase().trim();
      if (!q) return matchesTab;
      const matchesSearch = 
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        (s.observatory && s.observatory.toLowerCase().includes(q)) ||
        s.region.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [selectedStationTab, stationSearchFilter, savedStations, currentStation]);

  const handleRegionTabChange = (region: StationTabRegion) => {
    setSelectedStationTab(region);
    if (region === "Custom") {
      if (savedStations.length > 0 && !currentStation.isCustom) {
        setCurrentStation(savedStations[0]);
      }
    } else if (region !== "All") {
      if (currentStation.region !== region || currentStation.isCustom) {
        const firstInRegion = COMMON_STATIONS.find(s => s.region === region);
        if (firstInRegion) {
          setCurrentStation(firstInRegion);
        }
      }
    }
  };

  const handleSaveStation = (station: ObserverStation) => {
    setSavedStations(prev => {
      const filtered = prev.filter(s => s.id !== station.id);
      const updated = [station, ...filtered];
      try {
        localStorage.setItem("luna_saved_stations", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteSavedStation = (stationId: string) => {
    setSavedStations(prev => {
      const updated = prev.filter(s => s.id !== stationId);
      try {
        localStorage.setItem("luna_saved_stations", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleApplyCustomStation = (station: ObserverStation, saveToFavorites: boolean) => {
    if (saveToFavorites) {
      handleSaveStation(station);
    }
    setCurrentStation(station);
    setSelectedStationTab("Custom");
  };

  // Hijri regional adjustment
  const [islamicOffset, setIslamicOffset] = useState<number>(0);

  // --- UI TOGGLES ---
  const [viewMode, setViewMode] = useState<"horizon" | "telescope">("horizon");
  const [showAdvancedData, setShowAdvancedData] = useState<boolean>(false);
  const [copiedForecast, setCopiedForecast] = useState<boolean>(false);
  const [showLogDrawer, setShowLogDrawer] = useState<boolean>(false);

  // --- OBSERVATION LOGS (localStorage) ---
  const [sightingLogs, setSightingLogs] = useState<SightingRecord[]>(() => {
    try {
      const stored = localStorage.getItem("luna_sighting_logs");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.filter(log => log && typeof log.id === 'string' && typeof log.dateStr === 'string'
        && typeof log.location === 'string' && ['naked_eye', 'optical_aid', 'clouded_out', 'not_visible'].includes(log.status)
        && Number.isFinite(log.timestamp)) : [];
    } catch {
      return [];
    }
  });

  // --- AI COMMENTARY ---
  const [aiCommentary, setAiCommentary] = useState<{
    celestialAdvice: string;
    historicalContext: string;
    isSignificanceSpecial: boolean;
    isFallback?: boolean;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Live clock tick (updates liveNow every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Active location object
  const activeLocation: ObserverLocation = useMemo(() => ({
    latitude: currentStation.latitude,
    longitude: currentStation.longitude,
    elevation: currentStation.elevation,
    name: currentStation.name,
  }), [currentStation]);
  const timeZone = useMemo(() => stationTimeZone(currentStation.latitude, currentStation.longitude), [currentStation.latitude, currentStation.longitude]);

  const activeStationTelemetry = getStationTelemetry(activeLocation);

  const selectedDate = useMemo(() => stationDate(selectedYear, selectedMonth + 1, selectedDay, selectedHour, selectedMinute, timeZone), [selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute, timeZone]);
  const sunsetPreview = useMemo(() => calculateMoonDetails(stationDate(selectedYear, selectedMonth + 1, selectedDay, 12, 0, timeZone), activeLocation, islamicOffset), [selectedYear, selectedMonth, selectedDay, timeZone, activeLocation, islamicOffset]);
  const activeDate = timeMode === "live" ? liveNow : timeMode === "sunset" ? (sunsetPreview.sunsetDate || selectedDate) : selectedDate;
  const calculations: MoonCalculationResult = useMemo(() => calculateMoonDetails(activeDate, activeLocation, islamicOffset), [activeDate, activeLocation, islamicOffset]);
  const activeCivil = zonedParts(activeDate, timeZone);

  const formattedDate = activeDate.toLocaleDateString("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  // ISO date string for input type="date"
  const inputCivil = timeMode === 'live' ? activeCivil : { year: selectedYear, month: selectedMonth + 1, day: selectedDay };
  const dateInputStr = `${inputCivil.year}-${String(inputCivil.month).padStart(2, '0')}-${String(inputCivil.day).padStart(2, '0')}`;

  // Time-lapse animation controller
  useEffect(() => {
    if (isPlayingTimelapse) {
      setTimeMode("custom");
      timelapseIntervalRef.current = window.setInterval(() => {
        const next = new Date(selectedDate.getTime() + 3600000);
        const p = zonedParts(next, timeZone);
        setSelectedYear(p.year); setSelectedMonth(p.month - 1); setSelectedDay(p.day);
        setSelectedHour(p.hour); setSelectedMinute(p.minute);
      }, 700);
    } else if (timelapseIntervalRef.current) {
      clearInterval(timelapseIntervalRef.current);
    }
    return () => {
      if (timelapseIntervalRef.current) clearInterval(timelapseIntervalRef.current);
    };
  }, [isPlayingTimelapse, selectedDate, timeZone]);

  // Safe client GPS lookup
  const handleUseMyLocation = () => {
    setIsGeoLoading(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("GPS not supported by your browser.");
      setIsGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsStation: ObserverStation = {
          id: `gps_${Date.now()}`,
          name: "My GPS Station",
          shortName: "My Location",
          country: "Local Coordinates",
          region: "Middle East",
          icon: "📍",
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          elevation: pos.coords.altitude ? Math.round(pos.coords.altitude) : 25,
          observatory: "Hardware GPS Geolocation",
          description: "Geodetic station captured directly from observer's hardware GPS sensor.",
          isCustom: true
        };
        setCurrentStation(gpsStation);
        setIsGeoLoading(false);
      },
      (err) => {
        setGeoError(err.code === 1 ? "Permission denied. Allow location in browser." : "GPS lookup timed out.");
        setIsGeoLoading(false);
      },
      { timeout: 7000 }
    );
  };

  const jumpToDate = (targetY: number, targetM: number, targetD: number) => {
    setSelectedYear(targetY);
    setSelectedMonth(targetM);
    setSelectedDay(targetD);
    setTimeMode("sunset");
    setIsPlayingTimelapse(false);
  };

  const stepDate = (days: number) => {
    setTimeMode('sunset'); setIsPlayingTimelapse(false);
    const temp = new Date(inputCivil.year, inputCivil.month - 1, inputCivil.day);
    temp.setDate(temp.getDate() + days);
    setSelectedYear(temp.getFullYear());
    setSelectedMonth(temp.getMonth());
    setSelectedDay(temp.getDate());
  };

  const jumpToToday = () => {
    const now = zonedParts(new Date(), timeZone);
    setSelectedYear(now.year); setSelectedMonth(now.month - 1); setSelectedDay(now.day);
    setSelectedHour(now.hour); setSelectedMinute(now.minute);
    setTimeMode("sunset");
    setIsPlayingTimelapse(false);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    setTimeMode("sunset"); setIsPlayingTimelapse(false);
    const [y, m, d] = e.target.value.split("-").map(Number);
    if (y < 1900 || y > 2100) return;
    setSelectedYear(y);
    setSelectedMonth(m - 1);
    setSelectedDay(d);
  };

  // Log observation
  const handleLogObservation = (status: SightingRecord["status"]) => {
    const newRecord: SightingRecord = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      dateStr: formattedDate,
      location: activeLocation.name,
      status,
      timestamp: Date.now()
    };
    const updated = [newRecord, ...sightingLogs].slice(0, 20);
    setSightingLogs(updated);
    try {
      localStorage.setItem("luna_sighting_logs", JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteLog = (id: string) => {
    const updated = sightingLogs.filter(item => item.id !== id);
    setSightingLogs(updated);
    try {
      localStorage.setItem("luna_sighting_logs", JSON.stringify(updated));
    } catch {}
  };

  const commentaryClientCache = useRef<Map<string, any>>(new Map());
  const commentaryRequest = useRef(0);
  const advisoryDate = timeMode === "live" ? activeCivil : { year: selectedYear, month: selectedMonth + 1, day: selectedDay };
  const advisoryPayload = {
    dateStr: `${advisoryDate.year}-${String(advisoryDate.month).padStart(2, '0')}-${String(advisoryDate.day).padStart(2, '0')}`,
    latitude: activeLocation.latitude, longitude: activeLocation.longitude, elevation: activeLocation.elevation,
    locationName: activeLocation.name, islamicOffset,
  };
  const commentaryKey = JSON.stringify(advisoryPayload);
  const fetchAiCommentary = async (signal?: AbortSignal) => {
    const request = ++commentaryRequest.current;
    if (commentaryClientCache.current.has(commentaryKey)) {
      setAiCommentary(commentaryClientCache.current.get(commentaryKey));
      setIsAiLoading(false); return;
    }
    setIsAiLoading(true);
    setAiCommentary(null);
    try {
      const response = await fetch('/api/moon-commentary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: commentaryKey, signal,
      });
      if (!response.ok) throw new Error('Advisory unavailable');
      const data = await response.json();
      if (typeof data.celestialAdvice !== 'string' || typeof data.historicalContext !== 'string') throw new Error('Invalid advisory');
      if (signal?.aborted || request !== commentaryRequest.current) return;
      if (commentaryClientCache.current.size >= 64) commentaryClientCache.current.delete(commentaryClientCache.current.keys().next().value!);
      commentaryClientCache.current.set(commentaryKey, data);
      setAiCommentary(data);
    } catch {
      if (signal?.aborted || request !== commentaryRequest.current) return;
      setAiCommentary({
        celestialAdvice: sunsetPreview.isSightedPossible + '. ' + sunsetPreview.bestObservationWindow + ' (' + timeZone + ').',
        historicalContext: 'Civil calendar estimate only. Follow local month-start announcements.',
        isSignificanceSpecial: false, isFallback: true,
      });
    } finally {
      if (!signal?.aborted && request === commentaryRequest.current) setIsAiLoading(false);
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => fetchAiCommentary(controller.signal), 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [commentaryKey]);

  // Copy sighting report to clipboard
  const handleCopySightingSummary = async () => {
    const lagStr = calculations.lagTimeMinutes === null ? "N/A" : calculations.lagTimeMinutes > 0 ? `+${calculations.lagTimeMinutes.toFixed(0)} min` : `${calculations.lagTimeMinutes.toFixed(0)} min`;
    const summaryLines = [
      "🌙 LUNASYNC MOON SIGHTING REPORT",
      "══════════════════════════════════════",
      `📅 Observation Date: ${formattedDate}`,
      `📍 Location: ${activeLocation.name} (${activeLocation.latitude.toFixed(2)}°, ${activeLocation.longitude.toFixed(2)}°)`,
      `🕌 Hijri: ${calculations.hijriCalendar.day} ${calculations.hijriCalendar.monthName} ${calculations.hijriCalendar.year} AH`,
      "",
      `🔭 SIGHTING VERDICT & CRITERIA:`,
      `• Verdict: ${calculations.isSightedPossible}`,
      `• Odeh criterion V: ${formatMetric(calculations.odehValue, 2)} (not a probability)`,
      `• Odeh Classification: ${calculations.odehCategory}`,
      "",
      `⏱️ KEY OBSERVATION TIMINGS:`,
      `• Sunset Time: ${calculations.sunsetTime || "N/A"} (${timeZone})`,
      `• Moonset Time: ${calculations.moonsetTime || "N/A"} (${timeZone})`,
      `• Lag Window: ${lagStr}`,
      `• Best Observation Window: ${calculations.bestObservationWindow}`,
      "",
      `📐 ASTRONOMICAL TELEMETRY:`,
      `• Moon Age: ${calculations.ageHours.toFixed(1)} hours (${calculations.ageDays.toFixed(1)} days)`,
      `• Illumination: ${(calculations.illumination * 100).toFixed(2)}% (${calculations.phaseName})`,
      `• Moon Altitude at Sunset: ${formatMetric(calculations.altitudeAtSunset)}°`,
      `• Arc of Vision at best time (ARCV): ${formatMetric(calculations.arcOfVision)}°`,
      `• Azimuth Separation (DAZ): ${formatMetric(calculations.daz)}°`,
      `• Current topocentric separation: ${calculations.elongation.toFixed(1)}°`,
      "══════════════════════════════════════",
      "Generated by LunaSync Astronomical Observatory"
    ];

    const summaryText = summaryLines.join("\n");
    let success = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(summaryText);
        success = true;
      } catch {}
    }
    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = summaryText;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        success = true;
      } catch {}
    }

    if (success) {
      setCopiedForecast(true);
      setTimeout(() => setCopiedForecast(false), 2200);
    }
  };

  // Countdown to Next New Moon / Hilal
  const [countdownRemaining, setCountdownRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const nowMs = Date.now();
      const diff = Math.max(0, calculations.nextNewMoonTimestamp - nowMs);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdownRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [calculations.nextNewMoonTimestamp]);

  // Simplified verdict styling
  const isFeasible = calculations.isSightedPossible === SightingVisibility.EASY;
  const isChallenging = calculations.isSightedPossible === SightingVisibility.CHALLENGING;
  const isOptical = calculations.isSightedPossible === SightingVisibility.AIDED_ONLY;
  const isImpossible = ![SightingVisibility.EASY, SightingVisibility.CHALLENGING, SightingVisibility.AIDED_ONLY].includes(calculations.isSightedPossible);

  // Active time representation string
  const activeTimeString = formatTime(activeDate, timeZone);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-amber-500/20 selection:text-amber-200 flex flex-col justify-between">
      
      {/* VIBRANT CELESTIAL BACKGROUND NEBULA */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-600/15 via-amber-500/10 to-transparent blur-[120px]" />
        <div className="absolute top-[600px] -left-20 w-[500px] h-[500px] bg-indigo-900/15 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-600/10 blur-[140px]" />
      </div>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070B16]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-2">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-100 flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.4)]">
              <Moon className="w-5 h-5 text-slate-900 fill-slate-900" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white uppercase block leading-none">
                Luna<span className="text-amber-400">Sync</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                Astrometric Sighting Platform
              </span>
            </div>
          </div>

          {/* Real-time Status Badge & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${timeMode === "live" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-slate-300 font-medium">
                {timeMode === "live" ? "LIVE NOW" : timeMode === "sunset" ? "SUNSET SYNC" : "CUSTOM TIME"}
              </span>
              <span className="text-amber-400 font-bold ml-1">{activeTimeString}</span>
            </div>

            {/* Quick Station Badge in Header */}
            <button
              onClick={() => setIsStationModalOpen(true)}
              className="btn-3d-slate px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer font-medium"
              title="Click to select or customize observer station"
            >
              <span>{currentStation.icon}</span>
              <span className="font-bold text-white max-w-20 truncate">{currentStation.shortName}</span>
              <span className="text-[10px] text-amber-400 font-mono hidden md:inline">({currentStation.elevation}m)</span>
            </button>

            {/* Observation Log Drawer Toggle */}
            <button
              onClick={() => setShowLogDrawer(prev => !prev)}
              className="btn-3d-slate px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer font-medium"
              title="Observation Sighting Log"
            >
              <BookmarkPlus className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Log Sighting</span>
              {sightingLogs.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-900 font-bold text-[10px] flex items-center justify-center">
                  {sightingLogs.length}
                </span>
              )}
            </button>



            {/* Quick 3D Share Button */}
            <button
              onClick={handleCopySightingSummary}
              className={`btn-3d-slate px-3.5 sm:px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer ${
                copiedForecast ? "btn-3d-emerald" : ""
              }`}
            >
              {copiedForecast ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold">Report Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Share Report</span>
                  <span className="sm:hidden">Share</span>
                </>
              )}
            </button>

          </div>

        </div>
      </header>



      {/* SIGHTING LOG DRAWER / MODAL */}
      <AnimatePresence>
        {showLogDrawer && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-16 z-40 bg-[#0B101E] border-b border-slate-800 shadow-2xl px-4 sm:px-6 py-4"
          >
            <div className="max-w-6xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    My Local Observation Log
                  </h4>
                </div>
                <button 
                  onClick={() => setShowLogDrawer(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Close ✕
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-400">Record for {formattedDate} at {activeLocation.name}:</span>
                <button 
                  onClick={() => handleLogObservation("naked_eye")}
                  className="btn-3d-emerald px-3 py-1.5 rounded-xl text-xs cursor-pointer font-semibold"
                >
                  👁️ Sighted Naked Eye
                </button>
                <button 
                  onClick={() => handleLogObservation("optical_aid")}
                  className="btn-3d-blue px-3 py-1.5 rounded-xl text-xs cursor-pointer font-semibold"
                >
                  🔭 Sighted with Binoculars/Telescope
                </button>
                <button 
                  onClick={() => handleLogObservation("clouded_out")}
                  className="btn-3d-slate px-3 py-1.5 rounded-xl text-xs cursor-pointer font-semibold"
                >
                  ☁️ Overcast / Clouded Out
                </button>
                <button 
                  onClick={() => handleLogObservation("not_visible")}
                  className="btn-3d-slate px-3 py-1.5 rounded-xl text-xs cursor-pointer font-semibold text-rose-300"
                >
                  ❌ Not Visible (Clear Sky)
                </button>
              </div>

              {sightingLogs.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto space-y-1.5 border-t border-slate-800/80 pt-2 text-xs">
                  {sightingLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-amber-400 font-bold">{log.dateStr}</span>
                        <span className="text-slate-400">· {log.location}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-200">
                          {log.status.replace("_", " ")}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-6 space-y-8">
        
        {/* NEXT NEW MOON & HILAL COUNTDOWN TICKER BANNER */}
        <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#131124] to-[#0A1024] border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Upcoming Conjunction
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-200 font-mono font-semibold">
                  New Conjunction
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Next New Moon: {calculations.nextNewMoonDate}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 min-w-0">
            <div className="flex items-center gap-2 font-mono text-center">
              <div className="bg-slate-900/90 border border-slate-750 px-2.5 py-1.5 rounded-xl min-w-[40px]">
                <span className="text-lg font-bold text-amber-400 block leading-tight">{countdownRemaining.days}</span>
                <span className="text-[9px] text-slate-400 uppercase">Days</span>
              </div>
              <span className="text-amber-500/50 font-bold">:</span>
              <div className="bg-slate-900/90 border border-slate-750 px-2.5 py-1.5 rounded-xl min-w-[40px]">
                <span className="text-lg font-bold text-amber-400 block leading-tight">{countdownRemaining.hours}</span>
                <span className="text-[9px] text-slate-400 uppercase">Hours</span>
              </div>
              <span className="text-amber-500/50 font-bold">:</span>
              <div className="bg-slate-900/90 border border-slate-750 px-2.5 py-1.5 rounded-xl min-w-[40px]">
                <span className="text-lg font-bold text-amber-400 block leading-tight">{countdownRemaining.minutes}</span>
                <span className="text-[9px] text-slate-400 uppercase">Mins</span>
              </div>
              <span className="text-amber-500/50 font-bold">:</span>
              <div className="bg-slate-900/90 border border-slate-750 px-2.5 py-1.5 rounded-xl min-w-[40px]">
                <span className="text-lg font-bold text-amber-400 block leading-tight">{countdownRemaining.seconds}</span>
                <span className="text-[9px] text-slate-400 uppercase">Secs</span>
              </div>
            </div>

            <button
              onClick={() => {
                const target = zonedParts(new Date(calculations.nextNewMoonTimestamp), timeZone);
                jumpToDate(target.year, target.month - 1, target.day);
              }}
              className="btn-3d-amber px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Jump to Date
            </button>
          </div>
        </section>

        {/* OBSERVER STATION COMMAND CARD */}
        <section className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-750 shadow-xl space-y-4">
          {/* Active Station Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                {currentStation.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                    {currentStation.region} Station
                  </span>
                  {currentStation.isCustom && (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 font-bold">
                      Custom / GPS Site
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {currentStation.country}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <span>{currentStation.name}</span>
                </h3>
                {currentStation.observatory && (
                  <p className="text-xs text-amber-400/80 font-mono mt-0.5 flex items-center gap-1.5">
                    <Telescope className="w-3.5 h-3.5" />
                    <span>{currentStation.observatory}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStationForDetails(currentStation);
                  setIsDetailsModalOpen(true);
                }}
                className="btn-3d-slate px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                title="View Station Details & Horizon Telemetry"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Station Details</span>
              </button>

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isGeoLoading}
                className="btn-3d-blue px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                title="Auto-detect coordinates using device GPS"
              >
                <Navigation className={`w-3.5 h-3.5 ${isGeoLoading ? "animate-spin" : ""}`} />
                <span>{isGeoLoading ? "GPS..." : "Use My GPS"}</span>
              </button>
            </div>
          </div>

          {/* Active Station Geodetic Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Elevation (h)</span>
              <span className="font-bold text-amber-300">{currentStation.elevation} m</span>
              <span className="text-[10px] text-slate-400 block">({activeStationTelemetry.elevationFt} ft)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Horizon Dip</span>
              <span className="font-bold text-cyan-400">-{activeStationTelemetry.dipDegrees}°</span>
              <span className="text-[10px] text-slate-400 block">(-{activeStationTelemetry.dipArcMin}')</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Coordinates</span>
              <span className="font-bold text-slate-200 block truncate" title={activeStationTelemetry.dmsLat}>
                {activeStationTelemetry.dmsLat}
              </span>
              <span className="text-[10px] text-slate-400 block truncate" title={activeStationTelemetry.dmsLng}>
                {activeStationTelemetry.dmsLng}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Optical Horizon</span>
              <span className="font-bold text-emerald-400">{activeStationTelemetry.horizonDistanceKm} km reach</span>
              <span className="text-[10px] text-slate-400 block">Sea-horizon geometry estimate</span>
            </div>
          </div>

          {/* CLEAN REGION TABS & INNER CITY SELECTOR */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            {/* 1. Region Tabs: All Stations, Middle East, Asia, Europe, Americas, Africa, Oceania, Custom */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {stationTabOptions.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleRegionTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all ${
                    selectedStationTab === tab.id
                      ? "bg-amber-400/25 text-amber-300 border border-amber-400/60 shadow-sm"
                      : "bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    selectedStationTab === tab.id ? "bg-amber-400 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* 2. City / Station Selector Dropdown (Cities are inside the selector, zero clutter) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1 min-w-0 relative">
                <select
                  aria-label="Observer station"
                  value={currentStation.id}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_CUSTOM__") {
                      setIsAddCityModalOpen(true);
                      return;
                    }
                    const st = [currentStation, ...COMMON_STATIONS].find(s => s.id === e.target.value) || 
                               savedStations.find(s => s.id === e.target.value);
                    if (st) setCurrentStation(st);
                  }}
                  className="w-full appearance-none bg-slate-950/90 border border-slate-750 hover:border-amber-400/70 focus:border-amber-400 text-white font-medium text-xs rounded-xl px-4 py-2.5 pr-10 cursor-pointer focus:outline-none transition-colors"
                >
                  <option value="__ADD_CUSTOM__" className="bg-[#17142b] text-amber-300 font-bold py-2 border-b border-amber-500/40">
                    ➕ + Add Any City or Country (Dallas, Houston, Miami, Chicago...)...
                  </option>
                  {(displayedStations.some(s => s.id === currentStation.id) ? displayedStations : [currentStation, ...displayedStations]).map((st) => (
                    <option key={st.id} value={st.id} className="bg-[#0B101E] text-slate-100 py-1.5">
                      {st.icon} {st.name} — {st.country} ({st.elevation}m)
                    </option>
                  ))}
                  {displayedStations.length === 0 && selectedStationTab === "Custom" && (
                    <option value="" disabled className="bg-[#0B101E] text-slate-400">
                      No custom stations saved yet (Click "+ Add City / Country" below to create)
                    </option>
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Action Buttons: Add City, and Full Directory */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddCityModalOpen(true)}
                  className="btn-3d-amber px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-md"
                  title="Add any custom city, state or country (e.g. Dallas, Houston, Miami, Chicago, Lahore)"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>+ Add City / Country</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStationModalOpen(true)}
                  className="btn-3d-slate px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 text-slate-300 hover:text-white whitespace-nowrap"
                  title="Open full observatory directory with coordinates and horizon dip"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Directory</span>
                </button>
              </div>
            </div>
          </div>

          {geoError && (
            <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{geoError}</span>
            </div>
          )}
        </section>

        {/* HERO STAGE: THE MOON & DUSK HORIZON SIMULATOR */}
        <section className="relative rounded-3xl border border-slate-800 bg-[#0B101E]/90 backdrop-blur-xl overflow-hidden shadow-2xl p-5 sm:p-7 space-y-6">
          
          {/* Header Row: Date Stepper, HTML5 Date Input & Mode Toggles */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-4">
            
            {/* Quick Date Stepper & Direct Date Picker */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => stepDate(-1)} 
                className="btn-3d-slate px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer font-medium"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev Day</span>
              </button>

              <button 
                onClick={jumpToToday} 
                className="btn-3d-slate px-3 py-1.5 rounded-xl text-xs cursor-pointer font-medium"
              >
                Today
              </button>

              <button 
                onClick={() => stepDate(1)} 
                className="btn-3d-slate px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer font-medium"
                title="Next Day"
              >
                <span>Next Day</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Direct HTML5 Date Picker */}
              <div className="relative flex items-center">
                <input 
                  type="date"
                  min="1900-01-01"
                  max="2100-12-31"
                  aria-label="Observation date"
                  value={dateInputStr}
                  onChange={handleDateInputChange}
                  className="bg-slate-900/90 border border-slate-700 hover:border-amber-400 text-amber-300 font-mono text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>

              <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-900/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
                {formattedDate} · {timeZone}
              </span>
            </div>

            {/* Time Mode Selection 3D Group */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              <button
                onClick={() => {
                  setTimeMode("live");
                  setIsPlayingTimelapse(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  timeMode === "live" ? "btn-3d-emerald text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${timeMode === "live" ? "bg-white animate-ping" : "bg-emerald-400"}`} />
                <span>Live Now</span>
              </button>

              <button
                onClick={() => {
                  setTimeMode("sunset");
                  setIsPlayingTimelapse(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  timeMode === "sunset" ? "btn-3d-amber text-slate-900" : "text-slate-400 hover:text-white"
                }`}
              >
                🌅 Sunset Sighting ({calculations.sunsetTime || "N/A"})
              </button>

              <button
                onClick={() => {
                  setSelectedYear(activeCivil.year); setSelectedMonth(activeCivil.month - 1); setSelectedDay(activeCivil.day);
                  setSelectedHour(activeCivil.hour); setSelectedMinute(activeCivil.minute);
                  setTimeMode("custom");
                  setIsPlayingTimelapse(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  timeMode === "custom" ? "btn-3d-blue text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                ⏱️ Custom Time
              </button>
            </div>

            {/* View Mode 3D Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              <button
                onClick={() => setViewMode("horizon")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  viewMode === "horizon" ? "btn-3d-amber text-slate-900" : "text-slate-400 hover:text-white"
                }`}
              >
                🌄 Evening Sky
              </button>
              <button
                onClick={() => setViewMode("telescope")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  viewMode === "telescope" ? "btn-3d-amber text-slate-900" : "text-slate-400 hover:text-white"
                }`}
              >
                🔭 3D Close-Up
              </button>
            </div>

          </div>

          {/* VIEWPORT CANVAS */}
          <div className="relative">
            
            {viewMode === "horizon" ? (
              /* DUSK HORIZON SIMULATION */
              <div className="relative h-72 sm:h-84 w-full rounded-2xl overflow-hidden border border-slate-800 select-none shadow-inner">
                
                {/* Dynamic Twilight Sky Gradient based on active computed time */}
                {timeMode === "sunset" ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-[#c84614] via-[#241348] to-[#040815] transition-all duration-700" />
                ) : (
                  (() => {
                    const h = activeCivil.hour;
                    if (h >= 8 && h < 17) {
                      return <div className="absolute inset-0 bg-gradient-to-t from-[#bae6fd] via-[#38bdf8] to-[#0284c7]" />;
                    } else if (h >= 17 && h < 20) {
                      return <div className="absolute inset-0 bg-gradient-to-t from-[#ea580c] via-[#2e1065] to-[#040714]" />;
                    } else if (h >= 5 && h < 8) {
                      return <div className="absolute inset-0 bg-gradient-to-t from-[#fde68a] via-[#4c1d95] to-[#0b0f24]" />;
                    } else {
                      return <div className="absolute inset-0 bg-gradient-to-t from-[#040714] via-[#090d1a] to-[#02040a]" />;
                    }
                  })()
                )}

                {/* Twinkling Stars */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                  <div className="absolute w-1 h-1 bg-white rounded-full top-[16%] left-[24%] animate-twinkle-1" />
                  <div className="absolute w-1.5 h-1.5 bg-amber-100 rounded-full top-[22%] left-[58%] animate-twinkle-2" />
                  <div className="absolute w-1 h-1 bg-sky-200 rounded-full top-[12%] right-[18%] animate-twinkle-3" />
                  <div className="absolute w-1 h-1 bg-white rounded-full top-[36%] right-[38%] animate-twinkle-1" />
                </div>

                {/* Sunset Horizon Glow */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-52 h-24 bg-amber-500/25 blur-2xl rounded-full pointer-events-none" />

                {/* Altitude Markers on the Left */}
                <div className="absolute inset-y-0 left-3 flex flex-col justify-between py-6 text-[9px] font-mono text-slate-300 border-r border-slate-700/30 pr-2 pointer-events-none">
                  <span>+40°</span>
                  <span>+20°</span>
                  <span className="text-amber-300 font-bold">0° Horizon</span>
                </div>

                {/* Ground Cardinals */}
                <div className="absolute bottom-7 inset-x-0 px-8 flex justify-between text-[10px] font-mono text-slate-300 uppercase pointer-events-none font-bold">
                  <span>WSW (240°)</span>
                  <span className="text-amber-300">West (270°)</span>
                  <span>WNW (300°)</span>
                </div>

                {/* Silhouette Desert Mountains */}
                <svg className="absolute bottom-6 left-0 w-full h-12 text-[#030712] fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon points="0,100 0,65 14,40 28,66 45,36 64,68 78,44 88,58 100,34 100,100" />
                </svg>
                <div className="absolute bottom-0 inset-x-0 h-6 bg-[#030712]" />

                {/* GLOWING DYNAMIC MOON ORB */}
                {(() => {
                  const viewCenterAzimuth = 270;
                  const azRange = 60;
                  const horizontalPercent = 50 + ((calculations.azimuth - viewCenterAzimuth) / azRange) * 100;
                  const verticalPercent = Math.max(0, 18 + (calculations.altitude / 45) * 72);
                  const moonInView = horizontalPercent > 2 && horizontalPercent < 98 && calculations.altitude > -8;

                  if (!moonInView) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <div className="text-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                          <Moon className="w-5 h-5 text-amber-400 mx-auto mb-1 animate-pulse" />
                          <span className="text-xs font-semibold text-slate-200">Moon Outside West Sector</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">Alt: {calculations.altitude.toFixed(1)}° · Az: {calculations.azimuth.toFixed(1)}°</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <motion.div 
                      key={`${calculations.altitude}-${calculations.azimuth}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute pointer-events-auto"
                      style={{ 
                        left: `${horizontalPercent}%`, 
                        bottom: `${verticalPercent}%`,
                        transform: "translate(-50%, 50%)" 
                      }}
                    >
                      <div className="group relative cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300/50 shadow-[0_0_20px_rgba(251,191,36,0.6)] flex items-center justify-center transition-transform hover:scale-125">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-900/90 border border-white/40 relative">
                            {calculations.illumination > 0.005 && (
                              <div 
                                className={`absolute inset-y-0 ${calculations.phaseLongitude < 180 ? 'right-0 bg-amber-100' : 'left-0 bg-amber-100'}`}
                                style={{ width: `${Math.min(100, Math.max(14, calculations.illumination * 100))}%` }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Drop line */}
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 h-10 w-[0.5px] border-l border-dashed border-white/20 pointer-events-none" />

                        {/* Tooltip */}
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-slate-800 py-1.5 px-3 rounded-xl font-mono text-[10px] text-slate-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-amber-300 font-bold block">MOON ALTITUDE</span>
                          {calculations.altitude.toFixed(1)}° above horizon
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

              </div>
            ) : (
              /* TELESCOPE 3D CLOSE-UP */
              <div className="relative bg-[#060913] rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="text-center mb-3">
                  <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
                    {calculations.phaseName}
                  </span>
                  <div className="text-2xl font-light text-white mt-0.5">
                    {(calculations.illumination * 100).toFixed(2)}% Illuminated
                  </div>
                </div>

                <MoonPhaseSvg 
                  illumination={calculations.illumination}
                  phaseName={calculations.phaseName}
                  phaseLongitude={calculations.phaseLongitude}
                  altitude={calculations.altitude}
                  filterMode="amber"
                />
                <p className="text-xs text-slate-400">Illustrative disk orientation</p>
              </div>
            )}

          </div>

          {/* PLAY TIME-LAPSE & REACTIVE TIME CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (!isPlayingTimelapse) {
                    setSelectedYear(activeCivil.year); setSelectedMonth(activeCivil.month - 1); setSelectedDay(activeCivil.day);
                    setSelectedHour(activeCivil.hour); setSelectedMinute(activeCivil.minute);
                  }
                  setIsPlayingTimelapse(prev => !prev);
                }}
                className={`btn-3d-amber px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer ${
                  isPlayingTimelapse ? "btn-3d-emerald" : ""
                }`}
              >
                {isPlayingTimelapse ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Simulation</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Play Time-Lapse</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setTimeMode("sunset");
                  setIsPlayingTimelapse(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  timeMode === "sunset" ? "btn-3d-blue" : "btn-3d-slate"
                }`}
              >
                Snap to Sunset ({calculations.sunsetTime || "N/A"})
              </button>
            </div>

            {/* Reactive Unlocked Time Slider */}
            <div className="flex items-center gap-3 w-full sm:w-auto bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono text-slate-300 font-semibold whitespace-nowrap">
                {activeTimeString}
              </span>
              <input 
                type="range"
                min="0"
                max="23"
                value={activeCivil.hour}
                onChange={(e) => {
                  const newH = Number(e.target.value);
                  setSelectedYear(activeCivil.year); setSelectedMonth(activeCivil.month - 1); setSelectedDay(activeCivil.day);
                  setSelectedMinute(activeCivil.minute); setSelectedHour(newH);
                  setTimeMode("custom");
                  setIsPlayingTimelapse(false);
                }}
                className="w-36 accent-amber-400 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                title="Slide to adjust observation hour"
              />
            </div>
          </div>

        </section>

        {/* THE BIG SIGHTING VERDICT (CAN YOU SEE IT TONIGHT?) */}
        <section className={`rounded-3xl border p-6 sm:p-8 space-y-6 transition-all duration-300 shadow-2xl relative overflow-hidden ${
          isFeasible ? "bg-gradient-to-br from-emerald-950/40 via-[#0B1516] to-[#050C0E] border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]" :
          isChallenging ? "bg-gradient-to-br from-amber-950/40 via-[#18120A] to-[#0A0704] border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]" :
          isOptical ? "bg-gradient-to-br from-blue-950/40 via-[#0E1424] to-[#060912] border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]" :
          "bg-gradient-to-br from-slate-900/50 via-[#0E121B] to-[#06080F] border-slate-800"
        }`}>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-5">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold block mb-1">
                Evening Crescent Forecast
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                {isFeasible && <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />}
                {isChallenging && <Eye className="w-7 h-7 text-amber-400 shrink-0" />}
                {isOptical && <Telescope className="w-7 h-7 text-blue-400 shrink-0" />}
                {isImpossible && <AlertCircle className="w-7 h-7 text-slate-400 shrink-0" />}
                <span>{calculations.isSightedPossible}</span>
              </h2>
              <p className="text-xs font-mono text-amber-300/90 mt-1">
                {calculations.odehCategory}
              </p>
              <p className="text-xs text-slate-400 mt-2">Prediction assumes a clear, unobstructed horizon. Atmospheric conditions and observer experience affect visibility.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Odeh criterion V</span>
              <span className="text-2xl font-bold font-mono text-amber-400">{formatMetric(calculations.odehValue, 2)}</span>
              <p className="text-xs text-slate-400">Visibility class, not a probability</p>
            </div>
          </div>

          {/* 3 HUMAN-FRIENDLY ANSWERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                🌅 Best Observation Window
              </span>
              <div className="text-base font-semibold text-white font-mono">
                {calculations.bestObservationWindow}
              </div>
              <p className="text-xs text-slate-400">
                Odeh best time: sunset + 4/9 of the sunset-to-moonset lag. Times use {timeZone}.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                🧭 Where to Look in Sky
              </span>
              <div className="text-base font-semibold text-amber-300 font-mono">
                Azimuth {calculations.azimuth.toFixed(0)}°
              </div>
              <p className="text-xs text-slate-400">
                Moon sits at {calculations.altitude.toFixed(1)}° altitude above the horizon ({formatMetric(calculations.altitudeAtSunset)}° at sunset).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                ⏳ Duration Before Moonset
              </span>
              <div className={`text-base font-semibold font-mono ${calculations.lagTimeMinutes > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {calculations.lagTimeMinutes === null ? "No event available" : calculations.lagTimeMinutes > 0 ? `${calculations.lagTimeMinutes.toFixed(0)} min lag` : "Sets before Sun"}
              </div>
              <p className="text-xs text-slate-400">
                {calculations.lagTimeMinutes === null ? "No sunset or nearby moonset for this date." : calculations.lagTimeMinutes > 0 ? `Moon sets at ${calculations.moonsetTime}.` : "Moon has set before the evening observation."}
              </p>
            </div>

          </div>

          {/* ADVANCED EPHEMERIS ACCORDION (YALLOP & ODEH METRICS) */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setShowAdvancedData(prev => !prev)}
              className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer py-1"
            >
              {showAdvancedData ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showAdvancedData ? "Hide Astronomical Telemetry" : "Show Full Ephemeris & Odeh Standards (ARCV, DAZ, best-time geometry)"}</span>
            </button>

            {showAdvancedData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-3 animate-fadeIn">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Arc of Vision (ARCV)</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">{formatMetric(calculations.arcOfVision)}°</span>
                  <span className="text-[9px] text-slate-500">At best time, airless</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Azimuth Sep (DAZ)</span>
                  <span className="text-sm font-bold font-mono text-white mt-0.5 block">{formatMetric(calculations.daz)}°</span>
                  <span className="text-[9px] text-slate-500">Sun/Moon horiz. angle</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Separation (Elong.)</span>
                  <span className="text-sm font-bold font-mono text-white mt-0.5 block">{calculations.elongation.toFixed(1)}°</span>
                  <span className="text-[9px] text-slate-500">Current instant</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Moon Age (Computed)</span>
                  <span className="text-sm font-bold font-mono text-amber-300 mt-0.5 block">{calculations.ageHours.toFixed(1)} hrs</span>
                  <span className="text-[9px] text-slate-500">{calculations.ageDays.toFixed(1)} days</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Illumination</span>
                  <span className="text-sm font-bold font-mono text-amber-300 mt-0.5 block">{(calculations.illumination * 100).toFixed(2)}%</span>
                  <span className="text-[9px] text-slate-500">{formatMetric(calculations.crescentWidth, 2)}' at best time</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Earth Distance</span>
                  <span className="text-sm font-bold font-mono text-white mt-0.5 block">{calculations.distanceKm.toLocaleString()} km</span>
                  <span className="text-[9px] text-slate-500">Station {activeLocation.elevation}m</span>
                </div>
              </div>
            )}
          </div>

        </section>

        {/* FAST BENCHMARK TARGETS (3D BUTTONS) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-400">
              Famous Moon Sighting Events:
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => jumpToDate(2026, 1, 17)}
              className="btn-3d-slate p-3 rounded-2xl text-left cursor-pointer group"
            >
              <span className="text-[10px] text-amber-400 font-mono block">Feb 17, 2026</span>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 block mt-0.5">
                Ramadan 1447 Crescent
              </span>
            </button>

            <button
              onClick={() => jumpToDate(2026, 2, 19)}
              className="btn-3d-slate p-3 rounded-2xl text-left cursor-pointer group"
            >
              <span className="text-[10px] text-amber-400 font-mono block">Mar 19, 2026</span>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 block mt-0.5">
                Eid al-Fitr 1447 Crescent
              </span>
            </button>

            <button
              onClick={() => jumpToDate(2024, 2, 11)}
              className="btn-3d-slate p-3 rounded-2xl text-left cursor-pointer group"
            >
              <span className="text-[10px] text-amber-400 font-mono block">Mar 11, 2024</span>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 block mt-0.5">
                Ramadan 1445 Sighting
              </span>
            </button>

            <button
              onClick={() => jumpToDate(1969, 6, 20)}
              className="btn-3d-slate p-3 rounded-2xl text-left cursor-pointer group"
            >
              <span className="text-[10px] text-amber-400 font-mono block">Jul 20, 1969</span>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 block mt-0.5">
                Apollo 11 Moon Landing
              </span>
            </button>
          </div>
        </section>

        {/* 3 SYNCHRONIZED CALENDARS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Islamic Hijri */}
          <div className="p-5 rounded-2xl bg-[#090E1D] border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">🕋 Islamic Hijri</span>
              <span className="text-[10px] font-mono text-slate-500">Tabular civil · adjustable</span>
            </div>
            <div className="text-xl font-bold text-white">
              {calculations.hijriCalendar.day} {calculations.hijriCalendar.monthName}
            </div>
            <div className="text-sm font-mono text-amber-300">
              {calculations.hijriCalendar.year} AH
            </div>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              {calculations.isSightedPossible === SightingVisibility.EASY || calculations.isSightedPossible === SightingVisibility.CHALLENGING
                ? "Visibility prediction is not an official month-start declaration."
                : "Civil calendar estimate; follow local sighting announcements."}
            </p>
          </div>

          {/* Chinese Lunar */}
          <div className="p-5 rounded-2xl bg-[#090E1D] border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">🏮 Chinese Lunar</span>
              <span className="text-[10px] font-mono text-slate-500">Agricultural</span>
            </div>
            <div className="text-xl font-bold text-white">
              Month {calculations.chineseCalendar.month}, Day {calculations.chineseCalendar.day}
            </div>
            <div className="text-sm font-mono text-emerald-300">
              Year of the {calculations.chineseCalendar.animal}
            </div>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 font-mono">
              Solar Term: <span className="text-emerald-300 italic">{calculations.chineseCalendar.term}</span>
            </p>
          </div>

          {/* Hebrew */}
          <div className="p-5 rounded-2xl bg-[#090E1D] border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">✡️ Hebrew Calendar</span>
              <span className="text-[10px] font-mono text-slate-500">Metonic</span>
            </div>
            <div className="text-xl font-bold text-white">
              {calculations.hebrewCalendar.day} {calculations.hebrewCalendar.monthName}
            </div>
            <div className="text-sm font-mono text-blue-300">
              AM {calculations.hebrewCalendar.year}
            </div>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              Harmonizes lunar cycles with solar seasons through 19-year cycle.
            </p>
          </div>

        </section>

        {/* AI OBSERVATORY ADVICE */}
        <section className="p-6 rounded-2xl bg-[#090E1D]/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Astrometric Sighting Advice
              </h3>
            </div>
            <button
              onClick={() => fetchAiCommentary()}
              disabled={isAiLoading}
              className="btn-3d-slate px-3 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {isAiLoading ? (
            <div className="py-4 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Calculating station advisory...</span>
            </div>
          ) : aiCommentary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="font-semibold text-amber-400 uppercase text-[10px] font-mono block">
                  🔭 Where & When to Look
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {aiCommentary.celestialAdvice}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="font-semibold text-blue-400 uppercase text-[10px] font-mono block">
                  📜 Historical Context
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {aiCommentary.historicalContext}
                </p>
              </div>
            </div>
          ) : null}
        </section>

      </main>

      {/* CLEAN FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#070B16] py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span>🌙 LunaSync · Astronomical Moon Sighting Platform</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline text-slate-600">Odeh Criteria · ARCV & DAZ Telemetry</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsStationModalOpen(true)}
              className="text-amber-400/80 hover:text-amber-300 flex items-center gap-1.5 font-medium cursor-pointer transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Global Stations & Custom Coordinates</span>
            </button>
          </div>
        </div>
      </footer>

      {/* OBSERVER STATION SELECTOR MODAL */}
      <StationSelectorModal
        isOpen={isStationModalOpen}
        onClose={() => setIsStationModalOpen(false)}
        activeStation={activeLocation}
        onSelectStation={(st) => setCurrentStation(st)}
        savedStations={savedStations}
        onSaveStation={handleSaveStation}
        onDeleteSavedStation={handleDeleteSavedStation}
        onOpenDetails={(st) => {
          setStationForDetails(st);
          setIsDetailsModalOpen(true);
        }}
      />

      {/* STATION DETAILS MODAL */}
      <StationDetailsModal
        station={stationForDetails || currentStation}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onSelectStation={(st) => setCurrentStation(st)}
        isActiveStation={
          stationForDetails
            ? Math.abs(stationForDetails.latitude - activeLocation.latitude) < 0.001 &&
              Math.abs(stationForDetails.longitude - activeLocation.longitude) < 0.001
            : true
        }
      />

      {/* ADD CUSTOM CITY & COUNTRY MODAL */}
      <AddCustomCityModal
        isOpen={isAddCityModalOpen}
        onClose={() => setIsAddCityModalOpen(false)}
        onApplyStation={handleApplyCustomStation}
      />



    </div>
  );
}
