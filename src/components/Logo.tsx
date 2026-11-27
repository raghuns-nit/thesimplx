import { useSettings } from '../context/SettingsContext';

interface LogoProps {
  width?: number;
  alt?: string;
  variant?: 'default' | 'light';
  shimmer?: boolean;
  style?: React.CSSProperties;
}

export default function Logo({ width = 176, alt = 'Simplx World', variant = 'default', shimmer = false, style }: LogoProps) {
  const { settings } = useSettings();
  const src = settings?.logo_url || '/logo.svg';

  const baseStyle: React.CSSProperties = {
    width: `${width}px`,
    height: 'auto',
    objectFit: 'contain',
    ...style,
  };

  const variantStyle: React.CSSProperties = variant === 'light'
    ? { filter: 'brightness(0) invert(1)' }
    : {};

  const finalStyle = { ...baseStyle, ...variantStyle };

  if (shimmer) {
    return (
      <div className="logo-shimmer" style={{ display: 'inline-block', borderRadius: 'var(--radius-sm)' }}>
        <img src={src} alt={alt} style={finalStyle} />
      </div>
    );
  }

  return <img src={src} alt={alt} style={finalStyle} />;
}
