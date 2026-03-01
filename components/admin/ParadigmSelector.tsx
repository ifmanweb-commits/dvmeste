                                        
"use client";

import { useState, useEffect, useRef } from 'react';
import { getDataListItems } from '@/lib/actions/admin-references';
import { X, ChevronDown, Search } from 'lucide-react';

interface ParadigmSelectorProps {
  defaultValue?: string[];
  name?: string;
  onChange?: (paradigms: string[]) => void;
}

export function ParadigmSelector({ defaultValue = [], name = "mainParadigm", onChange }: ParadigmSelectorProps) {
  const [allParadigms, setAllParadigms] = useState<string[]>([]);
  const [selectedParadigms, setSelectedParadigms] = useState<string[]>(defaultValue);
  const [search, setSearch] = useState('');
  const [filteredParadigms, setFilteredParadigms] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

                                    
  useEffect(() => {
    const loadParadigms = async () => {
      try {
        const data = await getDataListItems('paradigms');
        setAllParadigms(data);
        setFilteredParadigms(data);
      } catch (error) {
        console.error('Error loading paradigms:', error);
      } finally {
        setLoading(false);
      }
    };
    loadParadigms();
  }, []);

                          
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredParadigms(allParadigms.filter(p => !selectedParadigms.includes(p)));
    } else {
      const filtered = allParadigms.filter(paradigm =>
        paradigm.toLowerCase().includes(search.toLowerCase()) && 
        !selectedParadigms.includes(paradigm)
      );
      setFilteredParadigms(filtered);
    }
  }, [search, allParadigms, selectedParadigms]);

                                          
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    onChange?.(selectedParadigms);
  }, [onChange, selectedParadigms]);

  const handleAddParadigm = (paradigm: string) => {
    if (!selectedParadigms.includes(paradigm)) {
      const newSelected = [...selectedParadigms, paradigm];
      setSelectedParadigms(newSelected);
      setSearch('');
      setIsDropdownOpen(false);
      inputRef.current?.focus();
    }
  };

  const handleRemoveParadigm = (paradigm: string) => {
    setSelectedParadigms(prev => prev.filter(p => p !== paradigm));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredParadigms.length > 0) {
      e.preventDefault();
      handleAddParadigm(filteredParadigms[0]);
    }
    if (e.key === 'Backspace' && !search && selectedParadigms.length > 0) {
                                                                        
      setSelectedParadigms(prev => prev.slice(0, -1));
    }
  };

  return (
    <div ref={containerRef} className="space-y-3">
      {                                                   }
      {selectedParadigms.map((paradigm, index) => (
        <input
          key={index}
          type="hidden"
          name={name}
          value={paradigm}
        />
      ))}

      {                }
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Начните вводить название парадигмы..."
              className="w-full pl-10 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
            />
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {                           }
        {isDropdownOpen && !loading && filteredParadigms.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredParadigms.map((paradigm, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleAddParadigm(paradigm)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-900 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <span>{paradigm}</span>
                  <span className="text-xs text-gray-400">Нажмите для выбора</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {                                      }
        {isDropdownOpen && search && filteredParadigms.length === 0 && !loading && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
            <p className="text-gray-500 text-center">
              Парадигма не найдена. Доступные варианты можно добавить в разделе &quot;Справочники&quot;.
            </p>
          </div>
        )}

        {              }
        {isDropdownOpen && loading && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#5858E2]"></div>
            </div>
          </div>
        )}
      </div>

      {                         }
      {selectedParadigms.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Выбрано парадигм: {selectedParadigms.length}
            </span>
            <button
              type="button"
              onClick={() => setSelectedParadigms([])}
              className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Удалить все
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedParadigms.map((paradigm, index) => (
              <div
                key={index}
                className="group flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
              >
                <span className="text-blue-800 font-medium">{paradigm}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveParadigm(paradigm)}
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                  title="Удалить"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {                }
      <div className="text-sm text-gray-500">
        <p>• Введите название парадигмы и выберите из списка</p>
        <p>• Можно выбрать несколько парадигм</p>
        <p>• Доступно парадигм: {allParadigms.length}</p>
      </div>
    </div>
  );
}
