import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import CreateCollectionContent from "@/components/create-collection/CreateCollectionContent";

export const metadata: Metadata = {
  title: "Xnfty | Create Collection",
  description: "Create and deploy your own NFT collection with fractional ownership options",
};

export default async function CreateCollectionPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }
  
  return <CreateCollectionContent />;
} 