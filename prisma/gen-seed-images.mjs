// One-off generator for placeholder "photos" used by the gazette seed data.
// No real photos are available, so these are tasteful abstract brand-colored
// compositions (SVG rendered to WebP via sharp) rather than flat rectangles.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'uploads', 'seed');
mkdirSync(outDir, { recursive: true });

const FLAME = '#FF511C';
const CRIMSON = '#A81313';
const CREAM = '#FFEBCF';
const AMBER = '#FFA009';
const DEEP = '#8C0F0F';
const INK = '#1A1A1A';

function streaks(seed, count, color, opacity) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = rand() * 900 - 100;
    const y = rand() * 700 - 100;
    const len = 60 + rand() * 220;
    const w = 6 + rand() * 14;
    out += `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${w}" stroke-linecap="round" transform="rotate(-35 ${x} ${y})"/>`;
  }
  return out;
}

const images = [
  {
    name: 'hackathon-team.webp',
    svg: `<svg width="1000" height="700" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${FLAME}"/><stop offset="100%" stop-color="${CRIMSON}"/>
      </linearGradient></defs>
      <rect width="1000" height="700" fill="url(#g)"/>
      ${streaks(7, 14, CREAM, 0.22)}
      <circle cx="220" cy="360" r="130" fill="${CREAM}" opacity="0.14"/>
      <circle cx="760" cy="200" r="90" fill="${AMBER}" opacity="0.22"/>
      <g transform="translate(500 350)">
        <circle r="150" fill="none" stroke="${CREAM}" stroke-width="10" opacity="0.5"/>
        <circle r="60" fill="${CREAM}" opacity="0.9"/>
      </g>
    </svg>`,
  },
  {
    name: 'meetup-crowd.webp',
    svg: `<svg width="1000" height="700" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="700" fill="${INK}"/>
      ${streaks(3, 16, FLAME, 0.5)}
      ${streaks(11, 10, AMBER, 0.35)}
      <g fill="${CREAM}" opacity="0.85">
        <circle cx="260" cy="470" r="46"/><rect x="210" y="516" width="100" height="140" rx="24"/>
        <circle cx="430" cy="440" r="52"/><rect x="374" y="492" width="112" height="164" rx="26"/>
        <circle cx="620" cy="460" r="44"/><rect x="574" y="504" width="96" height="132" rx="22"/>
        <circle cx="780" cy="435" r="50"/><rect x="726" y="485" width="108" height="156" rx="24"/>
      </g>
    </svg>`,
  },
  {
    name: 'forum-stage.webp',
    svg: `<svg width="1000" height="700" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${CREAM}"/><stop offset="100%" stop-color="#FFD9A8"/>
      </linearGradient></defs>
      <rect width="1000" height="700" fill="url(#g2)"/>
      ${streaks(23, 12, FLAME, 0.18)}
      <rect x="120" y="430" width="760" height="16" fill="${INK}"/>
      <g fill="${CRIMSON}">
        <rect x="300" y="220" width="40" height="210" rx="8"/>
        <rect x="480" y="180" width="40" height="250" rx="8"/>
        <rect x="660" y="250" width="40" height="180" rx="8"/>
      </g>
      <circle cx="500" cy="130" r="46" fill="${FLAME}"/>
    </svg>`,
  },
  {
    name: 'award-offer.webp',
    svg: `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="g3" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="${AMBER}"/><stop offset="55%" stop-color="${FLAME}"/><stop offset="100%" stop-color="${DEEP}"/>
      </radialGradient></defs>
      <rect width="800" height="800" fill="url(#g3)"/>
      ${streaks(41, 10, CREAM, 0.2)}
      <g transform="translate(400 380)">
        <circle r="150" fill="none" stroke="${CREAM}" stroke-width="14"/>
        <path d="M -40 -20 L -12 20 L 55 -60" stroke="${CREAM}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    </svg>`,
  },
  {
    name: 'code-night.webp',
    svg: `<svg width="900" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="900" height="600" fill="${DEEP}"/>
      ${streaks(53, 15, FLAME, 0.4)}
      <g font-family="monospace" font-size="26" fill="${CREAM}" opacity="0.85">
        <text x="80" y="120">const team = [</text>
        <text x="110" y="160">'TechConnect',</text>
        <text x="110" y="200">'ЮУрГУ',</text>
        <text x="80" y="240">];</text>
        <text x="80" y="320">function ship() {</text>
        <text x="110" y="360">return success;</text>
        <text x="80" y="400">}</text>
      </g>
    </svg>`,
  },
  {
    name: 'workshop-hands.webp',
    svg: `<svg width="900" height="700" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${CREAM}"/><stop offset="100%" stop-color="#FFD9A8"/>
      </linearGradient></defs>
      <rect width="900" height="700" fill="url(#g5)"/>
      ${streaks(67, 12, CRIMSON, 0.14)}
      <circle cx="450" cy="350" r="220" fill="none" stroke="${FLAME}" stroke-width="10" opacity="0.4"/>
      <g fill="${CRIMSON}" opacity="0.85">
        <circle cx="330" cy="300" r="30"/>
        <circle cx="450" cy="250" r="30"/>
        <circle cx="570" cy="300" r="30"/>
        <circle cx="390" cy="420" r="30"/>
        <circle cx="510" cy="420" r="30"/>
      </g>
      <rect x="360" y="330" width="180" height="18" rx="9" fill="${INK}" opacity="0.75"/>
    </svg>`,
  },
  {
    name: 'campfire-night.webp',
    svg: `<svg width="900" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="g6" cx="50%" cy="65%" r="55%">
        <stop offset="0%" stop-color="${AMBER}"/><stop offset="45%" stop-color="${FLAME}"/><stop offset="100%" stop-color="${INK}"/>
      </radialGradient></defs>
      <rect width="900" height="600" fill="${INK}"/>
      <circle cx="450" cy="430" r="260" fill="url(#g6)"/>
      ${streaks(89, 9, CREAM, 0.16)}
      <g fill="${INK}" opacity="0.9">
        <circle cx="300" cy="470" r="34"/><rect x="272" y="500" width="56" height="80" rx="16"/>
        <circle cx="600" cy="470" r="34"/><rect x="572" y="500" width="56" height="80" rx="16"/>
        <circle cx="450" cy="500" r="34"/><rect x="422" y="530" width="56" height="80" rx="16"/>
      </g>
    </svg>`,
  },
];

for (const { name, svg } of images) {
  const buf = Buffer.from(svg);
  await sharp(buf).webp({ quality: 82 }).toFile(path.join(outDir, name));
  console.log('✓', name);
}
