import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    isPsychologist: boolean;
    isManager: boolean;
    isAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isPsychologist: boolean;
      isManager: boolean;
      isAdmin: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isPsychologist: boolean;
    isManager: boolean;
    isAdmin: boolean;
  }
}