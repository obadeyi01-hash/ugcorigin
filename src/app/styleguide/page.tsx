import type { Metadata } from "next";
import { ArrowRight, Heart } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { Rating } from "@/components/ui/rating";
import { Logo } from "@/components/ui/logo";
import { CreatorCard } from "@/components/marketplace/creator-card";
import { SAMPLE_CREATORS } from "@/lib/sample-data";

export const metadata: Metadata = { title: "Style guide" };

const swatches: { name: string; cls: string; ink?: boolean }[] = [
  { name: "paper", cls: "bg-paper" },
  { name: "surface", cls: "bg-surface" },
  { name: "surface-2", cls: "bg-surface-2" },
  { name: "ink", cls: "bg-ink", ink: true },
  { name: "ink-2", cls: "bg-ink-2", ink: true },
  { name: "ink-3", cls: "bg-ink-3", ink: true },
  { name: "accent", cls: "bg-accent" },
  { name: "accent-hover", cls: "bg-accent-hover", ink: true },
  { name: "accent-tint", cls: "bg-accent-tint" },
  { name: "success", cls: "bg-success", ink: true },
  { name: "warning", cls: "bg-warning", ink: true },
  { name: "error", cls: "bg-error", ink: true },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-10 border-b border-line">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function StyleGuide() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-hover">
            UGCOrigin
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
            Design system
          </h1>
          <p className="mt-2 max-w-xl text-ink-2">
            Powder-white, matte-black, and Origin Amber. Apple-grade restraint,
            mobile-first, light-only premium.
          </p>

          <Block title="Logo">
            <div className="flex flex-wrap items-center gap-8">
              <Logo variant="symbol" size={40} />
              <Logo variant="wordmark" className="text-2xl" />
              <Logo variant="combined" />
            </div>
          </Block>

          <Block title="Color">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {swatches.map((s) => (
                <div key={s.name} className="overflow-hidden rounded-xl border border-line">
                  <div className={`${s.cls} h-16`} />
                  <div className="bg-surface px-3 py-2">
                    <p className="text-xs font-medium text-ink">{s.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </Block>

          <Block title="Typography">
            <div className="space-y-3">
              <p className="font-display text-5xl font-bold tracking-tight text-ink">
                Display / Space Grotesk
              </p>
              <h3 className="font-display text-3xl font-semibold text-ink">
                Heading, tight and confident
              </h3>
              <p className="text-lg text-ink">
                Body large / Inter, the quick brown fox jumps over the lazy dog.
              </p>
              <p className="text-sm text-ink-2">
                Body small / secondary ink, supporting copy and metadata.
              </p>
              <p className="text-xs text-ink-3">Caption / muted ink.</p>
            </div>
          </Block>

          <Block title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">
                Medium <ArrowRight className="size-4" />
              </Button>
              <Button size="lg">Large</Button>
            </div>
          </Block>

          <Block title="Badges & trust">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Default</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="success">Approved</Badge>
              <Badge variant="warning">In review</Badge>
              <Badge variant="error">Disputed</Badge>
              <Badge variant="info">Funded</Badge>
              <Badge variant="outline">Original Post</Badge>
              <VerifiedBadge />
              <VerifiedBadge compact />
            </div>
          </Block>

          <Block title="Chips">
            <div className="flex flex-wrap gap-2">
              <Chip active>Beauty & Skincare</Chip>
              <Chip>Fintech</Chip>
              <Chip>Food & Cooking</Chip>
              <Chip>SaaS / Tech</Chip>
              <Chip>Unboxing</Chip>
            </div>
          </Block>

          <Block title="Avatars & rating">
            <div className="flex flex-wrap items-center gap-5">
              <Avatar name="Amara O." size={56} ring online />
              <Avatar name="Tunde B." size={44} />
              <Avatar name="Chioma E." size={36} />
              <Rating value={4.9} count={38} />
            </div>
          </Block>

          <Block title="Form fields">
            <div className="grid max-w-md gap-4">
              <Field label="Campaign name" hint="Keep it short and specific.">
                <Input placeholder="Organic skincare, summer launch" />
              </Field>
              <Field label="Brief">
                <Textarea placeholder="What are you selling, and what should the creator show?" />
              </Field>
            </div>
          </Block>

          <Block title="Cards">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card variant="elevated">
                <CardBody>
                  <h3 className="font-semibold text-ink">Elevated</h3>
                  <p className="mt-1 text-sm text-ink-2">Soft shadow on surface.</p>
                </CardBody>
              </Card>
              <Card variant="outline">
                <CardBody>
                  <h3 className="font-semibold text-ink">Outline</h3>
                  <p className="mt-1 text-sm text-ink-2">Border, no shadow.</p>
                </CardBody>
              </Card>
              <Card variant="soft" interactive>
                <CardBody>
                  <h3 className="font-semibold text-ink">Soft · interactive</h3>
                  <p className="mt-1 text-sm text-ink-2">Hover to lift.</p>
                </CardBody>
              </Card>
            </div>
          </Block>

          <Block title="Bento grid">
            <div className="grid auto-rows-[120px] grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="col-span-2 row-span-2 rounded-2xl border border-line bg-ink p-6 text-paper">
                <Heart className="size-6 text-accent" />
                <p className="mt-6 font-display text-2xl font-semibold">
                  1,000+ verified creators
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-accent-tint p-5">
                <p className="font-display text-3xl font-bold text-accent-hover">12%</p>
                <p className="text-xs text-ink-2">brand fee</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="font-display text-3xl font-bold text-ink">100%</p>
                <p className="text-xs text-ink-2">to creators</p>
              </div>
              <div className="u-grain col-span-2 rounded-2xl border border-line bg-surface p-5">
                <p className="text-sm font-medium text-ink">Next-day payouts</p>
              </div>
            </div>
          </Block>

          <Block title="Creator card">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SAMPLE_CREATORS.slice(0, 3).map((c) => (
                <CreatorCard key={c.name} creator={c} />
              ))}
            </div>
          </Block>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
