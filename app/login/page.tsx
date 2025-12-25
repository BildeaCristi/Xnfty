import {Metadata} from "next";
import LoginScene from "@/components/auth/LoginScene";
import LoginGlassModal from "@/components/auth/LoginGlassModal";
import LoginContent from "@/components/auth/LoginContent";

export const metadata: Metadata = {
    title: "Xnfty | Login",
    description: "Sign in to the ultimate 3D NFT marketplace with fractional ownership",
};

export default async function LoginPage() {
    return (
        <>
            <LoginScene/>
            <div className="relative min-h-screen flex items-center justify-center">
                <LoginGlassModal>
                    <LoginContent/>
                </LoginGlassModal>
            </div>
        </>
    )
}
