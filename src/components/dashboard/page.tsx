"use client";
import { MainDashboard } from "@/components/dashboard/main-view";
import { useWalletStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WarthogService } from "@/lib/warthog-config";

export default function DashboardPage() {
  const { address } = useWalletStore();
  const [balance, setBalance] = useState("0.0000");
  const router = useRouter();

  useEffect(() => {
    // Nëse nuk ka adresë (nuk është bërë login), ktheje te faqja kryesore
    if (!address) {
      router.push("/");
      return;
    }

    // Merr balancën live
    WarthogService.getBalance(address).then(setBalance);
  }, [address, router]);

  if (!address) return null;

  return <MainDashboard balance={balance} />;
}