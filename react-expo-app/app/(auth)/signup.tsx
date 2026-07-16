import { router } from "expo-router";
import { SignupView } from "@/features/auth/SignupView";
import { useAuth } from "@/lib/AuthContext";

export default function SignupScreen() {
  const {
    connectedModeAvailable,
    signUp,
  } = useAuth();

  return (
    <SignupView
      connectedModeAvailable={
        connectedModeAvailable
      }
      onBack={() =>
        router.replace("/(auth)/login")
      }
      onSignUp={signUp}
    />
  );
}
