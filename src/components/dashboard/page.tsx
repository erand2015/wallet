"use client";
import { MainDashboard } from "@/components/dashboard/main-view";
import { useWalletStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { address, balance } = useWalletStore();
  const router = useRouter();

  useEffect(() => {
    // Nëse nuk ka adresë (nuk është bërë login), ktheje te faqja kryesore
    if (!address) {
      router.push("/");
    }
  }, [address, router]);

  if (!address) return null;

  return <MainDashboard balance={balance || "0.0000"} />;
}