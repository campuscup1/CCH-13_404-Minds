import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';

export const METRO_CENTER = [12.9352, 77.6250];

// Safe converter for [lat, lng], {lat, lon}, or {lat, lng}
export const toLatLng = (c) => {
  if (!c) return null;
  if (Array.isArray(c)) return [Number(c[0]), Number(c[1])];
  if (c.lat !== undefined && c.lon !== undefined) return [Number(c.lat), Number(c.lon)];
  if (c.lat !== undefined && c.lng !== undefined) return [Number(c.lat), Number(c.lng)];
  return null;
};

// Helper component to center and fit bounds dynamically
function ChangeView({ bounds, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid && bounds.isValid()) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch (e) {
        if (center) map.setView(center, zoom || 14);
      }
    } else if (center) {
      map.setView(center, zoom || 14);
    }
  }, [bounds, center, zoom, map]);
  return null;
}

// Map Click Listener component for picking emergency location
function LocationPickerListener({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

// Custom DivIcons for crisp SVG rendering without missing image asset errors
const createCustomIcon = (bgColor, iconSvg, size = [36, 36]) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: ${size[0]}px;
        height: ${size[1]}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        border: 2.5px solid white;
        color: white;
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2]
  });
};

export const ambulanceIcon = createCustomIcon(
  '#2563EB',
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4"/><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v7a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 8h4"/><path d="M11 6v4"/></svg>`
);

export const patientIcon = createCustomIcon(
  '#EF4444',
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`
);

export const hospitalIcon = createCustomIcon(
  '#059669',
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M10 9h4"/><path d="M12 7v4"/></svg>`
);

export const stationIcon = createCustomIcon(
  '#102A43',
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`
);

export const blockedIcon = createCustomIcon(
  '#DC2626',
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>`
);

export default function MapView({
  center = METRO_CENTER,
  zoom = 13,
  markers = [],
  routeCoords = [],
  blockedRouteCoords = [],
  alternativeRouteCoords = [],
  onLocationSelect,
  selectedLocation,
  height = '500px',
  className = ''
}) {
  // Normalize polylines
  const safeRouteCoords = (routeCoords || []).map(toLatLng).filter(Boolean);
  const safeBlockedCoords = (blockedRouteCoords || []).map(toLatLng).filter(Boolean);
  const safeAltCoords = (alternativeRouteCoords || []).map(toLatLng).filter(Boolean);

  // Compute bounds if coordinates exist
  let allCoords = [];
  if (safeRouteCoords.length > 0) allCoords.push(...safeRouteCoords);
  if (safeAltCoords.length > 0) allCoords.push(...safeAltCoords);
  if (markers && markers.length > 0) {
    markers.forEach(m => {
      const pt = toLatLng(m.coords);
      if (pt) allCoords.push(pt);
    });
  }

  const bounds = allCoords.length > 1 ? L.latLngBounds(allCoords) : null;
  const safeSelectedLocation = toLatLng(selectedLocation);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <ChangeView bounds={bounds} center={center} zoom={zoom} />

        {onLocationSelect && <LocationPickerListener onLocationSelect={onLocationSelect} />}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Selected location marker */}
        {safeSelectedLocation && (
          <Marker position={safeSelectedLocation} icon={patientIcon}>
            <Popup>
              <div className="text-xs p-1">
                <p className="font-bold text-red-600">Selected Incident Location</p>
                <p>
                  Lat: {safeSelectedLocation[0].toFixed(4)}, Lng: {safeSelectedLocation[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render markers */}
        {markers.map((m, idx) => {
          const pt = toLatLng(m.coords);
          if (!pt) return null;

          let icon = ambulanceIcon;
          if (m.type === 'patient' || m.type === 'emergency') icon = patientIcon;
          if (m.type === 'hospital') icon = hospitalIcon;
          if (m.type === 'station') icon = stationIcon;
          if (m.type === 'block') icon = blockedIcon;

          return (
            <Marker key={m.id || idx} position={pt} icon={m.customIcon || icon}>
              <Popup>
                <div className="text-xs p-1 max-w-[200px]">
                  <p className="font-bold text-slate-900">{m.title}</p>
                  {m.subtitle && <p className="text-slate-600 mt-0.5">{m.subtitle}</p>}
                  {m.badge && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {m.badge}
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Primary Route Polyline (Standard Medical Blue) */}
        {safeRouteCoords.length > 0 && (
          <Polyline
            positions={safeRouteCoords}
            pathOptions={{
              color: '#2563EB',
              weight: 6,
              opacity: 0.85,
              lineJoin: 'round'
            }}
          />
        )}

        {/* Blocked Route Polyline (Dashed Crimson Red) */}
        {safeBlockedCoords.length > 0 && (
          <Polyline
            positions={safeBlockedCoords}
            pathOptions={{
              color: '#DC2626',
              weight: 5,
              opacity: 0.75,
              dashArray: '8, 8'
            }}
          />
        )}

        {/* Alternative Detour Polyline (Emerald Green) */}
        {safeAltCoords.length > 0 && (
          <Polyline
            positions={safeAltCoords}
            pathOptions={{
              color: '#059669',
              weight: 6,
              opacity: 0.9,
              lineJoin: 'round'
            }}
          />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-md text-[11px] space-y-1">
        <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider">
          Map Legend
        </span>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
          <span className="text-slate-600">Ambulance Fleet</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
          <span className="text-slate-600">Emergency / Patient</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
          <span className="text-slate-600">Hospital Facility</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#102A43] inline-block" />
          <span className="text-slate-600">Ambulance Station</span>
        </div>
      </div>
    </div>
  );
}
