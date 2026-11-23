import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useIsDesktop } from "@/components/app/responsive-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

/** Desktop: a centred card on the grey canvas. */
const DesktopAuth = ({ children, description, title }: AuthLayoutProps) => (
  <div className="bg-muted flex min-h-dvh items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <img alt="" className="mx-auto mb-2 size-14" src="/icons/favicon.svg" />
        <CardTitle>
          <h1 className="text-2xl">{title}</h1>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  </div>
);

/**
 * Phones: no card — the app's mark and name on a soft glow, a large title,
 * and the form full width with 48px buttons, clear of the notch and home bar.
 */
const PhoneAuth = ({ children, description, title }: AuthLayoutProps) => {
  const { t } = useTranslation();
  const { t: ta } = useTranslation("auth");

  return (
    <div className="auth-glow bg-background pt-safe-12 pb-safe-8 flex min-h-dvh flex-col px-6">
      <div className="flex flex-col items-center text-center">
        <img
          alt=""
          className="size-18 rounded-2xl shadow-lg"
          src="/icons/favicon.svg"
        />
        <p className="mt-3 text-base font-semibold tracking-tight">
          {t("appName")}
        </p>
        <p className="text-muted-foreground text-xs">{ta("tagline")}</p>
      </div>
      <div className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">{description}</p>
      </div>
      <div className="mt-7">{children}</div>
    </div>
  );
};

export const AuthLayout = (props: AuthLayoutProps) => {
  const isDesktop = useIsDesktop();

  return isDesktop ? <DesktopAuth {...props} /> : <PhoneAuth {...props} />;
};
