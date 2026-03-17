import { cn } from "@/lib/utils"
import { 
  Bell, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  UserCheck, 
  UserX,
  FileCheck,
  Info
} from "lucide-react"

interface NotificationCardProps {
  notification: {
    id: string
    type: string
    title: string
    message: string
    linkUrl: string | null
    linkText: string | null
    isRead: boolean
    createdAt: Date
  }
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const icon = getNotificationIcon(notification.type)
  const bgColor = getNotificationBgColor(notification.type)

  return (
    <div className={cn(
      "p-5 bg-white border rounded-xl transition-colors",
      notification.isRead 
        ? "border-gray-200" 
        : "border-blue-300 bg-blue-50/30"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          bgColor
        )}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {notification.title}
            </h3>
            {!notification.isRead && (
              <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-gray-600 text-sm mb-3">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {formatDate(notification.createdAt)}
            </span>
            
            {notification.linkUrl && notification.linkText && (
              <a
                href={notification.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 bg-[#5858E2] hover:bg-[#4a4ac4] text-white text-sm font-medium rounded-lg transition-colors"
              >
                {notification.linkText}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getNotificationIcon(type: string) {
  const iconProps = { className: "w-5 h-5" }
  
  switch (type) {
    case "LEAD":
      return <Bell {...iconProps} className="w-5 h-5 text-white" />
    case "ARTICLE_APPROVED":
      return <CheckCircle {...iconProps} className="w-5 h-5 text-white" />
    case "ARTICLE_REVISION":
      return <AlertCircle {...iconProps} className="w-5 h-5 text-white" />
    case "PROFILE_APPROVED":
      return <UserCheck {...iconProps} className="w-5 h-5 text-white" />
    case "PROFILE_REJECTED":
      return <UserX {...iconProps} className="w-5 h-5 text-white" />
    case "DOCUMENT_VERIFIED":
      return <FileCheck {...iconProps} className="w-5 h-5 text-white" />
    case "REMINDER":
      return <FileText {...iconProps} className="w-5 h-5 text-white" />
    case "INFO":
      return <Info {...iconProps} className="w-5 h-5 text-white" />
    default:
      return <Bell {...iconProps} className="w-5 h-5 text-white" />
  }
}

function getNotificationBgColor(type: string) {
  switch (type) {
    case "LEAD":
      return "bg-green-500"
    case "ARTICLE_APPROVED":
      return "bg-green-500"
    case "ARTICLE_REVISION":
      return "bg-yellow-500"
    case "PROFILE_APPROVED":
      return "bg-green-500"
    case "PROFILE_REJECTED":
      return "bg-red-500"
    case "DOCUMENT_VERIFIED":
      return "bg-blue-500"
    case "REMINDER":
      return "bg-orange-500"
    case "INFO":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date))
}
