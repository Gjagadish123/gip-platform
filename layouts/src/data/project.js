// Company constants shared by every layout. Everything about a project (copy, approvals, media, statuses) is read
// live from Supabase (projects.public_content and units), and its geometry from src/data/masterplans/<id>.json.

export const COMPANY = {
  name: 'Greater Infra Projects',
  whatsapp: '919000770022', // the official WhatsApp Business number; no phone number is shown
  email: 'Gip@greaterinfraprojects.in',
  website: import.meta.env.VITE_WEBSITE_URL || 'https://gjagadish123.github.io/gip-platform/site/',
};

// Sales offices, as printed on the client's brochure (the demo showed the same three).
export const OFFICES = [
  {
    kind: 'Head office',
    place: 'Ameerpet',
    lines: ['Flat No. 1314, 12th Floor, Vasavi MPM Grand', 'Ameerpet Metro Junction, Pillar No. 1065', 'Ameerpet, Hyderabad 500 073'],
    maps: 'https://www.google.com/maps/search/?api=1&query=Vasavi+MPM+Grand+Ameerpet+Hyderabad',
  },
  {
    kind: 'Branch office',
    place: 'Tarnaka',
    lines: ['12-13-111, Street No. 3', 'Opp. Sri Chaitanya School, behind Big Bazaar', 'Tarnaka, Hyderabad'],
    maps: 'https://www.google.com/maps/search/?api=1&query=Street+No+3+Tarnaka+Hyderabad',
  },
  {
    kind: 'Branch office',
    place: 'Habsiguda',
    lines: ['Avani Infra Developers, Flat No. 201, 3rd Floor', 'Madhusha Apartments, opp. Kapil Chit Fund, Street No. 5', 'Habsiguda, Hyderabad 500 007'],
    maps: 'https://www.google.com/maps/search/?api=1&query=Street+No+5+Habsiguda+Hyderabad',
  },
];

// The client's other projects, from their Google Maps links (2026-11-04): a small dot and name on the map, no layout.
// Sri Yadadri Gardens is left out: its link was Global City's. Add it when the right link comes.
export const PAST_PROJECTS = [
  { name: 'True Pride', at: { lat: 17.3712055, lng: 78.6947499 } },
  { name: 'LR Palm Meadows', at: { lat: 17.4887396, lng: 78.6575865 } },
  { name: 'Global City', at: { lat: 17.561142, lng: 78.176409 } },
  { name: 'LR Medchal County', at: { lat: 17.64535, lng: 78.5205834 } },
  { name: 'SV Highway City', at: { lat: 17.618286, lng: 79.010329 } },
  { name: 'Global City II', at: { lat: 17.5125339, lng: 78.1799796 } },
  { name: 'Rampally County', at: { lat: 17.504762, lng: 78.672294 } },
  { name: 'Global City III', at: { lat: 17.529272, lng: 78.192444 } },
  { name: 'Kompally County I', at: { lat: 17.6168971, lng: 78.5165149 } },
  { name: 'Global Highway City', at: { lat: 17.624327, lng: 77.968699 } },
  { name: 'Keesara County', at: { lat: 17.503789, lng: 78.692817 } },
  { name: 'Kompally County III', at: { lat: 17.6222628, lng: 78.4509696 } },
  { name: 'Global City Nature View', at: { lat: 17.0201712, lng: 78.6801104 }, ongoing: true },
];
