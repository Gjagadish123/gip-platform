// Company constants shared by every layout. Everything about a project (copy, approvals, media, statuses) is read
// live from Supabase (projects.public_content and units), and its geometry from src/data/masterplans/<id>.json.

export const COMPANY = {
  name: 'Greater Infra Projects',
  phone: '+91 97001 23900',
  tel: '+919700123900',
  whatsapp: '919700123900',
  email: 'Gip@greaterinfraprojects.in',
  office: 'Ameerpet, Hyderabad, Telangana',
  website: import.meta.env.VITE_WEBSITE_URL || 'https://gjagadish123.github.io/gip-platform/site/',
};
