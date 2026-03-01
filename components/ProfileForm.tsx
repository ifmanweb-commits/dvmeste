"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  initialData: {
    id: string;
    fullName: string;
    email: string;
    price: number;
    contactInfo: string | null;
  };
  isCandidate: boolean;
}

export function ProfileForm({ initialData, isCandidate }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    fullName: initialData.fullName,
    email: initialData.email,
    price: initialData.price.toString(),
    contactInfo: initialData.contactInfo || "",
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Валидация контактов (макс 100 символов)
    if (formData.contactInfo.length > 100) {
      newErrors.contactInfo = "Максимум 100 символов";
    }

    // Валидация цены (только цифры)
    if (!/^\d*$/.test(formData.price)) {
      newErrors.price = "Только цифры";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Для price — только цифры
    if (name === "price" && value && !/^\d*$/.test(value)) {
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку поля при изменении
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          price: parseInt(formData.price) || 0,
          contactInfo: formData.contactInfo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          throw new Error(data.error || "Ошибка сохранения");
        }
        return;
      }

      router.refresh();
      alert("Профиль обновлён");
    } catch (error: any) {
      setErrors({ form: error.message });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName: string) => `
    w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2] outline-none
    ${errors[fieldName] ? "border-red-500 bg-red-50" : "border-neutral-200"}
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Имя */}
      <div>
        <label className="block text-sm font-medium mb-1">Имя и фамилия</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          className={inputClass("fullName")}
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className={inputClass("email")}
        />
      </div>

      {/* Цена */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Цена (₽) <span className="text-gray-500 text-xs">только цифры</span>
        </label>
        <input
          type="text"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
          className={inputClass("price")}
        />
        {errors.price && (
          <p className="text-red-500 text-sm mt-1">{errors.price}</p>
        )}
      </div>

      {/* Контакты */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Контакты <span className="text-gray-500 text-xs">макс. 100 символов</span>
        </label>
        <textarea
          name="contactInfo"
          value={formData.contactInfo}
          onChange={handleChange}
          rows={3}
          maxLength={100}
          className={inputClass("contactInfo")}
        />
        <div className="flex justify-between text-xs mt-1">
          <span className={errors.contactInfo ? "text-red-500" : "text-gray-500"}>
            {formData.contactInfo.length}/100
          </span>
          {errors.contactInfo && (
            <span className="text-red-500">{errors.contactInfo}</span>
          )}
        </div>
      </div>

      {errors.form && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {errors.form}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-[#5858E2] text-white px-6 py-2 rounded-lg hover:bg-[#4747b5] disabled:opacity-50"
      >
        {loading ? "Сохранение..." : "Сохранить изменения"}
      </button>
    </form>
  );
}