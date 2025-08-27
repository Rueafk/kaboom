import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X, Calendar, Minus, Plus } from 'lucide-react';
import { FilterOptions } from '@/types';
import { debounce } from '@/lib/utils';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export default function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounced search to avoid too many API calls
  const debouncedSearch = debounce((search: string) => {
    onFiltersChange({ ...localFilters, search });
  }, 300);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (search: string) => {
    setLocalFilters(prev => ({ ...prev, search }));
    debouncedSearch(search);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterOptions = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  return (
    <div className="w-full">
      <div className="flex items-center space-x-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
          <input
            type="text"
            placeholder="Search by wallet or username..."
            value={localFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            hasActiveFilters
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/10 text-white/60 hover:text-white'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== null).length}
            </span>
          )}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={localFilters.from || ''}
                onChange={(e) => handleFilterChange('from', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={localFilters.to || ''}
                onChange={(e) => handleFilterChange('to', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Score Range */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Minus className="inline h-4 w-4 mr-1" />
                Min Score
              </label>
              <input
                type="number"
                placeholder="0"
                value={localFilters.minScore || ''}
                onChange={(e) => handleFilterChange('minScore', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Plus className="inline h-4 w-4 mr-1" />
                Max Score
              </label>
              <input
                type="number"
                placeholder="∞"
                value={localFilters.maxScore || ''}
                onChange={(e) => handleFilterChange('maxScore', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Status
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value=""
                  checked={localFilters.isBanned === undefined}
                  onChange={() => handleFilterChange('isBanned', undefined)}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className="text-white/80">All</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value="false"
                  checked={localFilters.isBanned === false}
                  onChange={() => handleFilterChange('isBanned', false)}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className="text-white/80">Active</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value="true"
                  checked={localFilters.isBanned === true}
                  onChange={() => handleFilterChange('isBanned', true)}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className="text-white/80">Banned</span>
              </label>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
