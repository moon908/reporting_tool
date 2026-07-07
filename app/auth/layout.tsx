import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-4 text-xl font-bold">
            SR
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Spectra Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Automated Enterprise Data Analysis & Reporting
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
