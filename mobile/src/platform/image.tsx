import type { ImgHTMLAttributes } from 'react';
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src: string | { src: string }; fill?: boolean; priority?: boolean; unoptimized?: boolean; quality?: number; placeholder?: string; blurDataURL?: string };
export default function Image({ src, fill, priority, unoptimized: _unoptimized, quality: _quality, placeholder: _placeholder, blurDataURL: _blur, style, alt, ...props }: Props) {
  void _unoptimized; void _quality; void _placeholder; void _blur;
  return <img {...props} alt={alt ?? ''} src={typeof src === 'string' ? src : src.src} loading={priority ? 'eager' : 'lazy'} decoding="async" style={{ ...(fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : {}), ...style }} />;
}
