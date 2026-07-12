interface PartnersMarqueeProps {
  names: string[];
}

export default function PartnersMarquee({ names }: PartnersMarqueeProps) {
  if (names.length === 0) return null;

  // Repeat the list enough times that a single "set" is wider than the viewport,
  // then render two identical sets and translate by -50% for a seamless loop.
  const copies = Math.max(2, Math.ceil(16 / names.length));
  const set: string[] = [];
  for (let i = 0; i < copies; i++) set.push(...names);
  const track = [...set, ...set];

  return (
    <div className="relative overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <div className="marquee-track flex w-max items-center gap-5" style={{ ['--speed' as string]: '45s' }}>
        {track.map((name, i) => (
          <div key={i} className="-skew-x-[8deg] rounded-lg border-2 border-crimson/10 bg-white px-6 py-3">
            <div className="flex skew-x-[8deg] items-center gap-3 whitespace-nowrap">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-flame-gradient text-sm font-black text-white">
                {name.charAt(0)}
              </span>
              <span className="font-display text-base font-bold text-ink/80">{name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
