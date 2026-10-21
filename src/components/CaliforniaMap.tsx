import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ZoomLevel, ProgressMetric } from '../types/tracker';
import { COUNTY_TO_REGION, REGION_METADATA } from '../utils/californiaRegions';
import { RotateCcw, ChevronRight, ArrowLeft } from 'lucide-react';

interface CaliforniaMapProps {
  geoJson: GeoJSON.FeatureCollection | null;
  zoomLevel: ZoomLevel;
  selectedRegion: string | null;
  selectedCounty: string | null;
  getCountyProgress: (countyName: string) => ProgressMetric;
  onSelectRegion: (regionName: string) => void;
  onSelectCounty: (countyName: string) => void;
  onResetToState: () => void;
}

// Bounding box for California statewide view
const CA_STATE_BOUNDS: L.LatLngBoundsExpression = [
  [32.53, -124.41],
  [42.01, -114.13],
];

export const CaliforniaMap: React.FC<CaliforniaMapProps> = ({
  geoJson,
  zoomLevel,
  selectedRegion,
  selectedCounty,
  getCountyProgress,
  onSelectRegion,
  onSelectCounty,
  onResetToState,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 5,
      maxZoom: 14,
    });

    // High quality basemap: CartoDB Voyager with API key or OpenStreetMap fallback
    const apiKey = import.meta.env.VITE_CARTO_API_KEY;
    const tileUrl = apiKey
      ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${apiKey}`
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: apiKey
        ? '&copy; CARTO &copy; OpenStreetMap'
        : '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Zoom control at bottom right to keep top clear for breadcrumbs
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.fitBounds(CA_STATE_BOUNDS, { padding: [16, 16] });
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Compute styling for each county feature
  const getFeatureStyle = useCallback(
    (feature: GeoJSON.Feature): L.PathOptions => {
      const countyName = feature.properties?.name as string;
      const regionName = COUNTY_TO_REGION[countyName] || 'Other';
      const regionMeta = REGION_METADATA[regionName];
      const countyProg = getCountyProgress(countyName);

      const isCompleted = countyProg.total > 0 && countyProg.completed === countyProg.total;
      const isPartial = countyProg.completed > 0 && !isCompleted;
      const isCurrentCounty = selectedCounty === countyName;
      const isInCurrentRegion = selectedRegion === regionName;

      // Base color
      let fillColor = regionMeta?.accentColor || '#94a3b8';
      let fillOpacity = 0.22;
      let strokeColor = '#94a3b8';
      let strokeWidth = 1;

      if (isCompleted) {
        fillColor = '#10b981'; // Emerald 500
        fillOpacity = 0.55;
        strokeColor = '#059669';
      } else if (isPartial) {
        fillColor = '#38bdf8'; // Sky 400
        fillOpacity = 0.35;
        strokeColor = '#0284c7';
      }

      // Highlight active context
      if (zoomLevel === 'region' && isInCurrentRegion) {
        fillOpacity = Math.max(fillOpacity, 0.45);
        strokeColor = '#1e293b';
        strokeWidth = 1.5;
      }

      if (isCurrentCounty) {
        fillColor = isCompleted ? '#10b981' : '#6366f1';
        fillOpacity = 0.65;
        strokeColor = '#312e81';
        strokeWidth = 2.5;
      }

      return {
        fillColor,
        fillOpacity,
        color: strokeColor,
        weight: strokeWidth,
        opacity: 0.95,
      };
    },
    [getCountyProgress, selectedCounty, selectedRegion, zoomLevel]
  );

  // Render and update GeoJSON Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJson) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const layer = L.geoJSON(geoJson, {
      style: (feature) => (feature ? getFeatureStyle(feature) : {}),
      onEachFeature: (feature, countyLayer) => {
        const countyName = feature.properties?.name as string;
        const regionName = COUNTY_TO_REGION[countyName] || 'Unknown';
        const prog = getCountyProgress(countyName);

        // Tooltip
        countyLayer.bindTooltip(
          `
          <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.4; color: #0f172a;">
            <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${countyName} County</div>
            <div style="color: #64748b; font-size: 11px;">Region: ${regionName}</div>
            <div style="margin-top: 5px; font-weight: 600; color: ${
              prog.completed === prog.total && prog.total > 0 ? '#059669' : '#2563eb'
            }">
              ${prog.completed} / ${prog.total} Districts (${prog.percentage}%)
            </div>
          </div>
          `,
          { sticky: true, opacity: 0.98, className: 'map-county-tooltip' }
        );

        // Click interaction
        countyLayer.on('click', () => {
          if (zoomLevel === 'state') {
            onSelectRegion(regionName);
          } else {
            onSelectCounty(countyName);
          }
        });

        // Hover interaction
        countyLayer.on('mouseover', (e) => {
          const target = e.target as L.Path;
          target.setStyle({
            weight: 2.5,
            color: '#0f172a',
            fillOpacity: 0.8,
          });
        });

        countyLayer.on('mouseout', (e) => {
          const target = e.target as L.Path;
          layer.resetStyle(target);
        });
      },
    });

    layer.addTo(map);
    geoJsonLayerRef.current = layer;
  }, [geoJson, getFeatureStyle, getCountyProgress, onSelectCounty, onSelectRegion, zoomLevel]);

  // Adjust camera bounds smoothly when navigation changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const geoLayer = geoJsonLayerRef.current;
    if (!map || !geoLayer) return;

    if (zoomLevel === 'state' || (!selectedRegion && !selectedCounty)) {
      map.flyToBounds(CA_STATE_BOUNDS, {
        padding: [20, 20],
        duration: 0.8,
      });
      return;
    }

    if (zoomLevel === 'county' && selectedCounty) {
      // Find county layer
      let countyBounds: L.LatLngBounds | null = null;
      geoLayer.eachLayer((layer: unknown) => {
        const poly = layer as L.Polygon & { feature?: GeoJSON.Feature };
        if (poly.feature?.properties?.name === selectedCounty) {
          countyBounds = poly.getBounds();
        }
      });

      if (countyBounds) {
        map.flyToBounds(countyBounds, {
          padding: [40, 40],
          maxZoom: 11,
          duration: 0.9,
        });
      }
      return;
    }

    if (zoomLevel === 'region' && selectedRegion) {
      // Find combined bounds of all counties in the region
      let regionBounds: L.LatLngBounds | null = null;
      geoLayer.eachLayer((layer: unknown) => {
        const poly = layer as L.Polygon & { feature?: GeoJSON.Feature };
        const name = poly.feature?.properties?.name;
        if (name && COUNTY_TO_REGION[name] === selectedRegion) {
          if (!regionBounds) {
            regionBounds = poly.getBounds();
          } else {
            regionBounds.extend(poly.getBounds());
          }
        }
      });

      if (regionBounds) {
        map.flyToBounds(regionBounds, {
          padding: [30, 30],
          maxZoom: 9,
          duration: 0.9,
        });
      }
    }
  }, [zoomLevel, selectedRegion, selectedCounty]);

  // Zoom back out one level
  const handleBackOneLevel = () => {
    if (zoomLevel === 'county' && selectedRegion) {
      onSelectRegion(selectedRegion);
    } else {
      onResetToState();
    }
  };

  const currentRegionMeta = selectedRegion ? REGION_METADATA[selectedRegion] : null;

  return (
    <div className="map-view-wrapper">
      {/* Floating Top Header: Breadcrumbs & Granularity Level */}
      <div className="map-floating-header">
        <div className="map-breadcrumbs">
          {zoomLevel !== 'state' && (
            <button
              onClick={handleBackOneLevel}
              className="map-nav-btn back-btn"
              title="Back one level"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={onResetToState}
            className={`breadcrumb-item ${zoomLevel === 'state' ? 'active' : ''}`}
          >
            California
          </button>

          {selectedRegion && (
            <>
              <ChevronRight size={14} className="breadcrumb-separator" />
              <button
                onClick={() => onSelectRegion(selectedRegion)}
                className={`breadcrumb-item ${zoomLevel === 'region' ? 'active' : ''}`}
              >
                {selectedRegion}
              </button>
            </>
          )}

          {selectedCounty && (
            <>
              <ChevronRight size={14} className="breadcrumb-separator" />
              <span className="breadcrumb-item active">{selectedCounty} County</span>
            </>
          )}
        </div>

        {/* Level Indicator Badge */}
        <div className="map-level-badge">
          <span className={`depth-dot depth-${zoomLevel}`} />
          <span className="depth-label">
            {zoomLevel === 'state' && 'Level 1: Statewide (10 Regions)'}
            {zoomLevel === 'region' && `Level 2: ${selectedRegion} Region`}
            {zoomLevel === 'county' && `Level 3: ${selectedCounty} County`}
          </span>
          {zoomLevel !== 'state' && (
            <button
              onClick={onResetToState}
              className="map-nav-btn reset-btn"
              title="Reset view to California statewide"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Actual Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="map-leaflet-container" />

      {/* Floating Bottom Legend */}
      <div className="map-floating-legend">
        <div className="legend-item">
          <span className="legend-color-box completed-box" />
          <span>Completed (100%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-box partial-box" />
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-box pending-box" />
          <span>Pending</span>
        </div>
        {currentRegionMeta && (
          <div className="legend-item current-region-pill">
            <span
              className="legend-color-box"
              style={{ backgroundColor: currentRegionMeta.accentColor }}
            />
            <span>{currentRegionMeta.shortName}</span>
          </div>
        )}
      </div>
    </div>
  );
};
