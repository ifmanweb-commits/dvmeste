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
      /*console.log('=== JWT CALLBACK ===');
      console.log('user:', user);
      console.log('token before:', token);*/
      if (user) {
        token.id = user.id;
        token.isPsychologist = user.isPsychologist;
        token.isManager = user.isManager;
        token.isAdmin = user.isAdmin;
        //console.log('token after:', token);
      }
      return token;
    },
    async session({ session, token }) {
      /*console.log('=== SESSION CALLBACK ===');
      console.log('token:', token);*/
      
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isPsychologist = token.isPsychologist as boolean;
        session.user.isManager = token.isManager as boolean;
        session.user.isAdmin = token.isAdmin as boolean;
        console.log('session after:', session);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      /*console.log('=== redirect callback ===');
      console.log('url:', url);
      console.log('baseUrl:', baseUrl);*/
      
      // Всегда редиректим на /auth/after-login после успешного входа
      // Эта страница сама определит куда идти дальше по флагам
      return `${baseUrl}/auth/after-login`;
    },
  },
});

export { handler as GET, handler as POST };