import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { Adapter, AdapterUser } from "next-auth/adapters";

export function CustomPrismaAdapter(): Adapter {
  const adapter = PrismaAdapter(prisma) as Adapter;
  
  return {
    ...adapter,
    async getUser(id: string) {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        // Вместо role возвращаем флаги
        isPsychologist: user.isPsychologist,
        isManager: user.isManager,
        isAdmin: user.isAdmin,
      } as AdapterUser & { 
        isPsychologist: boolean; 
        isManager: boolean; 
        isAdmin: boolean; 
      };
    },
    
    async getUserByEmail(email: string) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        isPsychologist: user.isPsychologist,
        isManager: user.isManager,
        isAdmin: user.isAdmin,
      } as AdapterUser & { 
        isPsychologist: boolean; 
        isManager: boolean; 
        isAdmin: boolean; 
      };
    },
    
    async createUser(data: any) {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          emailVerified: data.emailVerified,
          // Новые флаги с значениями по умолчанию
          isPsychologist: data.isPsychologist || false,
          isManager: data.isManager || false,
          isAdmin: data.isAdmin || false,
        },
      });
      
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        isPsychologist: user.isPsychologist,
        isManager: user.isManager,
        isAdmin: user.isAdmin,
      } as AdapterUser & { 
        isPsychologist: boolean; 
        isManager: boolean; 
        isAdmin: boolean; 
      };
    },
  };
}