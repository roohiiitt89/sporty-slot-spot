
import React, { useState } from 'react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import useEmblaCarousel from 'embla-carousel-react';

interface VenueImageCarouselProps {
  images: string[];
  venueName: string;
  className?: string;
}

const VenueImageCarousel: React.FC<VenueImageCarouselProps> = ({ 
  images, 
  venueName,
  className = "h-80 md:h-96"
}) => {
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // If there are no images, show a placeholder
  if (!images || images.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full bg-navy-dark/70 flex items-center justify-center">
          <p className="text-gray-400">No images available</p>
        </div>
      </div>
    );
  }
  
  // If there's only one image, return a simple image container
  if (images.length === 1) {
    return (
      <div className={`relative ${className}`}>
        <img 
          src={images[0]} 
          alt={venueName} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Carousel className="w-full h-full" setApi={(api) => {
        if (api) {
          // Set up event listener for slide changes
          api.on('select', () => {
            setCurrentIndex(api.selectedScrollSnap());
          });
        }
      }}>
        <CarouselContent className="h-full">
          {images.map((image, index) => (
            <CarouselItem key={index} className="h-full">
              <div className="relative h-full">
                <img 
                  src={image} 
                  alt={`${venueName} - Image ${index + 1}`}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                
                <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                  {index + 1} / {images.length}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-2 bg-black/30 hover:bg-black/60 backdrop-filter backdrop-blur-sm border-none text-white z-10">
          <ChevronLeft className="h-4 w-4" />
        </CarouselPrevious>
        <CarouselNext className="absolute right-2 bg-black/30 hover:bg-black/60 backdrop-filter backdrop-blur-sm border-none text-white z-10">
          <ChevronRight className="h-4 w-4" />
        </CarouselNext>
      </Carousel>
      
      {/* Image indicators for quick navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white scale-110' : 'bg-white/40'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueImageCarousel;
