/**
 * California Geographic & Research Regions Metadata.
 * Maps 58 California counties into 10 educational regions with distinct, accessible accent colors.
 */

export const CALIFORNIA_REGIONS: Record<string, string[]> = {
  'Bay Area': [
    'Alameda', 'Contra Costa', 'Marin', 'Napa', 'San Francisco',
    'San Mateo', 'Santa Clara', 'Solano', 'Sonoma',
  ],
  'Central Coast': [
    'Monterey', 'San Benito', 'San Luis Obispo', 'Santa Barbara',
    'Santa Cruz', 'Ventura',
  ],
  'Central Valley': [
    'Fresno', 'Kern', 'Kings', 'Madera', 'Merced', 'San Joaquin',
    'Stanislaus', 'Tulare',
  ],
  'Greater Los Angeles': ['Los Angeles'],
  'Inland Empire': ['Riverside', 'San Bernardino'],
  'Orange County': ['Orange'],
  'San Diego & Imperial': ['Imperial', 'San Diego'],
  'Sacramento Area': [
    'El Dorado', 'Placer', 'Sacramento', 'Sutter', 'Yolo', 'Yuba',
  ],
  'Northern California': [
    'Butte', 'Colusa', 'Del Norte', 'Glenn', 'Humboldt', 'Lake',
    'Lassen', 'Mendocino', 'Modoc', 'Shasta', 'Siskiyou', 'Tehama', 'Trinity',
  ],
  'Sierra & Gold Country': [
    'Alpine', 'Amador', 'Calaveras', 'Inyo', 'Mariposa', 'Mono',
    'Nevada', 'Plumas', 'Sierra', 'Tuolumne',
  ],
};

export const COUNTY_TO_REGION: Record<string, string> = Object.entries(
  CALIFORNIA_REGIONS
).reduce((acc, [region, counties]) => {
  counties.forEach((county) => {
    acc[county] = region;
  });
  return acc;
}, {} as Record<string, string>);

export interface RegionMetadataItem {
  label: string;
  shortName: string;
  description: string;
  accentColor: string;
}

export const REGION_METADATA: Record<string, RegionMetadataItem> = {
  'Bay Area': {
    label: 'San Francisco Bay Area',
    shortName: 'Bay Area',
    description: '9 counties surrounding SF Bay, dense unified districts.',
    accentColor: '#38bdf8', // sky blue
  },
  'Central Coast': {
    label: 'Central Coast',
    shortName: 'Central Coast',
    description: '6 coastal counties from Santa Cruz to Ventura.',
    accentColor: '#34d399', // emerald green
  },
  'Central Valley': {
    label: 'San Joaquin Valley',
    shortName: 'Central Valley',
    description: '8 agricultural heartland counties with rural & unified districts.',
    accentColor: '#fbbf24', // amber yellow
  },
  'Greater Los Angeles': {
    label: 'Greater Los Angeles',
    shortName: 'Los Angeles',
    description: 'Encompassing LAUSD and regional unified/high school districts.',
    accentColor: '#818cf8', // indigo
  },
  'Inland Empire': {
    label: 'Inland Empire',
    shortName: 'Inland Empire',
    description: 'Riverside & San Bernardino counties spanning urban and desert communities.',
    accentColor: '#f472b6', // pink
  },
  'Orange County': {
    label: 'Orange County',
    shortName: 'Orange Co.',
    description: 'Suburban Southern California unified districts.',
    accentColor: '#fb923c', // orange
  },
  'San Diego & Imperial': {
    label: 'San Diego & Imperial',
    shortName: 'SD & Imperial',
    description: 'Southern border corridor comprising coastal and valley districts.',
    accentColor: '#a78bfa', // violet
  },
  'Sacramento Area': {
    label: 'Capital & Sacramento Area',
    shortName: 'Sacramento Area',
    description: 'State capital metro, suburban corridors, and Sierra foothills.',
    accentColor: '#2dd4bf', // teal
  },
  'Northern California': {
    label: 'Northern California',
    shortName: 'Northern CA',
    description: '13 northern counties featuring redwood coast and upper valley.',
    accentColor: '#4ade80', // light green
  },
  'Sierra & Gold Country': {
    label: 'Sierra & Gold Country',
    shortName: 'Gold Country',
    description: '10 historic Gold Country and high mountain counties.',
    accentColor: '#e879f9', // fuchsia
  },
};
