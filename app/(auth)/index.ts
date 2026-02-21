// app/(auth)/index.tsx
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function AuthIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login"
    ); // redirect to login screen
  }, []);

  return null;
}