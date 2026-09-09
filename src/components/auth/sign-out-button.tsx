"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <div className="ui-actions">
      <button type="button" className="ui-button-secondary" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </button>
    </div>
  );
}