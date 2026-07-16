import { router } from "expo-router";
import { PurchaseWizard } from "@/features/decisions/PurchaseWizard";
import { useAppServices } from "@/lib/AppServicesContext";

export default function NewPurchaseScreen() {
  const services = useAppServices();

  return (
    <PurchaseWizard
      coach={services.coach}
      onCancel={() => router.back()}
      onComplete={async (decision) => {
        await services.decisions.create(decision);
        router.replace("/(app)/budget");
      }}
    />
  );
}
