
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Globe, Wallet, BarChart2 } from 'lucide-react';

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
      <ToggleGroup
        type="single"
        value={selectedFilter}
        onValueChange={(value: PaymentMethodFilterType) => {
          if (value) onFilterChange(value);
        }}
        className="flex justify-between w-full bg-navy-800/90 rounded-xl overflow-hidden border border-navy-700/50"
      >
        <ToggleGroupItem
          value="online"
          className="flex-1 data-[state=on]:bg-indigo-500/20 data-[state=on]:text-indigo-400 h-10 flex items-center justify-center gap-2"
        >
          <Globe className="h-4 w-4" />
          <span>Online</span>
        </ToggleGroupItem>
        
        <ToggleGroupItem
          value="offline"
          className="flex-1 data-[state=on]:bg-indigo-500/20 data-[state=on]:text-indigo-400 h-10 flex items-center justify-center gap-2 border-x"
        >
          <Wallet className="h-4 w-4" />
          <span>Offline</span>
        </ToggleGroupItem>
        
        <ToggleGroupItem
          value="all"
          className="flex-1 data-[state=on]:bg-indigo-500/20 data-[state=on]:text-indigo-400 h-10 flex items-center justify-center gap-2"
        >
          <BarChart2 className="h-4 w-4" />
          <span>All</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default PaymentMethodFilter;
