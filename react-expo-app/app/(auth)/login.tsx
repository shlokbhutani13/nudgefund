import { router } from "expo-router";
import { LoginView } from "@/features/auth/LoginView";
import { useAuth } from "@/lib/AuthContext";

export default function LoginScreen() {
  const {
    connectedModeAvailable,
    enterDemo,
    resetPassword,
    signIn,
  } = useAuth();

  return (
    <LoginView
      connectedModeAvailable={
        connectedModeAvailable
      }
      onDemo={enterDemo}
      onResetPassword={resetPassword}
      onSignIn={signIn}
      onSignUp={() =>
        router.push("/(auth)/signup")
      }
    />
  );
}
