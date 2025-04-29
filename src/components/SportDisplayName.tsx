
import React, { useEffect, useState } from 'react';
import { getVenueSportDisplayNames } from '@/utils/sportDisplayNames';

interface SportDisplayNameProps {
  venueId: string;
  sportId: string;
  defaultName: string;
}

const SportDisplayName: React.FC<SportDisplayNameProps> = ({ venueId, sportId, defaultName }) => {
  const [displayName, setDisplayName] = useState<string>(defaultName);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisplayName = async () => {
      try {
        setLoading(true);
        const displayNames = await getVenueSportDisplayNames(venueId);
        setDisplayName(displayNames[sportId] || defaultName);
      } catch (error) {
        console.error('Error fetching sport display name:', error);
      } finally {
        setLoading(false);
      }
    };

    if (venueId && sportId) {
      fetchDisplayName();
    }
  }, [venueId, sportId, defaultName]);

  if (loading) {
    return <span>{defaultName}</span>;
  }

  return <>{displayName}</>;
};

export default SportDisplayName;
