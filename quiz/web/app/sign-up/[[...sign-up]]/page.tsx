import React from "react";
import { SignUp } from "@clerk/nextjs";
import AuthLayout, { clerkAppearance } from "@/components/common/AuthLayout";

export default function Page() {
  return (
    <AuthLayout>
      <SignUp appearance={clerkAppearance} />
    </AuthLayout>
  );
}
