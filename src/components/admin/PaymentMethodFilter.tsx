
import React from 'react';
import { Button } from '@/components/ui/button';

export type PaymentMethodFilterType = 'online' | 'offline' | 'all';

interface PaymentMethodFilterProps {
  selectedFilter: PaymentMethodFilterType;
  onFilterChange: (filter: PaymentMethodFilterType) => void;
}

const PaymentMethodFilter: React.FC<PaymentMethodFilterProps> = ({ 
  selectedFilter, 
  onFilterChange 
}) => {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Booking Source:</h3>
      <div className="flex rounded-md overflow-hidden border w-full">
        <Button 
          variant={selectedFilter === 'online' ? 'default' : 'ghost'}
          className="rounded-none w-1/3"
          onClick={() => onFilterChange('online')}
        >
          Online
        </Button>
        <Button 
          variant={selectedFilter === 'offline' ? 'default' : 'ghost'}
          className="rounded-none border-l border-r w-1/3"
          onClick={() => onFilterChange('offline')}
        >
          Offline
        </Button>
        <Button 
          variant={selectedFilter === 'all' ? 'default' : 'ghost'}
          className="rounded-none w-1/3"
          onClick={() => onFilterChange('all')}
        >
          All
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethodFilter;
