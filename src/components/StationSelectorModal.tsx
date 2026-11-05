import { useModalFocus } from './useModalFocus';
import React, { useState, useMemo } from "react";
import { 
  Search, 
  MapPin, 
  Navigation, 
  Mountain, 
  Compass, 
  Sparkles, 
  Check, 
  Trash2, 
  X, 
  Info, 
  Bookmark, 
  Globe2, 
  Layers,
  ArrowRight,
  Eye
} from "lucide-react";
import { ObserverStation, COMMON_STATIONS } from "../data/stations";
import { ObserverLocation, getStationTelemetry, StationTelemetry } from "../utils/astronomy";

interface StationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStation: ObserverLocation;
  onSelectStation: (station: ObserverStation) => void;
  savedStations: ObserverStation[];
  onSaveStation: (station: ObserverStation) => void;
  onDeleteSavedStation: (stationId: string) => void;
  onOpenDetails: (station: ObserverStation) => void;
}

type TabType = "catalog" | "custom" | "saved";
type RegionFilter = "All" | "Middle East" | "Asia" | "Europe" | "Americas" | "Africa" | "Oceania";

export const StationSelectorModal: React.FC<StationSelectorModalProps> = ({
  isOpen,
  onClose,
  activeStation,
  onSelectStation,
  savedStations,
  onSaveStation,
  onDeleteSavedStation,
  onOpenDetails
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("All");

  // Custom station form state
  const [customName, setCustomName] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [customLat, setCustomLat] = useState<string>("21.4225");
  const [customLng, setCustomLng] = useState<string>("39.8262");
  const [customElevation, setCustomElevation] = useState<string>("277");
  const [formError, setFormError] = useState<string | null>(null);
  const [isGpsLocating, setIsGpsLocating] = useState(false);

  const modalRef = useModalFocus(isOpen, onClose);


  // Filter stations for the catalog tab
  const filteredStations = useMemo(() => {
    return COMMON_STATIONS.filter(st => {
      const matchesRegion = selectedRegion === "All" || st.region === selectedRegion;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesRegion;
      const matchesSearch = 
        st.name.toLowerCase().includes(q) ||
        st.shortName.toLowerCase().includes(q) ||
        st.country.toLowerCase().includes(q) ||
        (st.observatory && st.observatory.toLowerCase().includes(q)) ||
        st.region.toLowerCase().includes(q);
      return matchesRegion && matchesSearch;
    });
  }, [searchQuery, selectedRegion]);

  // Handle GPS detection
  const handleAutoGPS = () => {
    if (!navigator.geolocation) {
      setFormError("GPS geolocation is not supported in this browser.");
      return;
    }
    setIsGpsLocating(true);
    setFormError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomName("Current GPS Station");
        setCustomCountry("Local Coordinates");
        setCustomLat(pos.coords.latitude.toFixed(4));
        setCustomLng(pos.coords.longitude.toFixed(4));
        setCustomElevation(pos.coords.altitude ? Math.round(pos.coords.altitude).toString() : "25");
        setIsGpsLocating(false);
      },
      (err) => {
        setIsGpsLocating(false);
        setFormError(err.code === 1 ? "Permission denied. Please grant location access." : "Unable to acquire GPS coordinates.");
      },
      { timeout: 8000 }
    );
  };

  // Compute live preview telemetry for custom station
  const customTelemetry: StationTelemetry | null = useMemo(() => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    const elev = Number(customElevation);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }
    return getStationTelemetry({
      latitude: lat,
      longitude: lng,
      elevation: elev,
      name: customName || "Custom Station"
    });
  }, [customLat, customLng, customElevation, customName]);

  const validateAndBuildCustomStation = (saveToFavorites: boolean) => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    const elev = parseFloat(customElevation) || 0;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError("Latitude must be a valid number between -90 and +90 degrees.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError("Longitude must be a valid number between -180 and +180 degrees.");
      return;
    }
    if (isNaN(elev) || elev < 0 || elev > 9000) {
      setFormError("Elevation must be between 0 and 9,000 meters.");
      return;
    }

    const station: ObserverStation = {
      id: `custom_${Date.now()}`,
      name: customName.trim() || `Station (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
      shortName: customName.trim().slice(0, 16) || "Custom Station",
      country: customCountry.trim() || "Custom Site",
      region: "Middle East", // default bucket
      icon: "📍",
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lng.toFixed(4)),
      elevation: Math.round(elev),
      observatory: "Custom Observer Station",
      description: `User-defined observation point at ${Math.round(elev)}m elevation.`,
      isCustom: true
    };

    if (saveToFavorites) {
      onSaveStation(station);
    }
    onSelectStation(station);
    onClose();
  };

  if (!isOpen) return null;

  const REGIONS: { id: RegionFilter; label: string; count: number }[] = [
    { id: "All", label: "All Stations", count: COMMON_STATIONS.length },
    { id: "Middle East", label: "Middle East", count: COMMON_STATIONS.filter(s => s.region === "Middle East").length },
    { id: "Asia", label: "Asia", count: COMMON_STATIONS.filter(s => s.region === "Asia").length },
    { id: "Europe", label: "Europe", count: COMMON_STATIONS.filter(s => s.region === "Europe").length },
    { id: "Americas", label: "Americas", count: COMMON_STATIONS.filter(s => s.region === "Americas").length },
    { id: "Africa", label: "Africa", count: COMMON_STATIONS.filter(s => s.region === "Africa").length },
    { id: "Oceania", label: "Oceania", count: COMMON_STATIONS.filter(s => s.region === "Oceania").length },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0d1326] border border-slate-750 rounded-3xl shadow-2xl overflow-hidden"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Observer Station Directory"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Observer Station Directory
              </h2>
              <p className="text-xs text-slate-400">
                Choose from international observatories or configure your custom station coordinates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-4 border-b border-slate-800 bg-[#0A0F1D]/80">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "catalog"
                ? "border-amber-400 text-amber-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>Common Stations ({COMMON_STATIONS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "custom"
                ? "border-blue-400 text-blue-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Custom Station Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "saved"
                ? "border-emerald-400 text-emerald-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Stations ({savedStations.length})</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* TAB 1: CATALOG OF COMMON STATIONS */}
          {activeTab === "catalog" && (
            <div className="space-y-4">
              {/* Search & Region Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search station name, city, observatory, or country..."
                    className="w-full bg-slate-900/90 border border-slate-750 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Region Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                  {REGIONS.map((reg) => (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => setSelectedRegion(reg.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedRegion === reg.id
                          ? "bg-amber-400/25 text-amber-300 border border-amber-400/50 font-bold shadow-sm"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <span>{reg.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                        selectedRegion === reg.id ? "bg-amber-400 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
                      }`}>
                        {reg.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {filteredStations.map((station) => {
                  const isActive = 
                    Math.abs(station.latitude - activeStation.latitude) < 0.001 &&
                    Math.abs(station.longitude - activeStation.longitude) < 0.001;

                  const telemetry = getStationTelemetry(station);

                  return (
                    <div
                      key={station.id}
                      onClick={() => {
                        onSelectStation(station);
                        onClose();
                      }}
                      className={`group relative p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-br from-amber-950/40 to-slate-900/90 border-amber-500/60 shadow-lg shadow-amber-950/30 ring-1 ring-amber-400/30"
                          : "bg-slate-900/70 border-slate-800/90 hover:border-amber-400/50 hover:bg-slate-900/90 hover:shadow-md"
                      }`}
                    >
                      {/* Top row */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{station.icon}</span>
                            <div>
                              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                                {station.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-medium">
                                {station.country} · <span className="text-slate-500">{station.region}</span>
                              </p>
                            </div>
                          </div>
                          
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>

                        {station.observatory && (
                          <p className="text-[11px] text-amber-400/80 font-mono mt-1.5 line-clamp-1">
                            🔭 {station.observatory}
                          </p>
                        )}

                        {/* Coordinates and Elevation Metrics */}
                        <div className="grid grid-cols-3 gap-2 mt-2.5 text-[10px] font-mono text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Elevation</span>
                            <span className="font-bold text-white">{station.elevation} m</span>
                            <span className="text-slate-500 block text-[9px]">({telemetry.elevationFt} ft)</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Horizon Dip</span>
                            <span className="font-bold text-cyan-300">-{telemetry.dipDegrees}°</span>
                            <span className="text-slate-500 block text-[9px]">({telemetry.dipArcMin}')</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Coordinates</span>
                            <span className="font-bold text-slate-200 block truncate" title={`${station.latitude}°, ${station.longitude}°`}>
                              {station.latitude.toFixed(2)}°, {station.longitude.toFixed(2)}°
                            </span>
                            <span className="text-slate-500 block text-[9px]">{telemetry.solarOffsetStr}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStation(station);
                            onClose();
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                            isActive
                              ? "btn-3d-active"
                              : "btn-3d-amber"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isActive ? "Active Station" : "Select Station"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetails(station);
                          }}
                          className="btn-3d-slate py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1"
                          title="View Station Astronomical Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredStations.length === 0 && (
                <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <p className="text-sm">No stations found matching "{searchQuery}".</p>
                  <button
                    onClick={() => { setSearchQuery(""); setSelectedRegion("All"); }}
                    className="mt-2 text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOM STATION BUILDER */}
          {activeTab === "custom" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Define Any Custom Observatory Station</span>
                    <span className="text-slate-300">
                      Enter your exact rooftop, backyard, or local observatory coordinates and altitude.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoGPS}
                  disabled={isGpsLocating}
                  className="btn-3d-blue px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isGpsLocating ? "animate-spin" : ""}`} />
                  <span>{isGpsLocating ? "Acquiring GPS..." : "Auto-Fill via GPS"}</span>
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-medium">
                  {formError}
                </div>
              )}

              {/* Custom Input Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>Station Name</span>
                    <span className="text-slate-500 font-normal">(e.g. My Rooftop Station)</span>
                  </label>
                  <input
                    type="text"
                    aria-label="Station name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Al-Quds Observation Post"
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>Country / City</span>
                    <span className="text-slate-500 font-normal">(Optional tag)</span>
                  </label>
                  <input
                    type="text"
                    aria-label="Country"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    placeholder="e.g. Jordan / Amman"
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Latitude (Decimal Degrees)</span>
                    <span className="text-[10px] text-slate-500 font-mono">-90.0° to +90.0°</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    aria-label="Latitude"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="e.g. 21.4225"
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Longitude (Decimal Degrees)</span>
                    <span className="text-[10px] text-slate-500 font-mono">-180.0° to +180.0°</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    aria-label="Longitude"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="e.g. 39.8262"
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mountain className="w-3.5 h-3.5 text-amber-400" />
                      Station Elevation (meters above sea level)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Affects horizon dip & sighting lag</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="8848"
                      aria-label="Elevation in meters"
                    value={customElevation}
                      onChange={(e) => setCustomElevation(e.target.value)}
                      placeholder="e.g. 277"
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl pl-3.5 pr-20 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                      meters
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE TELEMETRY PREVIEW */}
              {customTelemetry && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Calculated Station Telemetry
                    </span>
                    <span className="text-slate-400">{customTelemetry.solarOffsetStr}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">DMS Latitude</span>
                      <span className="text-white font-bold">{customTelemetry.dmsLat}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">DMS Longitude</span>
                      <span className="text-white font-bold">{customTelemetry.dmsLng}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Horizon Dip Angle</span>
                      <span className="text-cyan-400 font-bold">-{customTelemetry.dipDegrees}° ({customTelemetry.dipArcMin}')</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Horizon Line-of-Sight</span>
                      <span className="text-emerald-400 font-bold">{customTelemetry.horizonDistanceKm} km ({customTelemetry.horizonDistanceMiles} mi)</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-1 font-sans">
                    💡 <strong className="text-slate-200">Elevation Advantage:</strong> Because your station is elevated by {customTelemetry.elevationMeters}m ({customTelemetry.elevationFt} ft), the true optical horizon drops by {customTelemetry.dipDegrees}°, extending crescent visibility by approximately <strong className="text-amber-300">+{customTelemetry.extraSightingMinutes} minutes</strong> compared to a sea-level observer.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => validateAndBuildCustomStation(true)}
                  className="btn-3d-emerald w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Save & Apply Custom Station</span>
                </button>

                <button
                  type="button"
                  onClick={() => validateAndBuildCustomStation(false)}
                  className="btn-3d-blue w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Apply Only (Don't Save)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED STATIONS */}
          {activeTab === "saved" && (
            <div className="space-y-4">
              {savedStations.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
                  <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-medium text-slate-300">No custom stations saved yet.</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You can configure your local observing post or rooftop in the Custom Station Builder tab and save it for future sightings.
                  </p>
                  <button
                    onClick={() => setActiveTab("custom")}
                    className="btn-3d-blue px-4 py-2 rounded-xl text-xs font-bold cursor-pointer mt-2"
                  >
                    Create Custom Station
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {savedStations.map((station) => {
                    const isActive = 
                      Math.abs(station.latitude - activeStation.latitude) < 0.001 &&
                      Math.abs(station.longitude - activeStation.longitude) < 0.001;
                    const telemetry = getStationTelemetry(station);

                    return (
                      <div
                        key={station.id}
                        onClick={() => {
                          onSelectStation(station);
                          onClose();
                        }}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                          isActive
                            ? "bg-slate-900/90 border-emerald-500/60 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-400/30"
                            : "bg-slate-900/70 border-slate-800 hover:border-emerald-400/50 hover:bg-slate-900"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">📍</span>
                              <div>
                                <h4 className="text-sm font-bold text-white">{station.name}</h4>
                                <p className="text-[11px] text-slate-400">{station.country}</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSavedStation(station.id);
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete Saved Station"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-2.5 text-[10px] font-mono text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Elevation</span>
                              <span className="font-bold text-white">{station.elevation} m</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Horizon Dip</span>
                              <span className="font-bold text-cyan-300">-{telemetry.dipDegrees}°</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Coordinates</span>
                              <span className="font-bold text-slate-200 block truncate">
                                {station.latitude.toFixed(2)}°, {station.longitude.toFixed(2)}°
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStation(station);
                              onClose();
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                              isActive
                                ? "btn-3d-active"
                                : "btn-3d-emerald"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isActive ? "Active Station" : "Select Station"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDetails(station);
                            }}
                            className="btn-3d-slate py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1"
                            title="View Station Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active: <strong className="text-white">{activeStation.name}</strong> ({activeStation.elevation}m)</span>
          </div>
          <button
            onClick={onClose}
            className="btn-3d-slate px-4 py-1.5 rounded-xl text-xs cursor-pointer font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
