import "server-only";

import bcrypt from "bcryptjs";
import { createHash, createHmac, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

const DEFAULT_SUPER_ADMIN_LOGIN = "adminn";
const DEFAULT_SUPER_ADMIN_EMAIL = "admin@gmail.com";
const DEFAULT_SUPER_ADMIN_PASSWORD = "admin111";
const RESET_CODE_TTL_MINUTES = 15;
const RESET_TICKET_TTL_MINUTES = 15;
const UNISENDER_SEND_EMAIL_ENDPOINT = "https://api.unisender.com/ru/api/sendEmail";
const DEFAULT_UNISENDER_PLATFORM = "dvmeste";
const DEFAULT_FROM_EMAIL = "info@dvmeste.ru";

let superAdminSchemaEnsured = false;

export type SuperAdminPublicProfile = {
  id: string;
  login: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeLogin(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function validateLogin(login: string): string | null {
  if (!login) return "Укажите логин.";
  if (login.length < 3) return "Логин должен быть не короче 3 символов.";
  if (login.length > 64) return "Логин слишком длинный.";
  if (!/^[a-z0-9._-]+$/i.test(login)) return "Логин содержит недопустимые символы.";
  return null;
}

function validateEmail(email: string): string | null {
  if (!email) return "Укажите email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Укажите корректный email.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Укажите пароль.";
  if (password.length < 8) return "Пароль должен быть не короче 8 символов.";
  if (password.length > 128) return "Пароль слишком длинный.";
  return null;
}

function hashResetCode(code: string): string {
  const secret =
    process.env.ADMIN_RESET_CODE_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "dev_admin_reset_code_secret_change_me";
  return createHash("sha256").update(`${secret}:${code}`).digest("hex");
}

type ResetTicketPayload = {
  adminId: string;
  resetCodeId: string;
  exp: number;
};

function getResetTicketSecret(): string {
  return (
    process.env.ADMIN_RESET_TICKET_SECRET ||
    process.env.ADMIN_RESET_CODE_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "dev_admin_reset_ticket_secret_change_me"
  );
}

function signResetTicket(payload: ResetTicketPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getResetTicketSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function readResetTicket(ticket: string): ResetTicketPayload | null {
  const [body, signature] = ticket.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", getResetTicketSecret()).update(body).digest("base64url");
  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ResetTicketPayload;
    if (!payload || typeof payload !== "object") return null;
    if (!payload.adminId || !payload.resetCodeId || !payload.exp) return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function ensureSuperAdminSchema() {
  if (superAdminSchemaEnsured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "admin_accounts" (
      "id" TEXT NOT NULL,
      "login" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "admin_accounts_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "admin_accounts_login_key" ON "admin_accounts"("login");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "admin_accounts_email_key" ON "admin_accounts"("email");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "admin_password_reset_codes" (
      "id" TEXT NOT NULL,
      "adminId" TEXT NOT NULL,
      "codeHash" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "usedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "admin_password_reset_codes_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "admin_password_reset_codes_adminId_expiresAt_idx"
    ON "admin_password_reset_codes"("adminId", "expiresAt");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "admin_password_reset_codes_usedAt_idx"
    ON "admin_password_reset_codes"("usedAt");
  `);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'admin_password_reset_codes_adminId_fkey'
      ) THEN
        ALTER TABLE "admin_password_reset_codes"
        ADD CONSTRAINT "admin_password_reset_codes_adminId_fkey"
        FOREIGN KEY ("adminId") REFERENCES "admin_accounts"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  superAdminSchemaEnsured = true;
}

function normalizePlatform(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_]/g, "");
  return normalized || DEFAULT_UNISENDER_PLATFORM;
}

type UniSenderConfig = {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  listId: string;
  platform: string;
};

function isValidEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getUniSenderConfig(): UniSenderConfig | null {
  const apiKey = (process.env.UNISENDER_API_KEY || "").trim().replace(/^['"]+|['"]+$/g, "");
  const fromEmailRaw = (process.env.UNISENDER_FROM_EMAIL || DEFAULT_FROM_EMAIL).trim().replace(
    /^['"]+|['"]+$/g,
    ""
  );
  const fromName = ((process.env.UNISENDER_FROM_NAME || "Давай вместе").trim()).replace(
    /^['"]+|['"]+$/g,
    ""
  );
  const listId = (
    process.env.UNISENDER_ADMIN_LIST_ID ||
    process.env.UNISENDER_COMPLAINT_LIST_ID ||
    ""
  )
    .trim()
    .replace(/^['"]+|['"]+$/g, "");
  const platform = normalizePlatform(
    ((process.env.UNISENDER_PLATFORM || DEFAULT_UNISENDER_PLATFORM).trim()).replace(/^['"]+|['"]+$/g, "")
  );

  if (!apiKey || !/^\d+$/.test(listId)) return null;
  const fromEmail = isValidEmailAddress(fromEmailRaw) ? fromEmailRaw : DEFAULT_FROM_EMAIL;

  return {
    apiKey,
    fromEmail,
    fromName,
    listId,
    platform,
  };
}

async function callUniSenderSendEmail(params: URLSearchParams) {
  const config = getUniSenderConfig();
  if (!config) {
    throw new Error("Почта не настроена: укажите UNISENDER_API_KEY и UNISENDER_ADMIN_LIST_ID.");
  }

  const safeParams = new URLSearchParams(params.toString());
  safeParams.set("format", "json");
  safeParams.set("api_key", config.apiKey);
  safeParams.set("platform", config.platform);
  safeParams.set("sender_email", config.fromEmail);
  safeParams.set("sender_name", config.fromName);
  safeParams.set("list_id", config.listId);
  safeParams.set("error_checking", "1");
  safeParams.set("track_read", "0");
  safeParams.set("track_links", "0");
  safeParams.set("lang", "ru");

  const response = await fetch(UNISENDER_SEND_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",
    },
    body: safeParams.toString(),
  });

  const raw = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(`UniSender sendEmail error (${response.status}): ${raw || "unknown"}`);
  }

  let parsed: {
    result?: Array<{ errors?: Array<{ code?: string; message?: string }> }>;
    error?: string;
    code?: string;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`UniSender sendEmail invalid response: ${raw || "empty response"}`);
  }

  if (parsed.error || parsed.code) {
    throw new Error(
      `UniSender sendEmail error (${parsed.code || "unknown"}): ${parsed.error || "unknown"}`
    );
  }

  const firstError = Array.isArray(parsed.result)
    ? parsed.result
        .flatMap((item) => item.errors ?? [])
        .find((error) => error.code || error.message)
    : null;

  if (firstError) {
    throw new Error(
      `UniSender sendEmail error (${firstError.code || "unknown"}): ${firstError.message || "unknown"}`
    );
  }
}

async function sendResetCodeEmail(email: string, login: string, code: string) {
  const subject = "Код восстановления доступа в админ-панель";
  const html = `
    <h2>Восстановление доступа в админ-панель</h2>
    <p><b>Логин:</b> ${escapeHtml(login)}</p>
    <p><b>Код подтверждения:</b> <span style="font-size:20px;font-weight:700;">${escapeHtml(code)}</span></p>
    <p>Код действует ${RESET_CODE_TTL_MINUTES} минут.</p>
    <p>Если вы не запрашивали восстановление, просто проигнорируйте это письмо.</p>
  `;

  await callUniSenderSendEmail(
    new URLSearchParams({
      email,
      subject,
      body: html,
    })
  );
}

async function createResetCodeForAdmin(admin: {
  id: string;
  login: string;
  email: string;
}) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = hashResetCode(code);
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);

  await prisma.adminPasswordResetCode.deleteMany({
    where: {
      adminId: admin.id,
      OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }],
    },
  });

  await prisma.adminPasswordResetCode.create({
    data: {
      adminId: admin.id,
      codeHash,
      expiresAt,
    },
  });

  await sendResetCodeEmail(admin.email, admin.login, code);
}

function toPublicProfile(account: {
  id: string;
  login: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): SuperAdminPublicProfile {
  return {
    id: account.id,
    login: account.login,
    email: account.email,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export async function ensureSuperAdminAccount() {
  await ensureSuperAdminSchema();

  const existing = await prisma.adminAccount.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(DEFAULT_SUPER_ADMIN_PASSWORD, 10);
  try {
    return await prisma.adminAccount.create({
      data: {
        login: DEFAULT_SUPER_ADMIN_LOGIN,
        email: DEFAULT_SUPER_ADMIN_EMAIL,
        passwordHash,
      },
    });
  } catch {
    const fallback = await prisma.adminAccount.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!fallback) throw new Error("Не удалось создать учетную запись супер-админа.");
    return fallback;
  }
}

async function findAdminByIdentifier(identifier: string) {
  const value = identifier.trim();
  if (!value) return null;
  const normalized = value.toLowerCase();
  return prisma.adminAccount.findFirst({
    where: {
      OR: [{ login: normalized }, { email: normalized }],
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function authenticateSuperAdmin(identifier: string, password: string) {
  await ensureSuperAdminAccount();

  const admin = await findAdminByIdentifier(identifier);
  if (!admin) return null;

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) return null;

  return admin;
}

export async function getSuperAdminPublicProfile(): Promise<SuperAdminPublicProfile> {
  const admin = await ensureSuperAdminAccount();
  return toPublicProfile(admin);
}

export async function updateSuperAdminProfile(input: {
  currentPassword: string;
  login: string;
  email: string;
}) {
  const admin = await ensureSuperAdminAccount();
  const currentPassword = input.currentPassword.trim();
  const nextLogin = normalizeLogin(input.login);
  const nextEmail = normalizeEmail(input.email);

  const loginError = validateLogin(nextLogin);
  if (loginError) throw new Error(loginError);
  const emailError = validateEmail(nextEmail);
  if (emailError) throw new Error(emailError);

  const currentValid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!currentValid) throw new Error("Текущий пароль указан неверно.");

  if (nextLogin !== admin.login) {
    const duplicateLogin = await prisma.adminAccount.findFirst({
      where: { login: nextLogin, NOT: { id: admin.id } },
      select: { id: true },
    });
    if (duplicateLogin) throw new Error("Этот логин уже занят.");
  }

  if (nextEmail !== admin.email) {
    const duplicateEmail = await prisma.adminAccount.findFirst({
      where: { email: nextEmail, NOT: { id: admin.id } },
      select: { id: true },
    });
    if (duplicateEmail) throw new Error("Этот email уже используется.");
  }

  const updated = await prisma.adminAccount.update({
    where: { id: admin.id },
    data: {
      login: nextLogin,
      email: nextEmail,
    },
  });

  return toPublicProfile(updated);
}

export async function updateSuperAdminPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const admin = await ensureSuperAdminAccount();
  const currentPassword = input.currentPassword.trim();
  const newPassword = input.newPassword;

  const passwordError = validatePassword(newPassword);
  if (passwordError) throw new Error(passwordError);

  const currentValid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!currentValid) throw new Error("Текущий пароль указан неверно.");

  const sameAsCurrent = await bcrypt.compare(newPassword, admin.passwordHash);
  if (sameAsCurrent) throw new Error("Новый пароль должен отличаться от текущего.");

  const nextHash = await bcrypt.hash(newPassword, 10);

  await prisma.adminAccount.update({
    where: { id: admin.id },
    data: { passwordHash: nextHash },
  });
}

export async function updateSuperAdminSettings(input: {
  login: string;
  email: string;
  password: string;
}) {
  const admin = await ensureSuperAdminAccount();
  const nextLogin = normalizeLogin(input.login);
  const nextEmail = normalizeEmail(input.email);
  const nextPassword = input.password;

  const loginError = validateLogin(nextLogin);
  if (loginError) throw new Error(loginError);
  const emailError = validateEmail(nextEmail);
  if (emailError) throw new Error(emailError);
  const passwordError = validatePassword(nextPassword);
  if (passwordError) throw new Error(passwordError);

  if (nextLogin !== admin.login) {
    const duplicateLogin = await prisma.adminAccount.findFirst({
      where: { login: nextLogin, NOT: { id: admin.id } },
      select: { id: true },
    });
    if (duplicateLogin) throw new Error("Этот логин уже занят.");
  }

  if (nextEmail !== admin.email) {
    const duplicateEmail = await prisma.adminAccount.findFirst({
      where: { email: nextEmail, NOT: { id: admin.id } },
      select: { id: true },
    });
    if (duplicateEmail) throw new Error("Этот email уже используется.");
  }

  const nextPasswordHash = await bcrypt.hash(nextPassword, 10);

  const updated = await prisma.adminAccount.update({
    where: { id: admin.id },
    data: {
      login: nextLogin,
      email: nextEmail,
      passwordHash: nextPasswordHash,
    },
  });

  return toPublicProfile(updated);
}

export async function requestSuperAdminPasswordReset(identifier: string) {
  await ensureSuperAdminAccount();
  const admin = await findAdminByIdentifier(identifier);

  if (!admin) {
    return { delivered: true as const };
  }

  await createResetCodeForAdmin(admin);

  return { delivered: true as const };
}

export async function requestSuperAdminPasswordResetByEmail(email: string) {
  const admin = await ensureSuperAdminAccount();
  const normalizedInputEmail = normalizeEmail(email);
  const emailError = validateEmail(normalizedInputEmail);
  if (emailError) throw new Error(emailError);
  if (normalizedInputEmail !== admin.email) {
    throw new Error("Укажите email, который сохранен в профиле супер-админа.");
  }

  await createResetCodeForAdmin(admin);
  return {
    delivered: true as const,
  };
}

export async function verifySuperAdminPasswordResetCode(input: {
  identifier: string;
  code: string;
}) {
  await ensureSuperAdminAccount();

  const identifier = input.identifier.trim().toLowerCase();
  const code = input.code.trim();
  if (!identifier) throw new Error("Укажите логин или email.");
  if (!/^\d{6}$/.test(code)) throw new Error("Код должен состоять из 6 цифр.");

  const admin = await findAdminByIdentifier(identifier);
  if (!admin) throw new Error("Неверный код или email/логин.");

  const codeHash = hashResetCode(code);
  const resetRow = await prisma.adminPasswordResetCode.findFirst({
    where: {
      adminId: admin.id,
      codeHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!resetRow) throw new Error("Неверный или просроченный код.");

  return signResetTicket({
    adminId: admin.id,
    resetCodeId: resetRow.id,
    exp: Date.now() + RESET_TICKET_TTL_MINUTES * 60 * 1000,
  });
}

export async function resetSuperAdminPasswordByTicket(input: {
  ticket: string;
  newPassword: string;
}) {
  await ensureSuperAdminAccount();

  const payload = readResetTicket(input.ticket);
  if (!payload) throw new Error("Сессия восстановления недействительна.");

  const passwordError = validatePassword(input.newPassword);
  if (passwordError) throw new Error(passwordError);

  const resetRow = await prisma.adminPasswordResetCode.findFirst({
    where: {
      id: payload.resetCodeId,
      adminId: payload.adminId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, adminId: true },
  });

  if (!resetRow) throw new Error("Сессия восстановления истекла. Запросите новый код.");

  const nextHash = await bcrypt.hash(input.newPassword, 10);
  const now = new Date();

  await prisma.$transaction([
    prisma.adminAccount.update({
      where: { id: resetRow.adminId },
      data: { passwordHash: nextHash },
    }),
    prisma.adminPasswordResetCode.updateMany({
      where: { adminId: resetRow.adminId, usedAt: null },
      data: { usedAt: now },
    }),
  ]);
}

export async function confirmSuperAdminPasswordReset(input: {
  identifier: string;
  code: string;
  newPassword: string;
}) {
  await ensureSuperAdminAccount();

  const identifier = input.identifier.trim().toLowerCase();
  const code = input.code.trim();
  const newPassword = input.newPassword;

  const passwordError = validatePassword(newPassword);
  if (passwordError) throw new Error(passwordError);
  if (!/^\d{6}$/.test(code)) throw new Error("Код должен состоять из 6 цифр.");

  const admin = await findAdminByIdentifier(identifier);
  if (!admin) throw new Error("Неверный код или email/логин.");

  const codeHash = hashResetCode(code);
  const resetRow = await prisma.adminPasswordResetCode.findFirst({
    where: {
      adminId: admin.id,
      codeHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!resetRow) throw new Error("Неверный или просроченный код.");

  const nextHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.adminAccount.update({
      where: { id: admin.id },
      data: { passwordHash: nextHash },
    }),
    prisma.adminPasswordResetCode.updateMany({
      where: { adminId: admin.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);
}
