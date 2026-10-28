// A small hand-picked icon set (24px grid, 1.75 stroke) so the page has no icon-font dependency.
const P = {
  search: <path d="M11 4a7 7 0 1 0 4.4 12.5L20 21M11 4a7 7 0 0 1 4.4 12.5" />,
  filter: <path d="M4 5h16l-6.2 7.4V19l-3.6-1.8v-4.8L4 5Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  collapse: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  play: <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />,
  stop: <path d="M7 7h10v10H7z" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9.5 9 5 9-5M3 17l9 5 9-5" />,
  home: <path d="M4 11.5 12 4l8 7.5M6.5 10v9.5h11V10" />,
  compass: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5.5-5 2 2-5.5 5-2Z" />,
  pin: <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  route: <path d="M6 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm12-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8.5 16.5H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.5" />,
  share: <path d="M8.6 13.3 15.4 17M15.4 7 8.6 10.7M18 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm12 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.700 2 2 0 0 1 6.500 3.500Z" />,
  whatsapp: <path d="M4 20l1.300-4.200A8 8 0 1 1 8.400 19L4 20Zm5.200-11.500c-.4 0-.9.500-.9 1.400 0 1.600 1.800 3.700 4.200 4.600 1.400.5 2.100-.200 2.300-.900.100-.400 0-.600-.300-.800l-1.300-.600c-.300-.100-.500 0-.700.200l-.400.500c-.800-.300-1.700-1.100-2.100-1.900l.400-.500c.200-.200.200-.400.100-.700l-.500-1.200c-.200-.300-.400-.400-.800-.400Z" />,
  check: <path d="m5 12.5 4.500 4.500L19 7.500" />,
  arrowDown: <path d="M12 5v14m0 0-6-6m6 6 6-6" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  villa: <path d="M3 20h18M5 20V10l7-5 7 5v10M9.500 20v-6h5v6" />,
  club: <path d="M3 20h18M5 20V9h14v11M3.500 9 12 4l8.500 5M9 20v-5h6v5M8 12h2m4 0h2" />,
  pool: <path d="M3 17c1.500 0 1.500 1 3 1s1.500-1 3-1 1.500 1 3 1 1.500-1 3-1 1.500 1 3 1 1.500-1 3-1M3 21c1.500 0 1.500 1 3 1M8 14V6a2 2 0 0 1 4 0M14 14V6a2 2 0 0 1 4 0M8 10h6" />,
  playground: <path d="M4 20 9 6l5 14M6.500 13h5M17 20V8m-3 3 3-3 3 3" />,
  court: <path d="M4 5h16v14H4zM12 5v14M4 12h16M12 12m-2.500 0a2.500 2.500 0 1 0 5 0 2.500 2.500 0 1 0-5 0" />,
  arch: <path d="M4 20V9a8 8 0 0 1 16 0v11M8 20v-9a4 4 0 0 1 8 0v9M2.500 20h19" />,
  tank: <path d="M6 4h12v7H6zM8 11v9M16 11v9M6 20h12M8 15h8" />,
  road: <path d="M7 3 4 21M17 3l3 18M12 4v3m0 4v3m0 4v3" />,
  shield: <path d="M12 3 5 6v5.500c0 4.300 2.900 8.100 7 9.500 4.100-1.400 7-5.200 7-9.500V6l-7-3Zm-3 9 2.200 2.200L15.500 10" />,
  tree: <path d="M12 21v-6m0 0a5 5 0 0 1-4.600-7A4.500 4.500 0 0 1 16.500 8a5 5 0 0 1-4.500 7Z" />,
  bolt: <path d="M13 3 5 13.500h6L10 21l8-10.500h-6L13 3Z" />,
  drop: <path d="M12 3s6 6.300 6 11a6 6 0 0 1-12 0c0-4.700 6-11 6-11Z" />,
  mail: <path d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  ruler: <path d="m4 15 11-11 5 5L9 20l-5-5Zm5-1 1.500 1.500M12 11l1.500 1.500M15 8l1.500 1.500" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  refresh: <path d="M20 11a8 8 0 0 0-14.500-4.500M4 4v3h3M4 13a8 8 0 0 0 14.500 4.500M20 20v-3h-3" />,
  copy: <path d="M9 9h10v11H9zM5 15V4h10" />,
  sparkle: <path d="M12 4v4m0 8v4M4 12h4m8 0h4M6.500 6.500l2.500 2.500m6 6 2.500 2.500m0-11L15 9m-6 6-2.500 2.500" />,
};

export default function Icon({ name, size = 20, className = '', title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {P[name] || null}
    </svg>
  );
}
