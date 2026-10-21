import React from 'react';
import { useDistrictTracker } from './hooks/useDistrictTracker';
import { Header } from './components/Header';
import { CaliforniaMap } from './components/CaliforniaMap';
import { ResourcesPanel } from './components/ResourcesPanel';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const {
    hierarchy,
    geoJson,
    isLoading,
    error,
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
    statewideProgress,
    toggleDistrict,
    toggleCounty,
    toggleRegion,
    resetProgress,
    goToState,
    goToRegion,
    goToCounty,
  } = useDistrictTracker();

  if (isLoading) {
    return (
      <div className="app-loading-screen">
        <div className="loading-card">
          <Loader2 className="loading-spinner animate-spin" size={38} />
          <h2 className="loading-title">Loading California District Atlas...</h2>
          <p className="loading-subtitle">
            Preparing 10 Regions, 58 Counties, and 1,008 School Districts
          </p>
        </div>
      </div>
    );
  }

  if (error || !hierarchy || !geoJson) {
    return (
      <div className="app-error-screen">
        <div className="error-card">
          <AlertCircle size={40} className="error-icon" />
          <h2 className="error-title">Failed to Load Map Datasets</h2>
          <p className="error-message">{error || 'Unknown error occurred while loading geographic boundaries.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="error-retry-btn"
          >
            <RefreshCw size={16} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* Top Application Header */}
      <Header
        statewideProgress={statewideProgress}
        onReset={resetProgress}
      />

      {/* Main 2-Column Split Layout: 2/3 Map + 1/3 Resources Panel */}
      <main className="app-main-layout">
        <section className="app-map-column" aria-label="Interactive Map View">
          <CaliforniaMap
            geoJson={geoJson}
            zoomLevel={zoomLevel}
            selectedRegion={selectedRegion}
            selectedCounty={selectedCounty}
            getCountyProgress={getCountyProgress}
            onSelectRegion={goToRegion}
            onSelectCounty={goToCounty}
            onResetToState={goToState}
          />
        </section>

        <section className="app-sidebar-column" aria-label="Resource Checklist & Details">
          <ResourcesPanel
            hierarchy={hierarchy}
            zoomLevel={zoomLevel}
            selectedRegion={selectedRegion}
            selectedCounty={selectedCounty}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            isDistrictCompleted={isDistrictCompleted}
            getCountyProgress={getCountyProgress}
            getRegionProgress={getRegionProgress}
            onToggleDistrict={toggleDistrict}
            onToggleCounty={toggleCounty}
            onToggleRegion={toggleRegion}
            onSelectRegion={goToRegion}
            onSelectCounty={goToCounty}
          />
        </section>
      </main>
    </div>
  );
};

export default App;
