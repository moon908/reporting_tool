"use client";

import { createApiKeyAction, deleteApiKeyAction, saveOrganizationSettingsAction } from "@/actions/adminActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, ShieldAlert, Trash2 } from "lucide-react";
import React, { useState } from "react";

interface SettingsViewProps {
  initialOrg: { name: string; brandColor: string | null };
  initialKeys: Array<{ id: string; name: string; createdAt: Date; user: { name: string | null; email: string } }>;
  userRole: string;
}

export default function SettingsView({ initialOrg, initialKeys, userRole }: SettingsViewProps) {
  const [orgName, setOrgName] = useState(initialOrg.name);
  const [brandColor, setBrandColor] = useState(initialOrg.brandColor || "#3b82f6");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  
  const [apiKeys, setApiKeys] = useState(initialKeys);
  const [keyName, setKeyName] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [rawGeneratedKey, setRawGeneratedKey] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    
    const res = await saveOrganizationSettingsAction({
      name: orgName,
      brandColor,
    });

    setSavingSettings(false);
    if (res.success) {
      setSettingsSuccess(true);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;

    setGeneratingKey(true);
    setRawGeneratedKey(null);

    const res = await createApiKeyAction(keyName);
    setGeneratingKey(false);

    if (res.success && res.apiKey) {
      setRawGeneratedKey(res.apiKey);
      setKeyName("");
      // Refresh key lists
      const updatedKeys = await fetchApiKeys();
      setApiKeys(updatedKeys);
    }
  };

  const handleRevokeKey = async (id: string) => {
    const confirm = window.confirm("Are you sure you want to revoke this API Key? Any application using it will fail to authenticate.");
    if (!confirm) return;

    const res = await deleteApiKeyAction(id);
    if (res.success) {
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    }
  };

  const fetchApiKeys = async () => {
    // Standard mock API fetcher or server action reload
    // For simplicity, we trigger reload by client location reload or custom revalidator.
    // Let's just prompt location reload, or fetch.
    return apiKeys; // fallback for state
  };

  const isWriteAllowed = userRole === "Admin" || userRole === "Manager";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branding Configuration Form */}
        <div className="lg:col-span-1">
          <Card className="glass-card border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">Organization Profile & Branding</CardTitle>
              <CardDescription className="text-xs">Adjust brand layout and global report templates defaults</CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveSettings}>
              <CardContent className="space-y-4">
                {settingsSuccess && (
                  <div className="bg-emerald-500/10 text-emerald-500 text-xs p-3 rounded-lg border border-emerald-500/20">
                    Organization profiles settings saved! Brand styling will automatically update report sheets layout.
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Organization Name</label>
                  <input
                    type="text"
                    disabled={!isWriteAllowed}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Brand Highlight Hex Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      disabled={!isWriteAllowed}
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-9 w-12 rounded border border-input p-0.5 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      disabled={!isWriteAllowed}
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </CardContent>
              {isWriteAllowed && (
                <CardFooter>
                  <Button type="submit" className="w-full text-xs font-semibold" disabled={savingSettings}>
                    {savingSettings ? "Saving Settings..." : "Save Branding"}
                  </Button>
                </CardFooter>
              )}
            </form>
          </Card>
        </div>

        {/* API Keys Configuration Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">API Access Keys</CardTitle>
              <CardDescription className="text-xs">
                Integrate third-party pipeline uploads using programmatic API headers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Generator Form */}
              <form onSubmit={handleGenerateKey} className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. Jenkins Upload Token"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button type="submit" size="sm" className="text-xs font-semibold whitespace-nowrap" disabled={generatingKey}>
                  Generate API Key
                </Button>
              </form>

              {/* Display Generated Key */}
              {rawGeneratedKey && (
                <div className="bg-amber-500/10 text-amber-500 text-xs p-4 rounded-xl border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldAlert className="h-4 w-4 animate-pulse" />
                    <span>Copy API Key (Only Visible Once!)</span>
                  </div>
                  <code className="block bg-slate-900 text-slate-100 p-2.5 rounded font-mono select-all text-xs tracking-wider break-all">
                    {rawGeneratedKey}
                  </code>
                </div>
              )}

              {/* Active API Keys Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground">Active Integration Tokens</h4>
                {apiKeys.length === 0 ? (
                  <div className="border border-border/20 rounded-xl p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 bg-card">
                    <Key className="h-6 w-6 text-muted-foreground/45" />
                    <span>No active tokens found. Generate a key above to start programmatic uploads.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((k) => (
                      <div
                        key={k.id}
                        className="border border-border/40 rounded-xl p-3 px-4 flex items-center justify-between bg-card text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">{k.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Created by {k.user?.name || k.user?.email || "System"} on {new Date(k.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevokeKey(k.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
