export interface CounselorRecord {
  record_id: string;
  full_name: string;
  role_title?: string;
  email_address?: string;
  phone_number?: string;
  organization_name?: string;
  source_url?: string;
  cross_validation_score?: number;
  agent_status?: string;
}

export interface DistrictEntity {
  cds_code: string;
  district_name: string;
  county_name: string;
  region_name: string;
  agency_type: string;
  district_type?: string;
  city?: string;
  official_domain?: string;
  portal_url?: string;
  latitude: number;
  longitude: number;
  counselor_count: number;
  counselors?: CounselorRecord[];
}

export interface CountyEntity {
  county_name: string;
  region_name: string;
  district_count: number;
  total_counselors: number;
  centroid?: { latitude: number; longitude: number };
  districts: string[]; // array of cds_codes
}

export interface RegionEntity {
  region_name: string;
  counties: string[];
  county_count: number;
  district_count: number;
  total_counselors: number;
}

export interface HierarchyData {
  schema_version?: string;
  generated_at?: string;
  total_regions: number;
  total_counties: number;
  total_districts: number;
  total_counselors: number;
  regions: Record<string, RegionEntity>;
  counties: Record<string, CountyEntity>;
  districts: Record<string, DistrictEntity>;
}

export type ZoomLevel = 'state' | 'region' | 'county';

export interface ProgressMetric {
  completed: number;
  total: number;
  percentage: number;
}

export type FilterStatus = 'all' | 'pending' | 'completed';
