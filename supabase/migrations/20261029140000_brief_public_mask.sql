-- Public briefs can hide the hiring company. Creators still see that a
-- verified brand is hiring. The name is readable by the brand, an admin, or
-- a creator who already has an offer, a gig, or a conversation with them.
-- Location and shoot tags sit on the brief so the public page can show them
-- without naming the company.

alter table public.briefs
  add column if not exists conceal_brand boolean not null default false,
  add column if not exists location text,
  add column if not exists tags text[] not null default '{}';

drop policy if exists brand_select on public.brand_profiles;
create policy brand_select on public.brand_profiles
  for select to anon, authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.offers o
      where o.brand_id = brand_profiles.id and o.creator_id = auth.uid()
    )
    or exists (
      select 1 from public.gigs g
      where g.brand_id = brand_profiles.id and g.creator_id = auth.uid()
    )
    or exists (
      select 1 from public.conversations c
      where c.brand_id = brand_profiles.id and c.creator_id = auth.uid()
    )
    or (
      verification_status = 'verified'
      and not exists (
        select 1 from public.briefs b
        where b.brand_id = brand_profiles.id
          and b.conceal_brand
          and b.status = 'open'
      )
    )
  );

update public.briefs b
set
  conceal_brand = true,
  location = item->>'location',
  format = coalesce(item->>'format', '30 to 45s vertical video'),
  niches = array(select jsonb_array_elements_text(item->'niches')),
  tags = array(select jsonb_array_elements_text(item->'tags')),
  description = (item->>'lead') || E'\n\nWhere: ' || (item->>'location') || E'.\n\n' || $shared$A verified brand is hiring. The company name stays private until you are hired. The rate on this brief is what you keep. It is held in escrow before you start and released when the delivery matches this brief. One revision is included. No AI avatars and no stock faces. Put the product or the point in the first three seconds, burn in captions, and keep the sound clear. Apply with a short pitch and one sample. The brand chooses who is hired.$shared$
