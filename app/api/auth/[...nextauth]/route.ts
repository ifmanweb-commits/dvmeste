import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { CustomPrismaAdapter } from "@/lib/auth-adapter";

const handler = NextAuth({
  adapter: CustomPrismaAdapter(),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "localhost",
        port: Number(process.env.EMAIL_SERVER_PORT) || 1025,
        auth: {
          user: process.env.EMAIL_SERVER_USER || "",
          pass: process.env.EMAIL_SERVER_PASSWORD || "",
        },
      },
      from: process.env.EMAIL_FROM || "noreply@dvmeste.ru",
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login", // Добавить эту строку
    error: "/auth/login",   // Добавить эту строку
    verifyRequest: "/auth/login?sent=1",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'USER' | 'ADMIN' | 'MANAGER';
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('=== redirect callback ===');
      console.log('url:', url);
      console.log('baseUrl:', baseUrl);
      
      // Если есть callbackUrl в URL - используем его
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          // Это наш сайт - используем как есть
          return url;
        }
      } catch {
        // Невалидный URL - игнорируем
      }
      
      // Если нет конкретного callbackUrl, определяем по роли
      // Но здесь мы не знаем роль, так что оставляем на усмотрение страницы после входа
      return baseUrl;
    },
  },
});

export { handler as GET, handler as POST };