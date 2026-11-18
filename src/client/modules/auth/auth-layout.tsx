import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const AuthLayout = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
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
