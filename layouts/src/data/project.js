// Company constants shared by every layout. Everything about a project (copy, approvals, media, statuses) is read
// live from Supabase (projects.public_content and units), and its geometry from src/data/masterplans/<id>.json.

export const COMPANY = {
  name: 'Greater Infra Projects',
  phone: '+91 97001 23900',
  tel: '+919700123900',
  whatsapp: '919700123900',
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
