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
 * The block sits in the optical centre of the screen (a little above the
 * middle) instead of leaving the bottom half empty, and keeps a readable
 * width on large phones and small tablets.
 */
const PhoneAuth = ({ children, description, title }: AuthLayoutProps) => {
  const { t } = useTranslation();
  const { t: ta } = useTranslation("auth");

  return (
    <div className="auth-glow bg-background pt-safe-8 pb-safe-8 flex min-h-dvh flex-col px-6">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pb-12">
        <div className="flex items-center gap-3">
          <img
            alt=""
            className="size-11 rounded-xl shadow-md"
            src="/icons/favicon.svg"
          />
          <div className="min-w-0">
            <p className="text-base leading-tight font-semibold tracking-tight">
              {t("appName")}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {ta("tagline")}
            </p>
          </div>
        </div>
        <h1 className="mt-10 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1.5 text-sm text-pretty">
          {description}
        </p>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
};

export const AuthLayout = (props: AuthLayoutProps) => {
  const isDesktop = useIsDesktop();

  return isDesktop ? <DesktopAuth {...props} /> : <PhoneAuth {...props} />;
};
