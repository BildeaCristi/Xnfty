import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import LoginPage from "@/components/auth/LoginPage";

export const metadata: Metadata = {
  title: "Xnfty | Login",
  description: "Sign in to the ultimate 3D NFT marketplace with fractional ownership",
};

export default async function LoginRoute() {
    const session = await auth();
    
    if (session) {
        redirect("/dashboard");
    }

    return <LoginPage />;
}
