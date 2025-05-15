
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  placeholderSrc?: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

const ProgressiveImage = ({
  src,
  placeholderSrc = '/placeholder.svg',
  alt,
  className,
  width,
  height
}: ProgressiveImageProps) => {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || src);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
    };
    return () => {
      img.onload = null;
    };
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        className,
        isLoading && 'animate-pulse bg-gray-200 dark:bg-gray-700'
      )}
    />
  );
};

export default ProgressiveImage;
