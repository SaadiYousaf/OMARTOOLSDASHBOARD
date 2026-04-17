import React, { useState } from 'react';

const placeholderBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(145deg, #051e45 0%, #072c62 55%, #0d3d7a 100%)',
  overflow: 'hidden',
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: 60,
  borderRadius: 'inherit',
};

let shimmerInjected = false;
function injectShimmer() {
  if (shimmerInjected || typeof document === 'undefined') return;
  shimmerInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ot-shimmer {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes ot-pulse {
      0%, 100% { opacity: 0.65; transform: scale(1) rotate(0deg); }
      50%       { opacity: 1;    transform: scale(1.1) rotate(-8deg); }
    }
    .ot-ph-shimmer::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.07) 50%, transparent 80%);
      transform: translateX(-100%);
      animation: ot-shimmer 2.6s ease-in-out infinite;
    }
    .ot-ph-icon {
      animation: ot-pulse 2.2s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

const WrenchIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

interface OmerPlaceholderProps {
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'lg';
}

export const OmerPlaceholder: React.FC<OmerPlaceholderProps> = ({ className, style, size }) => {
  injectShimmer();
  const iconSize = size === 'sm' ? 22 : size === 'lg' ? 52 : 36;
  const textSize = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;

  return (
    <div
      className={`ot-ph-shimmer${className ? ` ${className}` : ''}`}
      style={{ ...placeholderBase, ...style }}
      aria-label="Omer Tools image placeholder"
      role="img"
    >
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 8 }}>
        <WrenchIcon style={{ width: iconSize, height: iconSize, color: 'rgba(255,255,255,0.75)', flexShrink: 0 }} />
        <span className="ot-ph-icon" style={{
          fontSize: textSize, fontWeight: 800, letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
          fontFamily: "-apple-system, 'Segoe UI', sans-serif", whiteSpace: 'nowrap', userSelect: 'none',
        }}>Omer Tools</span>
      </div>
    </div>
  );
};

interface OmerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  size?: 'sm' | 'lg';
  imgStyle?: React.CSSProperties;
}

const OmerImage: React.FC<OmerImageProps> = ({ src, alt = '', size, imgStyle, className, style, ...rest }) => {
  const [failed, setFailed] = useState(!src);
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    if (src) setFailed(false);
  }

  if (failed) {
    return <OmerPlaceholder className={className} style={style} size={size} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ ...style, ...imgStyle }}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
};

export default OmerImage;
