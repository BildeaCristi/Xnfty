"use server";

import { signIn, signOut } from "@/auth";

export async function handleGoogleSignIn() {
    await signIn("google");
}

export async function handleSignOut() {
    await signOut();
}

export async function handleWalletSignIn(credentials: {
    message: string;
    signature: string;
    walletAddress: string;
}) {
    await signIn("wallet-connect", {
        ...credentials,
        redirect: true,
        redirectTo: "/dashboard"
    });
}