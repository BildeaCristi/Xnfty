import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CollectionDetailContent from "@/components/collections/CollectionDetailContent";
import { Metadata } from "next";

interface CollectionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Collection #${resolvedParams.id} | Xnfty`,
    description: "View collection details and NFTs",
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const collectionId = parseInt(resolvedParams.id);
  
  if (isNaN(collectionId)) {
    redirect("/dashboard");
  }

  return <CollectionDetailContent collectionId={collectionId} session={session} />;
} 