                                  
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
    sortBy?: 'price' | 'certificationLevel' | 'createdAt' | 'activity';
    sortOrder?: 'asc' | 'desc';
}

                                
export interface CatalogPagination {
  limit: number;
  cursor?: string;
}

                                 
export interface CatalogResult {
  items: PsychologistCatalogItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  freeSession: number;         // 0-10, уровень бесплатной консультации
  images: string[];
  educationCount: number;
  coursesCount: number;
}
