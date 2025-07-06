"use server";

import {signIn, signOut} from "@/auth";
import {ROUTES} from "@/config/routes";

export async function handleGoogleLogin() {
    await signIn("google", { redirectTo: ROUTES.DASHBOARD as string });
}

export async function handleLogout() {
    await signOut();
}