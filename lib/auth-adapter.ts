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
        role: user.role,
      } as AdapterUser & { role: string };
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
        role: user.role,
      } as AdapterUser & { role: string };
    },
    
    async createUser(data: Omit<AdapterUser, "id">) { // временно any, потом уточним тип
      const user = await prisma.user.create({
        data: {
          email: data.email,
          emailVerified: data.emailVerified,
        },
      });
      
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
      } as AdapterUser & { role: string };
    },
  };
}