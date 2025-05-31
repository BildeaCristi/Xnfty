import {auth} from "@/auth";
import {redirect} from "next/navigation";
import {Metadata} from "next";
import LoginContent from "@/components/auth/LoginContent";

export const metadata: Metadata = {
    title: "Xnfty | Login",
    description: "Sign in to the ultimate 3D NFT marketplace with fractional ownership",
};

export default async function LoginPage() {
    const session = await auth();

    if (session) {
        redirect("/dashboard");
    }

    <LoginContent/>
}
