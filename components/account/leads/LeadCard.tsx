"use client";

import { LeadStatus } from "@prisma/client";
import Link from "next/link";
import { ExternalLink, AlertTriangle, Clock, Mail, Phone } from "lucide-react";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
} from "@/lib/lead-status-config";

interface LeadClient {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  vk: string | null;
  complaintCount?: number;
}

interface LeadCardProps {
  id: string;
  client: LeadClient;
  message: string | null;
  status: LeadStatus;
  isSuspicious: boolean;
  createdAt: string;
  statusChangedAt: string | null;
}

function getStatusColorClass(color: string): string {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-700 border-green-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    red: "bg-red-100 text-red-700 border-red-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };
  return colors[color] || colors.gray;
}

export function LeadCard({
  id,
  client,
  message,
  status,
  isSuspicious,
  createdAt,
  statusChangedAt,
}: LeadCardProps) {
  const statusColor = LEAD_STATUS_COLORS[status];
  const statusClass = getStatusColorClass(statusColor);
  const statusLabel = LEAD_STATUS_LABELS[status];

  const formattedDate = new Date(createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = new Date(createdAt).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#5858E2]/30 hover:shadow-lg transition-all duration-200">
      {/* Верхняя часть с предупреждением */}
      {isSuspicious && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-700">
            Жалоб: {client.complaintCount || 0}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Заголовок: Имя клиента + статус */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/account/leads/${id}`}
              className="text-base font-bold text-gray-900 truncate hover:text-[#5858E2] transition-colors"
            >
              {client.name || "Аноним"}
            </Link>
            {statusChangedAt && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {status === LeadStatus.ACCEPTED || status === LeadStatus.COMPLETED
                    ? `Принят ${new Date(statusChangedAt).toLocaleDateString("ru-RU")}`
                    : new Date(statusChangedAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            )}
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Сообщение клиента */}
        {message && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {message}
            </p>
          </div>
        )}

        {/* Контакты (показываем только для принятых заявок) */}
        {(status === LeadStatus.ACCEPTED || status === LeadStatus.COMPLETED) && (
          <div className="mb-4 pt-4 border-t border-gray-100 space-y-2">
            {client.email && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{client.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Дата и время создания */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedDate}, {formattedTime}</span>
        </div>

        {/* Кнопка "Подробнее" */}
        <Link
          href={`/account/leads/${id}`}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#5858E2] text-white text-sm font-semibold rounded-lg hover:bg-[#4a4ac9] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Подробнее
        </Link>
      </div>
    </div>
  );
}