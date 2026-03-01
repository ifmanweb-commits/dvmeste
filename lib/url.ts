import { ReadonlyURLSearchParams } from "next/navigation";
   
                                                                          
   
export type SearchParams = Record<string, string | string[] | undefined>;

export type CatalogUrlOverrides = Record<string, string | string[]>;

   
                                                                 
                                                                 
                                                                                               
   
export function buildCatalogUrl(
  current: SearchParams,
  overrides: CatalogUrlOverrides
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value !== "") {
      params.set(key, value);
    }
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === "" || (Array.isArray(value) && value.length === 0)) {
      params.delete(key);
    } else if (Array.isArray(value)) {
      params.delete(key);
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }
  const query = params.toString();
  const base = "/psy-list";
  return query ? `${base}?${query}` : base;
}

   
                                                                                   
                                                                  
   
export function searchParamsToObject(
  params: URLSearchParams | ReadonlyURLSearchParams
): SearchParams {
  const result: SearchParams = {};
  for (const key of params.keys()) {
    const all = params.getAll(key);
    result[key] = all.length === 1 ? all[0] : all;
  }
  return result;
}
