export type Listing = {
  id: number;
  slug: string;
  title: string;
  address: string;
  district: string;
  property_type: string;
  tenure: string | null;
  price: number;
  psf: number;
  bedrooms: number;
  bathrooms: number;
  floor_area: number;
  latitude: number;
  longitude: number;
  mrt_name: string;
  mrt_distance: number | null;
  source_url?: string | null;
  subtype?: string;
  image_url: string;
  is_featured?: boolean;
  listed_at?: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  agent?: { name: string; registration_no: string; phone: string; avatar_url: string };
  transactions?: { month: string; price: number; psf: number }[];
};

export type ListingResponse = {
  data: Listing[];
  meta: { total: number; next_cursor: string | null; request_id?: string };
};

export type SearchFilters = {
  q?: string;
  property_type?: string;
  subtype?: string;
  view?: "map";
  min_price?: string;
  max_price?: string;
  bedrooms?: string;
  district?: string;
  tenure?: string;
  sort?: string;
  bbox?: string;
  cursor?: string;
  limit?: string;
};
