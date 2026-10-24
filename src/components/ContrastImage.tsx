import type { CSSProperties, ReactNode, SyntheticEvent } from 'react';
import { useContrastBg } from '../lib/imageBackground';

interface ContrastImageProps {
  src: string;
  alt: string;
  padding?: string;
  frameStyle?: CSSProperties;
  imgStyle?: CSSProperties;
  onClick?: () => void;
  onError?: (e: SyntheticEvent<HTMLImageElement>) => void;
  onHoverImg?: (e: SyntheticEvent<HTMLImageElement>) => void;
  onLeaveImg?: (e: SyntheticEvent<HTMLImageElement>) => void;
  badge?: ReactNode;
}

export default function ContrastImage({
  src,
  alt,
  padding = '0.5rem',
  frameStyle,
  imgStyle,
  onClick,
  onError,
  onHoverImg,
  onLeaveImg,
  badge,
}: ContrastImageProps) {
  const bg = useContrastBg(src);
  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1', background: bg, ...frameStyle }}
      onClick={onClick}
    >
      {badge}
      <img
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'contain', padding, ...imgStyle }}
        onError={onError}
        onMouseEnter={onHoverImg}
        onMouseLeave={onLeaveImg}
      />
    </div>
  );
}
