"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { buildCatalogUrl, searchParamsToObject } from "@/lib/url";
import { PARADIGM_OPTIONS } from "@/lib/paradigm-options";
import { X } from "lucide-react";

const LEVELS: (1 | 2 | 3)[] = [1, 2, 3];

type Props = {
  initialParams: Record<string, string | string[] | undefined>;
  onFormSubmit?: () => void;                           
};

                                                                    
export function CatalogSidebar({ initialParams, onFormSubmit }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const get = useCallback(
    (key: string): string => {
      const v = searchParams?.get(key) ?? initialParams[key];
      if (Array.isArray(v)) return v[0] ?? "";
      return (v as string) ?? "";
    },
    [searchParams, initialParams]
  );

                                             
  const getAgeValue = (key: 'ageMin' | 'ageMax'): string => {
    const value = get(key);
    return value || "";
  };

  const apply = useCallback(
    (updates: Record<string, string | string[]>) => {
      const current = searchParams ? searchParamsToObject(searchParams) : {};
      const url = buildCatalogUrl(current, updates);
      startTransition(() => router.push(url));
                                       
      if (onFormSubmit) {
        onFormSubmit();
      }
    },
    [router, searchParams, onFormSubmit]
  );

                                 
  const resetFilters = () => {
    startTransition(() => {
      router.push("/psy-list#list");                                      
      if (onFormSubmit) {
        onFormSubmit();
      }
    });
  };

                                       
  const hasActiveFilters = () => {
    const params = [
      'priceMin', 'priceMax', 'city', 'gender', 'paradigms', 'levels', 
      'sortBy', 'sortOrder', 'ageMin', 'ageMax'
    ];
    return params.some(param => {
      const value = get(param);
      return value !== "" && value !== undefined && value !== null;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
                      
    const priceMin = (formData.get("priceMin") as string)?.trim() ?? "";
    const priceMax = (formData.get("priceMax") as string)?.trim() ?? "";
    const city = (formData.get("city") as string)?.trim() ?? "";
    const gender = (formData.get("gender") as string)?.trim() ?? "";
    const paradigm = (formData.get("paradigm") as string)?.trim() ?? "";
    const level = (formData.get("level") as string)?.trim() ?? "";
    const sort = (formData.get("sort") as string)?.trim() ?? "createdAt-desc";
    
                         
    const ageMin = (formData.get("ageMin") as string)?.trim() ?? "";
    const ageMax = (formData.get("ageMax") as string)?.trim() ?? "";
    
    const [sortBy, sortOrder] = sort.includes("-") ? sort.split("-") : [sort, "desc"];
    
    apply({
      priceMin,
      priceMax,
      city,
      gender,
      paradigms: paradigm ? [paradigm] : [],
      levels: level ? [level] : [],
      ageMin,
      ageMax,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
      cursor: "",
    });
  };

  const selectedParadigm = get("paradigms") || get("paradigm");
  const selectedLevel = get("levels") || get("level");
  const sortBy = get("sortBy") || "createdAt";
  const sortOrder = get("sortOrder") || "desc";
  const sortValue = `${sortBy}-${sortOrder}`;

                                   
  const ageMinValue = getAgeValue('ageMin');
  const ageMaxValue = getAgeValue('ageMax');

  return (
    <aside className="w-full shrink-0 lg:w-[300px]">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-5">
          {               }
          <div className="mb-4">
            <h3 className="text-xl font-bold text-foreground">Фильтры</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {          }
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-dark">Цена (₽)</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    name="priceMin"
                    min={0}
                    defaultValue={get("priceMin")}
                    placeholder="от"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    name="priceMax"
                    min={0}
                    defaultValue={get("priceMax")}
                    placeholder="до"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {             }
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-dark">Возраст психолога</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    name="ageMin"
                    min={0}
                    max={100}
                    defaultValue={ageMinValue}
                    placeholder="от"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    name="ageMax"
                    min={0}
                    max={100}
                    defaultValue={ageMaxValue}
                    placeholder="до"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            
            </div>

            {           }
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-dark">Город</label>
              <input
                type="text"
                name="city"
                defaultValue={get("city")}
                placeholder="Москва, Санкт-Петербург..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            {         }
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-dark">Пол</label>
              <select
                name="gender"
                defaultValue={get("gender") || ""}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Не важно</option>
                <option value="М">Мужской</option>
                <option value="Ж">Женский</option>
              </select>
            </div>

            {           }
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-dark">Метод / Подход</label>
              <select
                name="paradigm"
                defaultValue={selectedParadigm || ""}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Не важно</option>
                {PARADIGM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {                          }
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-dark">Уровень сертификации</label>
              <select
                name="level"
                defaultValue={selectedLevel || ""}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Любой уровень</option>
                {LEVELS.map((l) => (
                  <option key={l} value={String(l)}>
                    {l} уровень
                  </option>
                ))}
              </select>
            </div>

            {                }
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-dark">Сортировка</label>
              <select
                name="sort"
                defaultValue={sortValue}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="createdAt-desc">Сначала новые</option>
                <option value="price-asc">Дешевле</option>
                <option value="price-desc">Дороже</option>
                <option value="certificationLevel-desc">По уровню (высший)</option>
                <option value="age-asc">Моложе</option>
                <option value="age-desc">Старше</option>
              </select>
            </div>

            {                     }
            <div className="space-y-2.5 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-[#5858E2] py-3 text-sm font-semibold text-white hover:bg-[#4848d0] disabled:opacity-60"
              >
                {isPending ? "Применяем фильтры..." : "Применить фильтры"}
              </button>
              
              {hasActiveFilters() && (
                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={isPending}
                  className="w-full rounded-xl border border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Сбросить все фильтры
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </aside>
  );
}
