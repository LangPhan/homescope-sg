import { Listing } from "./types";

const images = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85"
];

const base: Omit<Listing, "id" | "slug" | "image_url">[] = [
  { title: "Marina One Residences", address: "23 Marina Way", district: "D01", property_type: "Condo", tenure: "99-year", price: 2380000, psf: 2416, bedrooms: 2, bathrooms: 2, floor_area: 985, latitude: 1.2776, longitude: 103.8547, mrt_name: "Downtown", mrt_distance: 220 },
  { title: "Tiong Bahru Heritage Loft", address: "61 Seng Poh Lane", district: "D03", property_type: "Apartment", tenure: "Freehold", price: 1890000, psf: 2093, bedrooms: 2, bathrooms: 2, floor_area: 903, latitude: 1.2849, longitude: 103.8325, mrt_name: "Tiong Bahru", mrt_distance: 480 },
  { title: "Holland Grove House", address: "18 Holland Grove Drive", district: "D10", property_type: "Landed", tenure: "Freehold", price: 6180000, psf: 1873, bedrooms: 5, bathrooms: 4, floor_area: 3300, latitude: 1.3141, longitude: 103.7822, mrt_name: "Dover", mrt_distance: 880 },
  { title: "Joo Chiat Courtyard", address: "112 Joo Chiat Road", district: "D15", property_type: "Condo", tenure: "Freehold", price: 1660000, psf: 1951, bedrooms: 2, bathrooms: 2, floor_area: 851, latitude: 1.3145, longitude: 103.9004, mrt_name: "Marine Parade", mrt_distance: 510 },
  { title: "Punggol Waterway View", address: "306A Punggol Place", district: "D19", property_type: "HDB", tenure: "99-year", price: 728000, psf: 676, bedrooms: 4, bathrooms: 2, floor_area: 1076, latitude: 1.4042, longitude: 103.9013, mrt_name: "Punggol", mrt_distance: 310 },
  { title: "Bukit Timah Garden Suite", address: "8 Rifle Range Road", district: "D21", property_type: "Condo", tenure: "99-year", price: 2988000, psf: 2242, bedrooms: 3, bathrooms: 3, floor_area: 1333, latitude: 1.3412, longitude: 103.7734, mrt_name: "Beauty World", mrt_distance: 640 }
];

export const demoListings: Listing[] = base.map((item, index) => ({
  ...item,
  id: index + 1,
  slug: item.title.toLowerCase().replaceAll(" ", "-").replace(/[^a-z0-9-]/g, ""),
  image_url: images[index],
  images: [images[index], images[(index + 1) % images.length], images[(index + 2) % images.length]],
  is_featured: index < 3,
  listed_at: new Date(Date.now() - index * 86400000).toISOString(),
  description: "A thoughtfully designed Singapore home with bright living spaces, practical storage and convenient access to transport, dining and everyday amenities.",
  amenities: ["Pool", "Gym", "24h security", "Near MRT", "Covered parking"],
  agent: { name: ["Jamie Tan", "Nadia Lim", "Marcus Goh"][index % 3], registration_no: `R06${3400 + index}Z`, phone: "+65 6123 4567", avatar_url: `https://i.pravatar.cc/160?img=${12 + index}` },
  transactions: Array.from({ length: 12 }, (_, month) => ({
    month: new Date(2025, month, 1).toLocaleDateString("en-SG", { month: "short", year: "2-digit" }),
    price: Math.round(item.price * (0.9 + month * 0.008)),
    psf: Math.round(item.psf * (0.9 + month * 0.008))
  }))
}));
