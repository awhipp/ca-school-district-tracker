import React, { useMemo } from 'react';
import type {
  HierarchyData,
  ZoomLevel,
  FilterStatus,
  ProgressMetric,
  DistrictEntity,
} from '../types/tracker';
import { REGION_METADATA } from '../utils/californiaRegions';
import {
  Search,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Circle,
  X,
  ListFilter,
  CheckSquare,
  Square,
} from 'lucide-react';

interface ResourcesPanelProps {
  hierarchy: HierarchyData | null;
  zoomLevel: ZoomLevel;
  selectedRegion: string | null;
  selectedCounty: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  isDistrictCompleted: (cdsCode: string) => boolean;
  getCountyProgress: (countyName: string) => ProgressMetric;
  getRegionProgress: (regionName: string) => ProgressMetric;
  onToggleDistrict: (cdsCode: string) => void;
  onToggleCounty: (countyName: string) => void;
  onToggleRegion: (regionName: string) => void;
  onSelectRegion: (regionName: string) => void;
  onSelectCounty: (countyName: string) => void;
}

export const ResourcesPanel: React.FC<ResourcesPanelProps> = ({
  hierarchy,
  zoomLevel,
  selectedRegion,
  selectedCounty,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  isDistrictCompleted,
  getCountyProgress,
  getRegionProgress,
  onToggleDistrict,
  onToggleCounty,
  onToggleRegion,
  onSelectRegion,
  onSelectCounty,
}) => {
  // Normalize search query
  const query = searchQuery.trim().toLowerCase();

  // Compute visible items and metrics based on zoom level
  // 1. Level 1: Regions
  const regionsList = useMemo(() => {
    if (!hierarchy || zoomLevel !== 'state') return [];
    const list = Object.keys(hierarchy.regions).map((name) => {
      const region = hierarchy.regions[name];
      const prog = getRegionProgress(name);
      return {
        name,
        region,
        prog,
        isCompleted: prog.total > 0 && prog.completed === prog.total,
      };
    });

    return list.filter((item) => {
      if (filterStatus === 'completed' && !item.isCompleted) return false;
      if (filterStatus === 'pending' && item.isCompleted) return false;

      if (query) {
        const matchesRegion = item.name.toLowerCase().includes(query);
        const matchesCounties = item.region.counties.some((c) =>
          c.toLowerCase().includes(query)
        );
        if (!matchesRegion && !matchesCounties) return false;
      }
      return true;
    });
  }, [hierarchy, zoomLevel, getRegionProgress, query, filterStatus]);

  // 2. Level 2: Counties in selected region
  const countiesList = useMemo(() => {
    if (!hierarchy || zoomLevel !== 'region' || !selectedRegion) return [];
    const reg = hierarchy.regions[selectedRegion];
    if (!reg) return [];

    const list = reg.counties.map((name) => {
      const county = hierarchy.counties[name];
      const prog = getCountyProgress(name);
      return {
        name,
        county,
        prog,
        isCompleted: prog.total > 0 && prog.completed === prog.total,
      };
    });

    return list.filter((item) => {
      if (filterStatus === 'completed' && !item.isCompleted) return false;
      if (filterStatus === 'pending' && item.isCompleted) return false;

      if (query) {
        const matchesCounty = item.name.toLowerCase().includes(query);
        const matchesDistricts = item.county?.districts.some((code) => {
          const d = hierarchy.districts[code];
          return (
            d &&
            (d.district_name.toLowerCase().includes(query) ||
              d.cds_code.toLowerCase().includes(query) ||
              (d.city && d.city.toLowerCase().includes(query)))
          );
        });
        if (!matchesCounty && !matchesDistricts) return false;
      }
      return true;
    });
  }, [hierarchy, zoomLevel, selectedRegion, getCountyProgress, query, filterStatus]);

  // 3. Level 3: Districts in selected county
  const districtsList = useMemo(() => {
    if (!hierarchy || zoomLevel !== 'county' || !selectedCounty) return [];
    const county = hierarchy.counties[selectedCounty];
    if (!county) return [];

    const list: DistrictEntity[] = county.districts
      .map((code) => hierarchy.districts[code])
      .filter(Boolean);

    return list.filter((dist) => {
      const completed = isDistrictCompleted(dist.cds_code);
      if (filterStatus === 'completed' && !completed) return false;
      if (filterStatus === 'pending' && completed) return false;

      if (!query) return true;
      return (
        dist.district_name.toLowerCase().includes(query) ||
        dist.cds_code.toLowerCase().includes(query) ||
        (dist.city && dist.city.toLowerCase().includes(query)) ||
        dist.agency_type.toLowerCase().includes(query)
      );
    });
  }, [hierarchy, zoomLevel, selectedCounty, isDistrictCompleted, query, filterStatus]);

  // View summary metric
  const viewMetric = useMemo((): ProgressMetric => {
    if (zoomLevel === 'state') {
      if (!hierarchy) return { completed: 0, total: 0, percentage: 0 };
      let total = 0;
      let completed = 0;
      for (const regName of Object.keys(hierarchy.regions)) {
        const p = getRegionProgress(regName);
        total += p.total;
        completed += p.completed;
      }
      return {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    } else if (zoomLevel === 'region' && selectedRegion) {
      return getRegionProgress(selectedRegion);
    } else if (zoomLevel === 'county' && selectedCounty) {
      return getCountyProgress(selectedCounty);
    }
    return { completed: 0, total: 0, percentage: 0 };
  }, [zoomLevel, hierarchy, selectedRegion, selectedCounty, getRegionProgress, getCountyProgress]);

  // Batch mark all visible items at current level
  const handleBatchMark = (markComplete: boolean) => {
    if (zoomLevel === 'state') {
      for (const r of regionsList) {
        onToggleRegion(r.name);
      }
    } else if (zoomLevel === 'region') {
      for (const c of countiesList) {
        onToggleCounty(c.name);
      }
    } else if (zoomLevel === 'county') {
      for (const d of districtsList) {
        const isComp = isDistrictCompleted(d.cds_code);
        if (markComplete && !isComp) {
          onToggleDistrict(d.cds_code);
        } else if (!markComplete && isComp) {
          onToggleDistrict(d.cds_code);
        }
      }
    }
  };

  return (
    <aside className="resources-panel">
      {/* Panel Top Banner */}
      <div className="panel-header">
        <div className="panel-title-area">
          <div className="panel-subtitle">
            {zoomLevel === 'state' && 'Statewide Granularity'}
            {zoomLevel === 'region' && `Region: ${selectedRegion}`}
            {zoomLevel === 'county' && `${selectedCounty} County`}
          </div>
          <h2 className="panel-title">
            {zoomLevel === 'state' && '10 Educational Regions'}
            {zoomLevel === 'region' && 'Counties in Region'}
            {zoomLevel === 'county' && 'School Districts'}
          </h2>
        </div>

        {/* View Progress Metric Card */}
        <div className="panel-progress-card">
          <div className="progress-labels">
            <span className="progress-fraction">
              <strong>{viewMetric.completed}</strong> / {viewMetric.total} Completed
            </span>
            <span className="progress-percent">{viewMetric.percentage}%</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${viewMetric.percentage}%` }}
            />
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="panel-batch-actions">
          <button
            onClick={() => handleBatchMark(true)}
            className="batch-btn batch-btn-check"
            title="Mark all items currently visible complete"
          >
            <CheckSquare size={14} />
            <span>Mark All Complete</span>
          </button>
          <button
            onClick={() => handleBatchMark(false)}
            className="batch-btn batch-btn-clear"
            title="Unmark all items currently visible"
          >
            <Square size={14} />
            <span>Clear Visible</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="panel-toolbar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              zoomLevel === 'county'
                ? 'Search districts by name or CDS...'
                : zoomLevel === 'region'
                ? 'Search counties...'
                : 'Search regions...'
            }
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="filter-chips">
          <button
            onClick={() => setFilterStatus('all')}
            className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`filter-chip ${filterStatus === 'pending' ? 'active' : ''}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`filter-chip ${filterStatus === 'completed' ? 'active' : ''}`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Main Scrollable Resource List */}
      <div className="panel-list-container">
        {/* LEVEL 1: REGIONS LIST */}
        {zoomLevel === 'state' && (
          <div className="resource-cards-list">
            {regionsList.length === 0 ? (
              <div className="empty-state">
                <ListFilter size={28} className="empty-icon" />
                <p>No regions match your current filter.</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="empty-reset-btn">
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              regionsList.map(({ name, region, prog, isCompleted }) => {
                const meta = REGION_METADATA[name];
                return (
                  <div
                    key={name}
                    className={`resource-card region-card ${
                      isCompleted ? 'card-completed' : ''
                    }`}
                  >
                    <div
                      className="card-main-content"
                      onClick={() => onSelectRegion(name)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="card-top-row">
                        <span
                          className="region-indicator-dot"
                          style={{ backgroundColor: meta?.accentColor || '#6366f1' }}
                        />
                        <span className="card-title">{name}</span>
                        <ChevronRight size={16} className="drill-icon" />
                      </div>
                      <div className="card-meta-row">
                        <span>{region.county_count} Counties</span>
                        <span>•</span>
                        <span>{prog.total} Districts</span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="card-progress-bar">
                        <div
                          className="card-progress-fill"
                          style={{
                            width: `${prog.percentage}%`,
                            backgroundColor: isCompleted ? '#10b981' : meta?.accentColor,
                          }}
                        />
                      </div>
                      <div className="card-progress-text">
                        {prog.completed} / {prog.total} completed ({prog.percentage}%)
                      </div>
                    </div>

                    {/* Checkbox action */}
                    <div className="card-action-col">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRegion(name);
                        }}
                        className={`toggle-check-btn ${isCompleted ? 'checked' : ''}`}
                        title={`Mark entire ${name} region ${
                          isCompleted ? 'incomplete' : 'complete'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* LEVEL 2: COUNTIES LIST */}
        {zoomLevel === 'region' && (
          <div className="resource-cards-list">
            {countiesList.length === 0 ? (
              <div className="empty-state">
                <ListFilter size={28} className="empty-icon" />
                <p>No counties match your current filter.</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="empty-reset-btn">
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              countiesList.map(({ name, county, prog, isCompleted }) => (
                <div
                  key={name}
                  className={`resource-card county-card ${
                    isCompleted ? 'card-completed' : ''
                  }`}
                >
                  <div
                    className="card-main-content"
                    onClick={() => onSelectCounty(name)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="card-top-row">
                      <span className="card-title">{name} County</span>
                      <ChevronRight size={16} className="drill-icon" />
                    </div>
                    <div className="card-meta-row">
                      <span>{county.district_count} Districts</span>
                      <span>•</span>
                      <span>{county.total_counselors} Counselors</span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="card-progress-bar">
                      <div
                        className="card-progress-fill"
                        style={{
                          width: `${prog.percentage}%`,
                          backgroundColor: isCompleted ? '#10b981' : '#38bdf8',
                        }}
                      />
                    </div>
                    <div className="card-progress-text">
                      {prog.completed} / {prog.total} completed ({prog.percentage}%)
                    </div>
                  </div>

                  {/* Checkbox action */}
                  <div className="card-action-col">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCounty(name);
                      }}
                      className={`toggle-check-btn ${isCompleted ? 'checked' : ''}`}
                      title={`Mark entire ${name} County ${
                        isCompleted ? 'incomplete' : 'complete'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* LEVEL 3: DISTRICTS LIST */}
        {zoomLevel === 'county' && (
          <div className="resource-cards-list">
            {districtsList.length === 0 ? (
              <div className="empty-state">
                <ListFilter size={28} className="empty-icon" />
                <p>No school districts match your current filter.</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="empty-reset-btn">
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              districtsList.map((dist) => {
                const isCompleted = isDistrictCompleted(dist.cds_code);
                return (
                  <div
                    key={dist.cds_code}
                    className={`resource-card district-card ${
                      isCompleted ? 'card-completed' : ''
                    }`}
                    onClick={() => onToggleDistrict(dist.cds_code)}
                  >
                    <div className="district-info-col">
                      <div className="district-header">
                        <span className="district-name">{dist.district_name}</span>
                        {dist.portal_url && (
                          <a
                            href={dist.portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="district-portal-link"
                            title="Visit Official District Portal"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>

                      <div className="district-tags">
                        <span className="badge badge-agency">{dist.agency_type}</span>
                        {dist.city && <span className="badge badge-city">{dist.city}</span>}
                        <span className="badge badge-cds">
                          CDS: {dist.cds_code.slice(0, 7)}
                        </span>
                        {dist.counselor_count > 0 && (
                          <span className="badge badge-counselors">
                            {dist.counselor_count}{' '}
                            {dist.counselor_count === 1 ? 'Counselor' : 'Counselors'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Single District Checkbox */}
                    <div className="card-action-col">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDistrict(dist.cds_code);
                        }}
                        className={`toggle-check-btn ${isCompleted ? 'checked' : ''}`}
                        title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                      >
                        {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Panel Footer: Quick Tally */}
      <div className="panel-footer">
        <span className="footer-status-text">
          {zoomLevel === 'state' && `${regionsList.length} regions listed`}
          {zoomLevel === 'region' && `${countiesList.length} counties in region`}
          {zoomLevel === 'county' && `${districtsList.length} districts shown`}
        </span>
        <span className="footer-legend-hint">
          {zoomLevel === 'county'
            ? 'Click any district to check it off'
            : 'Click card to zoom in, checkbox to mark all'}
        </span>
      </div>
    </aside>
  );
};
