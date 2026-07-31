"use client";

import { logout } from "@/app/actions/auth";
import { Button, type ButtonProps } from "@/components/ui/Button";

export function LogoutButton(props: ButtonProps) {
  return (
    <Button
      type="button"
      onClick={() => {
        void logout().then(() => {
          window.location.href = "/login";
        });
      }}
      {...props}
    >
      {props.children ?? "Đăng xuất"}
    </Button>
  );
}
