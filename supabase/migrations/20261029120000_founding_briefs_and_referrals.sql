-- Founding briefs from Dream Intrepid Ltd, plus a hire bounty for creators
-- who invite someone that later gets hired.

alter table public.creator_profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.creator_profiles(id);

create unique index if not exists creator_profiles_referral_code_key
  on public.creator_profiles (referral_code)
  where referral_code is not null;

update public.creator_profiles
set referral_code = handle
where referral_code is null and handle is not null;

-- Creators cannot point a profile at themselves or rewrite the code.
revoke insert (referral_code, referred_by) on public.creator_profiles from anon, authenticated;
revoke update (referral_code, referred_by) on public.creator_profiles from anon, authenticated;

create table if not exists public.referral_rewards (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references public.creator_profiles(id) on delete restrict,
  referred_id   uuid not null unique references public.creator_profiles(id) on delete restrict,
  gig_id        uuid not null references public.gigs(id) on delete restrict,
  payout_id     uuid unique references public.payouts(id) on delete set null,
  amount_naira  integer not null check (amount_naira > 0),
  status        text not null default 'earned' check (status in ('earned', 'paid')),
  created_at    timestamptz not null default now()
);

alter table public.referral_rewards enable row level security;

drop policy if exists referral_rewards_select on public.referral_rewards;
create policy referral_rewards_select on public.referral_rewards
  for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid());

revoke insert, update, delete on public.referral_rewards from anon, authenticated;

-- Twenty open briefs. Idempotent on title for this brand.
insert into public.briefs (brand_id, title, description, format, niches, budget_naira, deadline, slots, gig_type, status)
select
  bp.id,
  item->>'title',
  (item->>'lead') || E'\n\n' || $shared$Dream Intrepid Ltd is the hiring brand. The rate on this brief is what you keep. It is held in escrow before you start and released when the delivery matches this brief. Send one original vertical video, 30 to 45 seconds, with you on camera. No AI avatars and no stock faces. Put the product or the point in the first three seconds, burn in captions, and keep the sound clear. One revision is included. Creators anywhere in Nigeria can apply. Lagos is preferred when a product has to be shipped to you. Apply with a short pitch and one sample you are proud of. Dream Intrepid chooses who is hired.$shared$,
  coalesce(item->>'format', '30 to 45s vertical video'),
  array(select jsonb_array_elements_text(item->'niches')),
  (item->>'budget')::integer,
  date '2026-12-31',
  (item->>'slots')::smallint,
  'original',
  'open'
from public.brand_profiles bp
cross join jsonb_array_elements($briefs$[
  {"title":"Skincare routine video for a Nigerian brand","lead":"We need a creator who can show a skincare step on their own face, in real light, and say why it matters in the first line.","niches":["Beauty & Skincare"],"budget":25000,"slots":3},
  {"title":"Fashion try-on video, Lagos preferred","lead":"Show one outfit the way you would send it to a friend: on you, moving, with one clear reason to want it.","niches":["Fashion"],"budget":25000,"slots":3},
  {"title":"Home cooking video with a product in the recipe","lead":"Cook one dish at home and let the product earn its place in the recipe. We want the kitchen, not a studio set.","niches":["Food & Cooking"],"budget":20000,"slots":3},
  {"title":"Fitness routine video","lead":"A short routine you actually do, with the product used once in a way a viewer can copy.","niches":["Fitness & Health"],"budget":20000,"slots":2},
  {"title":"Fintech app explainer, talking to camera","lead":"Explain one money task in the app, on camera, so a first-time user understands it in under a minute.","niches":["Finance & Fintech"],"budget":30000,"slots":2},
  {"title":"Mobile app demo for a Nigerian product","lead":"Walk through one job the app does. Screen and face both visible, in plain language, no feature list.","niches":["SaaS / Tech"],"budget":30000,"slots":3},
  {"title":"Day-in-the-life video with one product","lead":"A slice of your real day, and one product that belongs in it. The story comes first. The product is part of the story.","niches":["Lifestyle"],"budget":20000,"slots":3},
  {"title":"Unboxing video, first reaction on camera","lead":"Open the product on camera and react once. We want the moment you see it, not a scripted commercial.","niches":["Unboxing"],"budget":20000,"slots":2},
  {"title":"Honest product review, what you would tell a friend","lead":"Use it, then say what worked and what you would change. A review that only praises is not what this brief is for.","niches":["Product Reviews"],"budget":25000,"slots":3},
  {"title":"Testimonial video about a product you use","lead":"Tell one specific moment the product helped. Name, face, and a real detail. Not a slogan.","niches":["Video Testimonials"],"budget":20000,"slots":2},
  {"title":"Short skit that sells one product","lead":"A 30 second scene with a setup and a punch, where the product is the reason the scene turns. You perform it.","niches":["Skits"],"budget":25000,"slots":2},
  {"title":"Voice-over for a brand film","lead":"Record a warm voice-over, up to 60 seconds, in Nigerian English. Clear diction, no music bed from you. We cut it to picture.","format":"Voice-over, up to 60 seconds","niches":["Voice Over"],"budget":15000,"slots":2},
  {"title":"How-to tutorial, one skill in one minute","lead":"Teach one thing a viewer can finish with you. Steps on screen, you in frame, no montage of tips.","niches":["Education & Tutorials"],"budget":20000,"slots":2},
  {"title":"Get-ready-with-me using one product","lead":"Get ready as you normally would and show where the product fits. Natural pace, your room, your voice.","niches":["Styling & Makeup"],"budget":25000,"slots":2},
  {"title":"Gadget demo, show it working","lead":"One device, one job, shown working in your hands. Say what it does in the first sentence, then prove it.","niches":["Product Demo"],"budget":20000,"slots":2},
  {"title":"Event recap, what it felt like to be there","lead":"A vertical recap of a real event: the room, one person, and why someone who missed it should care.","format":"60 to 90s vertical recap","niches":["Event Coverage"],"budget":30000,"slots":2},
  {"title":"Travel-style brand clip in your city","lead":"Film one place in your city and place the brand in that scene. It should feel like you live there.","niches":["Travel & Lifestyle"],"budget":25000,"slots":2},
  {"title":"Interview clip, one question answered well","lead":"Answer one question to camera as if a host asked it. A complete thought, not a quote card.","niches":["Podcast / Interview"],"budget":25000,"slots":2},
  {"title":"Dance or trend video with a product in it","lead":"Use a current move, and let the product be visible without stopping the dance to explain it.","niches":["Dance & Choreography"],"budget":20000,"slots":2},
  {"title":"Story-first brand film, make someone feel it","lead":"Open on a feeling, not a logo. One story, one product, and a last line a viewer would repeat.","niches":["Brand Ambassador"],"budget":25000,"slots":2}
]$briefs$::jsonb) as item
where bp.company_name = 'Dream Intrepid Ltd.'
  and bp.verification_status = 'verified'
  and not exists (
    select 1 from public.briefs b
    where b.brand_id = bp.id and b.title = item->>'title'
  );
