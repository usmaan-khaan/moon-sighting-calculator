import { useModalFocus } from './useModalFocus';
import React, { useState, useMemo } from "react";
import { 
  X, 
  MapPin, 
  Navigation, 
  Search, 
  Check, 
  Globe2, 
  Sparkles,
  Bookmark
} from "lucide-react";
import { ObserverStation } from "../data/stations";
import { GLOBAL_CITIES_PRESETS, GlobalCityPreset } from "../data/citiesDirectory";
import { getStationTelemetry } from "../utils/astronomy";

interface AddCustomCityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStation: (station: ObserverStation, saveToFavorites: boolean) => void;
}

export const AddCustomCityModal: React.FC<AddCustomCityModalProps> = ({
  isOpen,
  onClose,
  onApplyStation
}) => {
  const [activeTab, setActiveTab] = useState<"search" | "manual">("search");
  const [citySearchQuery, setCitySearchQuery] = useState("");
  
  // Custom manual fields
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState<"Americas" | "Middle East" | "Asia" | "Europe" | "Africa" | "Oceania">("Americas");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [elevation, setElevation] = useState("50");
  const [saveToFavorites, setSaveToFavorites] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Filter presets
  const filteredPresets = useMemo(() => {
    const q = citySearchQuery.toLowerCase().trim();
    if (!q) return GLOBAL_CITIES_PRESETS.slice(0, 14); // show popular highlights first
    return GLOBAL_CITIES_PRESETS.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q)
    );
  }, [citySearchQuery]);

  const modalRef = useModalFocus(isOpen, onClose);
  if (!isOpen) return null;

  // Handle GPS Auto-detect
  const handleAutoGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }
    setIsGpsLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setName("My Local Station");
        setCountry("Local Area");
        setLatitude(pos.coords.latitude.toFixed(4));
        setLongitude(pos.coords.longitude.toFixed(4));
        setElevation(pos.coords.altitude ? Math.round(pos.coords.altitude).toString() : "35");
        setActiveTab("manual");
        setIsGpsLoading(false);
      },
      (err) => {
        setIsGpsLoading(false);
        setErrorMsg(err.code === 1 ? "Permission denied. Please allow location in browser." : "Unable to acquire GPS coordinates.");
      },
      { timeout: 8000 }
    );
  };

  // Quick Apply from Preset
  const handleSelectPreset = (preset: GlobalCityPreset) => {
    const station: ObserverStation = {
      id: `preset_${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      name: `${preset.name} (${preset.observatory})`,
      shortName: preset.name.split(",")[0].trim(),
      country: preset.country,
      region: preset.region,
      icon: preset.region === "Americas" ? "🇺🇸" : preset.region === "Middle East" ? "🌙" : "📍",
      latitude: preset.latitude,
      longitude: preset.longitude,
      elevation: preset.elevation,
      observatory: preset.observatory,
      description: `Observer station for ${preset.name}, ${preset.country} (${preset.elevation}m elevation).`,
      isCustom: true
    };
    onApplyStation(station, true);
    onClose();
  };

  // Submit manual entry
  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const elev = Number(elevation);

    if (!name.trim()) {
      setErrorMsg("Please enter a city or station name.");
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setErrorMsg("Latitude must be between -90.0° and +90.0°.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setErrorMsg("Longitude must be between -180.0° and +180.0°.");
      return;
    }
    if (isNaN(elev) || elev < 0 || elev > 9000) {
      setErrorMsg("Elevation must be between 0 and 9,000 meters.");
      return;
    }

    const customStation: ObserverStation = {
      id: `custom_${Date.now()}`,
      name: `${name.trim()} Station`,
      shortName: name.trim().slice(0, 16),
      country: country.trim() || "Custom Site",
      region: region,
      icon: "📍",
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lng.toFixed(4)),
      elevation: Math.round(elev),
      observatory: "Custom Observer Station",
      description: `User-defined station in ${country || "Custom Site"} at ${Math.round(elev)}m altitude.`,
      isCustom: true
    };

    onApplyStation(customStation, saveToFavorites);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0c1224] border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add Any City or Country"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Add Any City or Country
              </h2>
              <p className="text-xs text-slate-400">
                Choose any city like Dallas, Houston, Miami, Chicago, or type your exact location
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-[#090e1d]">
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "search"
                ? "border-amber-400 text-amber-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search World Cities (Dallas, Houston, Miami...)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "manual"
                ? "border-blue-400 text-blue-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Custom Coordinates / GPS</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: PRESET SEARCH */}
          {activeTab === "search" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  placeholder="Type city or country (e.g. Dallas, Houston, Miami, Orlando, Chicago, Lahore)..."
                  className="w-full bg-slate-900 border border-slate-750 focus:border-amber-400 text-white rounded-xl pl-10 pr-9 py-2.5 text-xs placeholder-slate-500 focus:outline-none"
                  autoFocus
                />
                {citySearchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setCitySearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Presets List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredPresets.map((city, idx) => (
                  <div
                    key={`${city.name}_${idx}`}
                    onClick={() => handleSelectPreset(city)}
                    className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800/80 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 shrink-0">
                        📍
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {city.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-800 text-slate-400">
                            {city.country}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {city.observatory} · <span className="text-amber-400/90">{city.elevation}m altitude</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPreset(city);
                      }}
                      className="btn-3d-amber px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                    >
                      Select
                    </button>
                  </div>
                ))}

                {filteredPresets.length === 0 && (
                  <div className="p-6 text-center text-slate-400 space-y-2">
                    <p className="text-xs">No city found for "{citySearchQuery}".</p>
                    <button
                      type="button"
                      onClick={() => {
                        setName(citySearchQuery);
                        setActiveTab("manual");
                      }}
                      className="btn-3d-blue px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Enter Coordinates for "{citySearchQuery}" Manually
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL COORDINATES / GPS */}
          {activeTab === "manual" && (
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Want to use your device's exact location right now?</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoGPS}
                  disabled={isGpsLoading}
                  className="btn-3d-blue px-3 py-1 rounded-lg text-xs font-bold cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isGpsLoading ? "Detecting..." : "Auto-Fill via GPS"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">City / Station Name *</label>
                  <input
                    type="text"
                    aria-label="City or station name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dallas, TX or Miami Beach"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-400 text-white rounded-xl px-3.5 py-2"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Country / State</label>
                  <input
                    type="text"
                    aria-label="Country or state"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United States"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-400 text-white rounded-xl px-3.5 py-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Region Bucket</label>
                  <select
                    aria-label="Region"
                    value={region}
                    onChange={(e: any) => setRegion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3.5 py-2"
                  >
                    <option value="Americas">Americas (USA, Canada, etc.)</option>
                    <option value="Middle East">Middle East</option>
                    <option value="Asia">Asia & South Asia</option>
                    <option value="Europe">Europe</option>
                    <option value="Africa">Africa</option>
                    <option value="Oceania">Oceania</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Elevation in Meters (h)</label>
                  <input
                    type="number"
                    aria-label="Elevation in meters"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                    placeholder="e.g. 131 for Dallas, 15 for Houston"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-400 font-mono text-white rounded-xl px-3.5 py-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 flex justify-between">
                    <span>Latitude (Decimal) *</span>
                    <span className="text-[10px] text-slate-500 font-mono">-90° to +90°</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    aria-label="Latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 32.7767 (Dallas) or 29.7604 (Houston)"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-400 font-mono text-white rounded-xl px-3.5 py-2"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 flex justify-between">
                    <span>Longitude (Decimal) *</span>
                    <span className="text-[10px] text-slate-500 font-mono">-180° to +180°</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    aria-label="Longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. -96.7970 (Dallas) or -95.3698 (Houston)"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-400 font-mono text-white rounded-xl px-3.5 py-2"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToFavorites}
                    onChange={(e) => setSaveToFavorites(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-400 focus:ring-0 cursor-pointer"
                  />
                  <span>Save this station to My Saved Stations</span>
                </label>

                <button
                  type="submit"
                  className="btn-3d-amber px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply & Observe</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: You can search or add any custom city, county, or village in the world.</span>
          <button
            type="button"
            onClick={onClose}
            className="btn-3d-slate px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
