"use server";

import {signIn, signOut} from "@/auth";
import {ROUTES} from "@/config/routes";

export async function handleGoogleLogin() {
    await signIn("google", { redirectTo: "/dashboard" });
}

export async function handleLogout() {
    await signOut();
}