from public.brand_profiles bp
cross join jsonb_array_elements($briefs$[
  {"title":"Skincare routine video for a Nigerian brand","lead":"Show a skincare step on your own face, in real light, and say why it matters in the first line.","location":"Nigeria · Lagos preferred","format":"30 to 45s vertical video","niches":["Beauty & Skincare","Product Demo","Lifestyle","Video Testimonials"],"tags":["On camera","Product ships","Captions","Human only"]},
  {"title":"Fashion try-on video, Lagos preferred","lead":"Show one outfit the way you would send it to a friend: on you, moving, with one clear reason to want it.","location":"Lagos","format":"30 to 45s vertical video","niches":["Fashion","Modeling","Styling & Makeup","Lifestyle"],"tags":["On camera","Product ships","Captions","Human only"]},
  {"title":"Home cooking video with a product in the recipe","lead":"Cook one dish at home and let the product earn its place in the recipe. The kitchen, not a studio set.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Food & Cooking","Lifestyle","Product Reviews"],"tags":["On camera","Product ships","Captions","Human only"]},
  {"title":"Fitness routine video","lead":"A short routine you actually do, with the product used once in a way a viewer can copy.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Fitness & Health","Lifestyle","Product Demo"],"tags":["On camera","Captions","One revision","Human only"]},
  {"title":"Fintech app explainer, talking to camera","lead":"Explain one money task in the app, on camera, so a first-time user understands it in under a minute.","location":"Remote, Nigeria","format":"30 to 45s vertical video","niches":["Finance & Fintech","SaaS / Tech","Education & Tutorials"],"tags":["On camera","Remote friendly","Captions","Human only"]},
  {"title":"Mobile app demo for a Nigerian product","lead":"Walk through one job the app does. Screen and face both visible, in plain language, no feature list.","location":"Remote, Nigeria","format":"30 to 45s vertical video","niches":["SaaS / Tech","Product Demo","Education & Tutorials"],"tags":["On camera","Remote friendly","Captions","Human only"]},
  {"title":"Day-in-the-life video with one product","lead":"A slice of your real day, and one product that belongs in it. The story comes first.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Lifestyle","Brand Ambassador","Product Reviews"],"tags":["On camera","Captions","One revision","Human only"]},
  {"title":"Unboxing video, first reaction on camera","lead":"Open the product on camera and react once. The moment you see it, not a scripted commercial.","location":"Nigeria · Lagos preferred","format":"30 to 45s vertical video","niches":["Unboxing","Product Reviews","Lifestyle"],"tags":["On camera","Product ships","Captions","Human only"]},
  {"title":"Honest product review, what you would tell a friend","lead":"Use it, then say what worked and what you would change. A review that only praises is not what this brief is for.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Product Reviews","Video Testimonials","Lifestyle"],"tags":["On camera","Captions","One revision","Human only"]},
  {"title":"Testimonial video about a product you use","lead":"Tell one specific moment the product helped. Name, face, and a real detail. Not a slogan.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Video Testimonials","Testimonials","Brand Ambassador"],"tags":["On camera","Captions","One revision","Human only"]},
  {"title":"Short skit that sells one product","lead":"A 30 second scene with a setup and a punch, where the product is the reason the scene turns. You perform it.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Skits","Lifestyle","Social Posts"],"tags":["On camera","Captions","One revision","Human only"]},
  {"title":"Voice-over for a brand film","lead":"Record a warm voice-over, up to 60 seconds, in Nigerian English. Clear diction, no music bed from you. We cut it to picture.","location":"Remote, Nigeria","format":"Voice-over, up to 60 seconds","niches":["Voice Over","Music & Audio","Scriptwriting"],"tags":["Voice only","Remote friendly","One revision","Human only"]},
  {"title":"How-to tutorial, one skill in one minute","lead":"Teach one thing a viewer can finish with you. Steps on screen, you in frame, no montage of tips.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Education & Tutorials","Product Demo","Lifestyle"],"tags":["On camera","Captions","One revision","Human only"]},
  {"title":"Get-ready-with-me using one product","lead":"Get ready as you normally would and show where the product fits. Natural pace, your room, your voice.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Styling & Makeup","Beauty & Skincare","Lifestyle"],"tags":["On camera","Captions","One revision","Human only"]},
  {"title":"Gadget demo, show it working","lead":"One device, one job, shown working in your hands. Say what it does in the first sentence, then prove it.","location":"Nigeria · Lagos preferred","format":"30 to 45s vertical video","niches":["Product Demo","Unboxing","SaaS / Tech"],"tags":["On camera","Product ships","Captions","Human only"]},
  {"title":"Event recap, what it felt like to be there","lead":"A vertical recap of a real event: the room, one person, and why someone who missed it should care.","location":"Lagos","format":"60 to 90s vertical recap","niches":["Event Coverage","Lifestyle","Videography"],"tags":["On location","On camera","Captions","Human only"]},
  {"title":"Travel-style brand clip in your city","lead":"Film one place in your city and place the brand in that scene. It should feel like you live there.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Travel & Lifestyle","Lifestyle","Photography"],"tags":["On location","On camera","Captions","Human only"]},
  {"title":"Interview clip, one question answered well","lead":"Answer one question to camera as if a host asked it. A complete thought, not a quote card.","location":"Remote, Nigeria","format":"30 to 45s vertical video","niches":["Podcast / Interview","Testimonials","Brand Ambassador"],"tags":["On camera","Remote friendly","Captions","Human only"]},
  {"title":"Dance or trend video with a product in it","lead":"Use a current move, and let the product be visible without stopping the dance to explain it.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Dance & Choreography","Lifestyle","Social Posts"],"tags":["On camera","Captions","One revision","Human only"]},
  {"title":"Story-first brand film, make someone feel it","lead":"Open on a feeling, not a logo. One story, one product, and a last line a viewer would repeat.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Brand Ambassador","Lifestyle","Scriptwriting","Video Testimonials"],"tags":["On camera","Captions","One revision","Human only"]}
]$briefs$::jsonb) as item
where b.brand_id = bp.id
  and bp.company_name = 'Dream Intrepid Ltd.'
  and b.title = item->>'title';
