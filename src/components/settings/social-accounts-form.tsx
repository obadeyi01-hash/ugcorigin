"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field, Select } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { SocialIcon } from "@/components/ui/social-icons";
import { SOCIAL_ACCOUNT_PLATFORMS, formatFollowers, socialHostPath, socialPlatformLabel } from "@/lib/social/accounts";
import { removeSocialAccount, saveSocialAccount } from "@/app/settings/actions";

export type SocialAccountRow = {
  id: string;
  platform: string;
  handle: string;
  url: string | null;
  follower_count: number | null;
};

export function SocialAccountsForm({ accounts }: { accounts: SocialAccountRow[] }) {
  const router = useRouter();
  const [platform, setPlatform] = useState("tiktok");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setError(null);
    start(async () => {
      const res = await saveSocialAccount(platform, value);
      if (res.error) setError(res.error);
      else {
        setValue("");
        router.refresh();
      }
    });
  }

  return (
    <Card className="mt-6">
      <CardBody>
        <p className="font-semibold text-ink">Social profiles</p>
        <p className="mt-0.5 text-sm text-ink-2">
          Attach the profile itself, not a single post. We keep the audience size and refresh it when someone opens your card. YouTube can be read with an API key. TikTok, Instagram, Facebook and X do not give that number to a link.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
          <Field label="Network">
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {SOCIAL_ACCOUNT_PLATFORMS.map((item) => (
                <option key={item} value={item}>{socialPlatformLabel(item)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Profile address or @handle">
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://www.tiktok.com/@you" />
          </Field>
          <Button type="button" onClick={save} loading={pending} disabled={!value.trim()}>Attach</Button>
        </div>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
        {accounts.length > 0 && (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center gap-3 px-3 py-2.5">
                <SocialIcon platform={account.platform} className="size-4 shrink-0 text-ink-2" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{socialPlatformLabel(account.platform)}</p>
                  <p className="truncate text-xs text-ink-3">
                    {account.follower_count != null ? `${formatFollowers(account.follower_count)} followers · ` : ""}
                    {account.url ? socialHostPath(account.url) : `@${account.handle}`}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${socialPlatformLabel(account.platform)}`}
                  className="text-ink-3 hover:text-error"
                  onClick={() => start(async () => { await removeSocialAccount(account.id); router.refresh(); })}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
