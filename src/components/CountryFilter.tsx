import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ChevronDown, Globe, X } from 'lucide-react';

interface CountryFilterProps {
  selectedCountry: string | null;
  onCountryChange: (country: string | null) => void;
}

const CountryFilter: React.FC<CountryFilterProps> = ({
  selectedCountry,
  onCountryChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Common country codes with names for display
  const countryNames: Record<string, string> = {
    'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany',
    'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland',
    'AT': 'Austria', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland',
    'PL': 'Poland', 'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania', 'BG': 'Bulgaria'
  };

  // Fetch available countries from backend
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const apiUrl = import.meta.env.PROD 
          ? 'https://moloco-crm-backend.onrender.com'
          : 'http://localhost:8000';
        
        const response = await fetch(`${apiUrl}/available-countries`);
        if (response.ok) {
          const data = await response.json();
          setAvailableCountries(data.countries || []);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };
    fetchCountries();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search term
  const filteredCountries = availableCountries.filter(countryCode => {
    const countryName = countryNames[countryCode] || countryCode;
    const searchLower = searchTerm.toLowerCase();
    return (
      countryCode.toLowerCase().includes(searchLower) ||
      countryName.toLowerCase().includes(searchLower)
    );
  });

  const handleCountrySelect = (countryCode: string) => {
    onCountryChange(countryCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onCountryChange(null);
  };

  const selectedCountryName = selectedCountry ? 
    (countryNames[selectedCountry] || selectedCountry) : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[200px] justify-between border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>
            {selectedCountry ? `${selectedCountry} - ${selectedCountryName}` : 'All Countries'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {selectedCountry && (
            <X
              className="h-3 w-3 hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 mt-2 z-50 shadow-lg min-w-[300px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Input
                placeholder="Search country or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                autoFocus
              />
              <Button
                variant="ghost"
                onClick={handleClear}
                className="w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                <Globe className="h-4 w-4 mr-2" />
                All Countries
              </Button>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((countryCode) => (
                    <Button
                      key={countryCode}
                      variant="ghost"
                      onClick={() => handleCountrySelect(countryCode)}
                      className="w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                    >
                      <span className="font-mono text-sm mr-3 text-blue-600 dark:text-blue-400">
                        {countryCode}
                      </span>
                      <span className="text-left">
                        {countryNames[countryCode] || countryCode}
                      </span>
                    </Button>
                  ))
                ) : availableCountries.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No countries available. Upload CSV data first.
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No countries match your search.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CountryFilter;
