# California School District Map Tracker

A lightweight, modern React application for tracking completion and outreach progress across California's educational landscape: **10 Regions**, **58 Counties**, and **1,008 School Districts**.

## Features

- **2/3 Interactive Map View**:
  - Smooth 3-level hierarchical zoom: **Statewide (10 Regions)** $\rightarrow$ **Region (Counties)** $\rightarrow$ **County View**.
  - Powered by Leaflet with CartoDB Positron basemap (with automatic OSM fallback) and authoritative California county boundaries.
  - Floating breadcrumbs with quick one-click navigation back to Region or Statewide.
  - Color-coded polygon states: Green for 100% completed, blue for in-progress, and distinct regional accents for pending counties.
- **1/3 Contextual Checklist & Inspector**:
  - Automatically updates to show resources at the current zoom depth.
  - **Level 1**: 10 California Regions with progress bars and batch region check-off.
  - **Level 2**: Counties in the selected region with district tallies and county check-off.
  - **Level 3**: School districts in the selected county with individual check-off checkboxes, CDS codes, agency types, and counselor headcounts.
  - Quick action to **Mark All Complete** or **Clear Visible** at any view.
  - Hierarchical search across regions, counties, and district names/CDS codes.
  - Filter tabs: `All`, `Pending`, `Completed`.
- **Light Mode Aesthetics**: Crisp, high-contrast palette tailored for clarity and usability.
- **Mobile Friendly**: Automatically adapts to a top-bottom layout (map on top, checklist on bottom) on narrower screens.
- **Persistent Storage**: Completion state is saved to `localStorage` under `ca_district_tracker_completed_v1`.

---

## Local Development Setup

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Carto API key:
   ```env
   VITE_CARTO_API_KEY=cb1_4rf6_1_c108dd115bfe535af5384886
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173/ca-school-district-tracker/](http://localhost:5173/ca-school-district-tracker/) in your browser.

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## GitHub Pages Deployment

The repository includes a ready-to-use GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Setting up the GitHub Secret:
1. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret**.
3. Name: `CARTO_API_KEY`
4. Value: your Carto API key (e.g. `cb1_4rf6_1_c108dd115bfe535af5384886`).
5. Ensure GitHub Pages is configured to deploy from **GitHub Actions** under **Settings** > **Pages** > **Build and deployment** > **Source: GitHub Actions**.

When you push to `main` or `master`, the workflow will automatically build and publish the application to `https://<username>.github.io/ca-school-district-tracker/`.
