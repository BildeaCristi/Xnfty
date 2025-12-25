import "next-auth";

declare module "next-auth" {
  interface User {
    walletAddress?: string;
  }
  
  interface Session {
    user?: User;
    walletAddress?: string;
  }
} 