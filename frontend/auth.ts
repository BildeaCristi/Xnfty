import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { ethers } from "ethers";

declare module "next-auth" {
    interface User {
        idToken?: string;
        walletAddress?: string;
    }
    interface Session {
        idToken?: string | undefined;
        walletAddress?: string;
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    scope: "openid profile email",
                    session: {
                        strategy: "jwt",
                    },
                },
            },
            clientId: "",
            clientSecret: ""
        }),
        CredentialsProvider({
            id: "wallet-connect",
            name: "Wallet Connect",
            credentials: {
                message: { label: "Message", type: "text" },
                signature: { label: "Signature", type: "text" },
                walletAddress: { label: "Wallet Address", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.message || !credentials?.signature || !credentials?.walletAddress) {
                    return null;
                }

                try {
                    const address = ethers.verifyMessage(
                        credentials.message as string,
                        credentials.signature as string
                    );

                    if (address.toLowerCase() !== (credentials.walletAddress as string).toLowerCase()) {
                        return null;
                    }

                    return {
                        id: credentials.walletAddress as string,
                        walletAddress: credentials.walletAddress as string,
                        name: `Wallet (${(credentials.walletAddress as string).substring(0, 6)}...${(credentials.walletAddress as string).substring(38)})`,
                        email: null,
                    };
                } catch (error) {
                    console.error("Wallet authentication error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            if (account) {
                token.idToken = account.id_token;
            }

            if (user?.walletAddress) {
                token.walletAddress = user.walletAddress;
            }

            return token;
        },
        async session({ session, token }) {
            session.idToken = token.idToken as string;
            session.walletAddress = token.walletAddress as string;
            return session;
        },
    },
});