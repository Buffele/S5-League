// Static paths only: player text never enters SVG markup.
const paths={
 display:'<rect x="3" y="3" width="18" height="13" rx="1"/><path d="M8 21h8M12 16v5"/>',
 audio:'<path d="m11 4-5 4H3v8h3l5 4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',
 gamepad:'<path d="M7 7h10c3 0 5 12 3 13-2 1-4-4-5-4H9c-1 0-3 5-5 4-2-1 0-13 3-13ZM7 10v5M4.5 12.5h5M15 11h.01M18 14h.01"/>',
 lock:'<rect x="6" y="10" width="12" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
 group:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-5a6 6 0 0 1 12 0v5M17 4a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5v3"/>',
 person:'<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
 mail:'<rect x="2" y="4" width="20" height="16" rx="1"/><path d="m3 6 9 7 9-7"/>',
 settings:'<path d="m9 3 1-2h4l1 3 3 1 3-1 2 4-2 2v4l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-4L1 8l2-4 3 1Z"/><circle cx="12" cy="12" r="4"/>',
 back:'<path d="m15 4-8 8 8 8"/>',next:'<path d="m9 4 8 8-8 8"/>',
 plus:'<path d="M12 3v18M3 12h18"/>',
 refresh:'<path d="M21 3v6h-6M3 21v-6h6M20 9A8 8 0 0 0 5 6M4 15a8 8 0 0 0 15 3"/>',
 crown:'<path d="m3 6 5 5 4-8 4 8 5-5-2 14H5Z"/>',
 shirt:'<path d="m8 3-6 4 3 5 3-2v12h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z"/>',
 chat:'<path d="M3 3h18v14H9l-6 5Z M7 7h10M7 11h7"/>',
};
export function s5LobbyIcon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]??paths.lock)+'</svg>';}
