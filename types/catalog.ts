                                  
export interface CatalogFilters {
    priceMin?: number;
    priceMax?: number;
    ageMin?: number;
    ageMax?: number;
    paradigms?: string[];
    certificationLevels?: (0 | 1 | 2 | 3)[];
    city?: string;
    gender?: string;
    workFormat?: string;
    sortBy?: 'price' | 'certificationLevel' | 'createdAt' | 'age';
    sortOrder?: 'asc' | 'desc';
}

                                
export interface CatalogPagination {
  limit: number;
  cursor?: string;
}

                                 
export interface CatalogResult {
  items: PsychologistCatalogItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

                                    
export interface PsychologistCatalogItem {
  id: string;
  slug: string;                // string (уже ок)
  fullName: string;            // string
  gender: string;              // string
  birthDate: Date | null;      // ← разрешить null
  city: string | null;         // ← разрешить null (или оставить string, если подставляешь '')
  workFormat: string;          // string
  mainParadigm: string[];
  certificationLevel: number;
  shortBio: string;            // string
  price: number | null;        // ← разрешить null
  images: string[];
  educationCount: number;
  coursesCount: number;
}
