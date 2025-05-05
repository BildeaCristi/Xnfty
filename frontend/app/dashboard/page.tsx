import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Xnfty | Dashboard",
  description: "Your NFT dashboard with 3D visualization",
};

export default async function DashboardPage() {
    const session = await auth();
    
    if (!session) {
        redirect("/login");
    }

    // Ensure user is defined
    if (!session.user) {
        redirect("/login");
    }

    return <DashboardContent user={session.user} />;
}