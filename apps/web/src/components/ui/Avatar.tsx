type AvatarProps = {
  name?: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
};

function initials(name?: string) {
  return (name?.trim() || '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-[10px]' : size === 'lg' ? 'h-14 w-14 text-sm' : 'h-11 w-11 text-xs';
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`${sizeClass} shrink-0 rounded-full object-cover`} src={src} alt={`${name ?? 'Character'} avatar`} />
  ) : (
    <div className={`grid ${sizeClass} shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#7856ff] font-bold text-white`}>
      {initials(name)}
    </div>
  );
}
