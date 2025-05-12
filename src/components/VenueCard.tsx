
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';

interface VenueCardProps {
  id: string;
  name: string;
  image?: string;
  address?: string;
  rating?: number;
  distance?: string;
  isMobile?: boolean;
}

const VenueCard: React.FC<VenueCardProps> = ({
  id,
  name,
  image,
  address,
  rating,
  distance,
  isMobile = false
}) => {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    navigate(`/venues/${id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="venue-card h-48 lg:h-56 relative overflow-hidden cursor-pointer transition-all"
    >
      <div className="absolute inset-0">
        <img 
          src={image || 'https://via.placeholder.com/400x250?text=No+Image'} 
          alt={name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <h3 className="font-bold text-sm md:text-base truncate">{name}</h3>
        
        <div className="flex items-center text-xs md:text-sm opacity-90 mt-1">
          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">{address || 'Location not available'}</span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          {rating !== undefined && (
            <div className="flex items-center bg-indigo/80 text-white px-2 py-0.5 rounded text-xs">
              <Star className="w-3 h-3 mr-1 text-yellow-300" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
          
          {distance && (
            <span className="text-xs bg-black/50 px-2 py-0.5 rounded">
              {distance}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
