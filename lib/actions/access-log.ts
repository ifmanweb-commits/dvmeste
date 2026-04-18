import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

export type AccessEventType = 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT'
export type AccessFailedReason = 'user_not_found' | 'wrong_type' | 'expired_token' | 'consent_required'

interface LogAccessParams {
  eventType: AccessEventType
  sessionId?: string
  userId?: string
  clientId?: string
  userType?: 'psychologist' | 'client'
  email?: string
  ipAddress: string
  userAgent?: string
  reason?: AccessFailedReason
}

/**
 * Получить хэш email (как в User/Client)
 */
export function getEmailHash(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

/**
 * Записать событие в лог доступа
 */
export async function logAccess(params: LogAccessParams) {
  try {
    await prisma.accessLog.create({
      data: {
        eventType: params.eventType,
        sessionId: params.sessionId || null,
        userId: params.userId || null,
        clientId: params.clientId || null,
        userType: params.userType || null,
        emailHash: params.email ? getEmailHash(params.email) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent || null,
        reason: params.reason || null,
      },
    })
  } catch (error) {
    console.error('[AccessLog] Error logging access:', error)
  }
}

/**
 * Логирование успешного входа
 */
export async function logLoginSuccess(params: {
  sessionId: string
  userId?: string
  clientId?: string
  userType: 'psychologist' | 'client'
  ipAddress: string
  userAgent?: string
  email?: string
}) {
  return logAccess({
    eventType: 'LOGIN_SUCCESS',
    sessionId: params.sessionId,
    userId: params.userId,
    clientId: params.clientId,
    userType: params.userType,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    email: params.email,
  })
}

/**
 * Логирование неудачного входа
 */
export async function logLoginFailed(params: {
  email: string
  reason: AccessFailedReason
  ipAddress: string
  userAgent?: string
}) {
  return logAccess({
    eventType: 'LOGIN_FAILED',
    email: params.email,
    reason: params.reason,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Логирование выхода
 */
export async function logLogout(params: {
  sessionId: string
  userId?: string
  clientId?: string
  userType?: 'psychologist' | 'client'
  ipAddress: string
  userAgent?: string
}) {
  return logAccess({
    eventType: 'LOGOUT',
    sessionId: params.sessionId,
    userId: params.userId,
    clientId: params.clientId,
    userType: params.userType,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}