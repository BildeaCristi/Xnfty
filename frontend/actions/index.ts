"use server";

import { signIn, signOut } from "@/auth";

export async function handleGoogleSignIn() {
    await signIn("google");
}

export async function handleSignOut() {
    await signOut();
}