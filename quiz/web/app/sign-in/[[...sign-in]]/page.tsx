import React from "react";
import { SignIn } from "@clerk/nextjs";
import AuthLayout, { clerkAppearance } from "@/components/common/AuthLayout";

export default function Page() {
  return (
    <AuthLayout>
      <SignIn appearance={clerkAppearance} />
    </AuthLayout>
  );
}
