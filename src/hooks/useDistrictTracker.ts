import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  HierarchyData,
  DistrictEntity,
  ProgressMetric,
  ZoomLevel,
  FilterStatus,
} from '../types/tracker';
import { COUNTY_TO_REGION } from '../utils/californiaRegions';

const STORAGE_KEY = 'ca_district_tracker_completed_v1';

export function useDistrictTracker() {
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null);
  const [geoJson, setGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Set of completed CDS codes
  const [completedDistricts, setCompletedDistricts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set<string>(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load completed districts from localStorage:', e);
    }
    return new Set<string>();
  });

  // Navigation & Zoom State
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('state');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Persist completed districts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completedDistricts)));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [completedDistricts]);

  // Load datasets on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const baseUrl = import.meta.env.BASE_URL.endsWith('/')
          ? import.meta.env.BASE_URL
          : `${import.meta.env.BASE_URL}/`;

        const [hierarchyRes, geoRes] = await Promise.all([
          fetch(`${baseUrl}data/recruitment_hierarchy.json`),
          fetch(`${baseUrl}geo/ca_counties.geojson`),
        ]);

        if (!hierarchyRes.ok) throw new Error('Failed to load hierarchy data');
        if (!geoRes.ok) throw new Error('Failed to load GeoJSON');

        const rawHierarchy: any = await hierarchyRes.json();
        const geoData: GeoJSON.FeatureCollection = await geoRes.json();

        // Index districts by cds_code for instant O(1) lookups
        const districtMap: Record<string, DistrictEntity> = {};
        if (Array.isArray(rawHierarchy.districts)) {
          for (const d of rawHierarchy.districts) {
            districtMap[d.cds_code] = d;
          }
        } else if (rawHierarchy.districts && typeof rawHierarchy.districts === 'object') {
          Object.assign(districtMap, rawHierarchy.districts);
        }

        const hierarchyData: HierarchyData = {
          ...rawHierarchy,
          districts: districtMap,
        };

        if (isMounted) {
          setHierarchy(hierarchyData);
          setGeoJson(geoData);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error loading data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check if a district is completed
  const isDistrictCompleted = useCallback(
    (cdsCode: string): boolean => {
      return completedDistricts.has(cdsCode);
    },
    [completedDistricts]
  );

  // Toggle single district
  const toggleDistrict = useCallback((cdsCode: string) => {
    setCompletedDistricts((prev) => {
      const next = new Set(prev);
      if (next.has(cdsCode)) {
        next.delete(cdsCode);
      } else {
        next.add(cdsCode);
      }
      return next;
    });
  }, []);

  // County progress calculation
  const getCountyProgress = useCallback(
    (countyName: string): ProgressMetric => {
      if (!hierarchy || !hierarchy.counties[countyName]) {
        return { completed: 0, total: 0, percentage: 0 };
      }
      const county = hierarchy.counties[countyName];
      const total = county.districts.length;
      let completed = 0;
      for (const cds of county.districts) {
        if (completedDistricts.has(cds)) completed++;
      }
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { completed, total, percentage };
    },
    [hierarchy, completedDistricts]
  );

  // Region progress calculation
  const getRegionProgress = useCallback(
    (regionName: string): ProgressMetric => {
      if (!hierarchy || !hierarchy.regions[regionName]) {
        return { completed: 0, total: 0, percentage: 0 };
      }
      const region = hierarchy.regions[regionName];
      let total = 0;
      let completed = 0;
      for (const countyName of region.counties) {
        const c = hierarchy.counties[countyName];
        if (c) {
          total += c.districts.length;
          for (const cds of c.districts) {
            if (completedDistricts.has(cds)) completed++;
          }
        }
      }
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { completed, total, percentage };
    },
    [hierarchy, completedDistricts]
  );

  // Statewide progress
  const statewideProgress = useMemo((): ProgressMetric => {
    if (!hierarchy) return { completed: 0, total: 0, percentage: 0 };
    const total = hierarchy.total_districts || Object.keys(hierarchy.districts).length;
    const completed = completedDistricts.size;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [hierarchy, completedDistricts]);

  // Toggle all districts in a county
  const toggleCounty = useCallback(
    (countyName: string, forceComplete?: boolean) => {
      if (!hierarchy || !hierarchy.counties[countyName]) return;
      const districtCodes = hierarchy.counties[countyName].districts;
      setCompletedDistricts((prev) => {
        const next = new Set(prev);
        const shouldComplete =
          forceComplete !== undefined
            ? forceComplete
            : !districtCodes.every((code) => next.has(code));

        for (const code of districtCodes) {
          if (shouldComplete) {
            next.add(code);
          } else {
            next.delete(code);
          }
        }
        return next;
      });
    },
    [hierarchy]
  );

  // Toggle all districts in a region
  const toggleRegion = useCallback(
    (regionName: string, forceComplete?: boolean) => {
      if (!hierarchy || !hierarchy.regions[regionName]) return;
      const region = hierarchy.regions[regionName];
      const allCodes: string[] = [];
      for (const countyName of region.counties) {
        const county = hierarchy.counties[countyName];
        if (county) {
          allCodes.push(...county.districts);
        }
      }

      setCompletedDistricts((prev) => {
        const next = new Set(prev);
        const shouldComplete =
          forceComplete !== undefined
            ? forceComplete
            : !allCodes.every((code) => next.has(code));

        for (const code of allCodes) {
          if (shouldComplete) {
            next.add(code);
          } else {
            next.delete(code);
          }
        }
        return next;
      });
    },
    [hierarchy]
  );

  // Toggle statewide
  const toggleStatewide = useCallback(
    (forceComplete?: boolean) => {
      if (!hierarchy) return;
      const allCodes = Object.keys(hierarchy.districts);
      setCompletedDistricts((prev) => {
        const next = new Set(prev);
        const shouldComplete =
          forceComplete !== undefined
            ? forceComplete
            : next.size < allCodes.length;

        if (shouldComplete) {
          for (const code of allCodes) next.add(code);
        } else {
          next.clear();
        }
        return next;
      });
    },
    [hierarchy]
  );

  // Reset progress
  const resetProgress = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all tracked progress? This cannot be undone.')) {
      setCompletedDistricts(new Set());
    }
  }, []);

  // Navigation handlers
  const goToState = useCallback(() => {
    setZoomLevel('state');
    setSelectedRegion(null);
    setSelectedCounty(null);
  }, []);

  const goToRegion = useCallback((regionName: string) => {
    setZoomLevel('region');
    setSelectedRegion(regionName);
    setSelectedCounty(null);
  }, []);

  const goToCounty = useCallback((countyName: string) => {
    setZoomLevel('county');
    setSelectedCounty(countyName);
    const region = COUNTY_TO_REGION[countyName];
    if (region) {
      setSelectedRegion(region);
    }
  }, []);

  return {
    hierarchy,
    geoJson,
    isLoading,
    error,
    completedDistricts,
    isDistrictCompleted,
    getCountyProgress,
    getRegionProgress,
    statewideProgress,
    toggleDistrict,
    toggleCounty,
    toggleRegion,
    toggleStatewide,
    resetProgress,
    // Navigation
    zoomLevel,
    selectedRegion,
    selectedCounty,
    goToState,
    goToRegion,
    goToCounty,
    // Search & Filter
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
  };
}
