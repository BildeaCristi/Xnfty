"use client";

import SignIn from "@/components/auth/login-ui/buttons/signin-button";
import GlassModal from "@/components/auth/login-ui/modal/glass-modal";
import MainBackground from "@/components/auth/login-ui/main-background";

export default function LoginUI() {
  return (
    <>
      <MainBackground />
      <div className="relative min-h-screen flex items-center justify-center">
        <GlassModal>
          <SignIn />
        </GlassModal>
      </div>
    </>
  );
}
