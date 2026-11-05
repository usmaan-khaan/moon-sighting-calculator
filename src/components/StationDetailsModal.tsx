import { useModalFocus } from './useModalFocus';
import React from "react";
import { 
  X, 
  MapPin, 
  Mountain, 
  Compass, 
  Eye, 
  Sparkles, 
  Clock, 
  Globe2, 
  Check, 
  Layers,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { ObserverStation } from "../data/stations";
import { getStationTelemetry, ObserverLocation } from "../utils/astronomy";

interface StationDetailsModalProps {
  station: ObserverStation | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectStation?: (station: ObserverStation) => void;
  isActiveStation?: boolean;
}

export const StationDetailsModal: React.FC<StationDetailsModalProps> = ({
  station,
  isOpen,
  onClose,
  onSelectStation,
  isActiveStation = false
}) => {
  const modalRef = useModalFocus(isOpen && !!station, onClose);
  if (!isOpen || !station) return null;

  const telemetry = getStationTelemetry({
    latitude: station.latitude,
    longitude: station.longitude,
    elevation: station.elevation,
    name: station.name
  });

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#0b1122] border border-slate-750 rounded-3xl shadow-2xl overflow-hidden"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Station Details"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-[#10172e] to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 shrink-0">
              {station.icon || "📍"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold tracking-wider">
                  {station.region} Station
                </span>
                {isActiveStation && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold tracking-wider flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Currently Active
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                {station.name}
              </h2>
              <p className="text-xs text-slate-400">
                {station.country} {station.observatory ? `· ${station.observatory}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {station.description && (
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">Observatory Overview: </strong>
              {station.description}
            </div>
          )}

          {/* SECTION 1: PRIMARY COORDINATES & ELEVATION */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Station Geodetic Telemetry
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90">
                <span className="text-[10px] text-slate-500 uppercase block">Decimal Lat</span>
                <span className="font-bold text-white text-sm">{station.latitude.toFixed(4)}°</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{telemetry.dmsLat}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90">
                <span className="text-[10px] text-slate-500 uppercase block">Decimal Lng</span>
                <span className="font-bold text-white text-sm">{station.longitude.toFixed(4)}°</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{telemetry.dmsLng}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90">
                <span className="text-[10px] text-slate-500 uppercase block">Elevation (h)</span>
                <span className="font-bold text-amber-300 text-sm">{station.elevation} m</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">({telemetry.elevationFt} ft)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90">
                <span className="text-[10px] text-slate-500 uppercase block">Solar Meridian</span>
                <span className="font-bold text-cyan-300 text-sm">{telemetry.solarOffsetStr}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Local Solar Noon</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: OPTICAL HORIZON & TOPOGRAPHIC ADVANTAGE */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5" />
              Horizon Geometry & Sighting Advantage
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-800/50">
                <span className="text-[10px] text-cyan-300/80 uppercase block">Horizon Dip Angle</span>
                <span className="font-bold text-cyan-300 text-base">-{telemetry.dipDegrees}°</span>
                <span className="text-[11px] text-slate-400 block mt-1 font-sans">
                  = -{telemetry.dipArcMin} arcminutes below astronomical horizon.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-800/50">
                <span className="text-[10px] text-emerald-300/80 uppercase block">Apparent Horizon Distance</span>
                <span className="font-bold text-emerald-300 text-base">{telemetry.horizonDistanceKm} km</span>
                <span className="text-[11px] text-slate-400 block mt-1 font-sans">
                  ({telemetry.horizonDistanceMiles} miles line-of-sight reach).
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-950 border border-amber-800/50">
                <span className="text-[10px] text-amber-300/80 uppercase block">Geometric timing scale</span>
                <span className="font-bold text-amber-300 text-base">+{telemetry.extraSightingMinutes} min</span>
                <span className="text-[11px] text-slate-400 block mt-1 font-sans">
                  Sea-level horizon estimate only; not an added Moon-Sun lag.
                </span>
              </div>
            </div>

            {/* Scientific Explanation Box */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2 font-sans">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Why Elevation Matters in Crescent Moonsighting
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Due to the curvature of the Earth, an observer standing at an altitude of <strong className="text-white">{station.elevation} meters</strong> has a theoretical sea-horizon dip of <strong className="text-cyan-300">{telemetry.dipDegrees}°</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>
                  <strong className="text-slate-200">Extended Visibility:</strong> For an unobstructed sea horizon, elevation can delay setting by approximately <span className="text-amber-300 font-semibold">{telemetry.extraSightingMinutes} minutes</span>. Local terrain is not modeled; this is not a guaranteed increase in crescent visibility.
                </li>
                <li>
                  <strong className="text-slate-200">Reduced Atmospheric Extinction:</strong> Elevated stations sit above the dense ground aerosol layer, cutting particulate scattering and enhancing contrast between the illuminated lunar cusp and the evening dusk sky.
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="btn-3d-slate px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>

          {onSelectStation && !isActiveStation && (
            <button
              onClick={() => {
                onSelectStation(station);
                onClose();
              }}
              className="btn-3d-amber px-5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Set as Active Station</span>
            </button>
          )}

          {isActiveStation && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
              <Check className="w-4 h-4" />
              Active Station
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
