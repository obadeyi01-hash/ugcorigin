-- Fill out the public marketplace: 23 masked open briefs with varied posted
-- and due dates and a mix of niches + shoot tags, and ~12 funded per-view
-- campaigns, also date-varied and brand-masked. All under Dream Intrepid Ltd.
-- Additive and idempotent on title: it does not edit the rows the earlier
-- founding/mask migrations seeded, it reshapes their dates + tags and adds the
-- missing few, so applying it on top of 20261029120000 / 20261029140000 is safe
-- whether or not those already ran against prod.

-- ---------------------------------------------------------------------------
-- Briefs. One source of truth for all 23: lead, location, format, a varied mix
-- of niches and shoot tags, budget, slots, and distinct posted/due offsets so
-- the listing never shows a wall of identical dates.
-- ---------------------------------------------------------------------------
do $$
declare
  brand uuid;
  shared constant text := E'A verified brand is hiring. The company name stays private until you are hired. The rate on this brief is what you keep. It is held in escrow before you start and released when the delivery matches this brief. One revision is included. No AI avatars and no stock faces. Put the product or the point in the first three seconds, burn in captions, and keep the sound clear. Apply with a short pitch and one sample. The brand chooses who is hired.';
  item jsonb;
begin
  select id into brand from public.brand_profiles
  where company_name = 'Dream Intrepid Ltd.' order by created_at limit 1;
  if brand is null then
    raise notice 'Dream Intrepid Ltd. not found; skipping brief seed';
    return;
  end if;

  for item in select * from jsonb_array_elements($briefs$[
    {"title":"Skincare routine video for a Nigerian brand","lead":"Show a skincare step on your own face, in real light, and say why it matters in the first line.","location":"Nigeria · Lagos preferred","format":"30 to 45s vertical video","niches":["Beauty & Skincare","Product Demo","Lifestyle"],"tags":["On camera","Product ships","Captions","Human only"],"budget":25000,"slots":3,"posted":2,"due":9},
    {"title":"Fashion try-on video, Lagos preferred","lead":"Show one outfit the way you would send it to a friend: on you, moving, with one clear reason to want it.","location":"Lagos","format":"30 to 45s vertical video","niches":["Fashion","Styling & Makeup","Lifestyle"],"tags":["On camera","Product ships","Captions","One revision","Human only"],"budget":25000,"slots":3,"posted":1,"due":7},
    {"title":"Home cooking video with a product in the recipe","lead":"Cook one dish at home and let the product earn its place in the recipe. The kitchen, not a studio set.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Food & Cooking","Lifestyle","Product Reviews"],"tags":["On camera","Product ships","Captions","Human only"],"budget":20000,"slots":3,"posted":4,"due":14},
    {"title":"Fitness routine video","lead":"A short routine you actually do, with the product used once in a way a viewer can copy.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Fitness & Health","Lifestyle","Product Demo"],"tags":["On camera","Captions","One revision","Human only"],"budget":20000,"slots":2,"posted":6,"due":12},
    {"title":"Fintech app explainer, talking to camera","lead":"Explain one money task in the app, on camera, so a first-time user understands it in under a minute.","location":"Remote, Nigeria","format":"30 to 45s vertical video","niches":["Finance & Fintech","SaaS / Tech","Education & Tutorials"],"tags":["On camera","Remote friendly","Captions","Human only"],"budget":30000,"slots":2,"posted":8,"due":20},
    {"title":"Mobile app demo for a Nigerian product","lead":"Walk through one job the app does. Screen and face both visible, in plain language, no feature list.","location":"Remote, Nigeria","format":"30 to 45s vertical video","niches":["SaaS / Tech","Product Demo","Education & Tutorials"],"tags":["On camera","Remote friendly","Captions","One revision","Human only"],"budget":30000,"slots":3,"posted":3,"due":18},
    {"title":"Day-in-the-life video with one product","lead":"A slice of your real day, and one product that belongs in it. The story comes first.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Lifestyle","Brand Ambassador","Product Reviews"],"tags":["On camera","Captions","One revision","Human only"],"budget":20000,"slots":3,"posted":10,"due":24},
    {"title":"Unboxing video, first reaction on camera","lead":"Open the product on camera and react once. The moment you see it, not a scripted commercial.","location":"Nigeria · Lagos preferred","format":"30 to 45s vertical video","niches":["Unboxing","Product Reviews","Lifestyle"],"tags":["On camera","Product ships","Captions","Human only"],"budget":20000,"slots":2,"posted":5,"due":11},
    {"title":"Honest product review, what you would tell a friend","lead":"Use it, then say what worked and what you would change. A review that only praises is not what this brief is for.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Product Reviews","Video Testimonials","Lifestyle"],"tags":["On camera","Product ships","Captions","One revision","Human only"],"budget":25000,"slots":3,"posted":12,"due":28},
    {"title":"Testimonial video about a product you use","lead":"Tell one specific moment the product helped. Name, face, and a real detail. Not a slogan.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Video Testimonials","Testimonials","Brand Ambassador"],"tags":["On camera","Captions","One revision","Human only"],"budget":20000,"slots":2,"posted":14,"due":30},
    {"title":"Short skit that sells one product","lead":"A 30 second scene with a setup and a punch, where the product is the reason the scene turns. You perform it.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Skits","Lifestyle","Social Posts"],"tags":["On camera","Captions","One revision","Human only"],"budget":25000,"slots":2,"posted":7,"due":16},
    {"title":"Voice-over for a brand film","lead":"Record a warm voice-over, up to 60 seconds, in Nigerian English. Clear diction, no music bed from you. We cut it to picture.","location":"Remote, Nigeria","format":"Voice-over, up to 60 seconds","niches":["Voice Over","Music & Audio","Scriptwriting"],"tags":["Voice only","Remote friendly","One revision","Human only"],"budget":15000,"slots":2,"posted":17,"due":34},
    {"title":"How-to tutorial, one skill in one minute","lead":"Teach one thing a viewer can finish with you. Steps on screen, you in frame, no montage of tips.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Education & Tutorials","Product Demo","Lifestyle"],"tags":["On camera","Captions","One revision","Human only"],"budget":20000,"slots":2,"posted":9,"due":22},
    {"title":"Get-ready-with-me using one product","lead":"Get ready as you normally would and show where the product fits. Natural pace, your room, your voice.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Styling & Makeup","Beauty & Skincare","Lifestyle"],"tags":["On camera","Product ships","Captions","Human only"],"budget":25000,"slots":2,"posted":19,"due":38},
    {"title":"Gadget demo, show it working","lead":"One device, one job, shown working in your hands. Say what it does in the first sentence, then prove it.","location":"Nigeria · Lagos preferred","format":"30 to 45s vertical video","niches":["Product Demo","Unboxing","SaaS / Tech"],"tags":["On camera","Product ships","Captions","Human only"],"budget":20000,"slots":2,"posted":11,"due":26},
    {"title":"Event recap, what it felt like to be there","lead":"A vertical recap of a real event: the room, one person, and why someone who missed it should care.","location":"Lagos","format":"60 to 90s vertical recap","niches":["Event Coverage","Lifestyle","Videography"],"tags":["On location","On camera","Captions","Human only"],"budget":30000,"slots":2,"posted":21,"due":42},
    {"title":"Travel-style brand clip in your city","lead":"Film one place in your city and place the brand in that scene. It should feel like you live there.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Travel & Lifestyle","Lifestyle","Photography"],"tags":["On location","On camera","Captions","One revision","Human only"],"budget":25000,"slots":2,"posted":13,"due":29},
    {"title":"Interview clip, one question answered well","lead":"Answer one question to camera as if a host asked it. A complete thought, not a quote card.","location":"Remote, Nigeria","format":"30 to 45s vertical video","niches":["Podcast / Interview","Testimonials","Brand Ambassador"],"tags":["On camera","Remote friendly","Captions","Human only"],"budget":25000,"slots":2,"posted":23,"due":46},
    {"title":"Dance or trend video with a product in it","lead":"Use a current move, and let the product be visible without stopping the dance to explain it.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Dance & Choreography","Lifestyle","Social Posts"],"tags":["On camera","Captions","One revision","Human only"],"budget":20000,"slots":2,"posted":15,"due":33},
    {"title":"Story-first brand film, make someone feel it","lead":"Open on a feeling, not a logo. One story, one product, and a last line a viewer would repeat.","location":"Nigeria","format":"30 to 45s vertical video","niches":["Brand Ambassador","Lifestyle","Scriptwriting","Video Testimonials"],"tags":["On camera","Captions","One revision","Human only"],"budget":25000,"slots":2,"posted":27,"due":55},
    {"title":"Product reel for an e-commerce drop","lead":"Shoot one product like it is about to sell out: clean light, a few angles, and one line on why to grab it now.","location":"Lagos","format":"20 to 30s vertical reel","niches":["Photography","Product Demo","Social Posts","Fashion"],"tags":["On location","Product ships","Captions","Human only"],"budget":22000,"slots":3,"posted":30,"due":48},
    {"title":"Customer FAQ video, answer the top three questions","lead":"Pick the three questions buyers always ask and answer them to camera, one after another, no fluff.","location":"Remote, Nigeria","format":"45 to 60s vertical video","niches":["Education & Tutorials","SaaS / Tech","Testimonials"],"tags":["On camera","Remote friendly","Captions","One revision","Human only"],"budget":28000,"slots":2,"posted":33,"due":60},
    {"title":"Street interview clip, real reactions to a product","lead":"Ask real people one question about the product on the street and keep the honest reactions, good or awkward.","location":"Lagos","format":"45 to 60s vertical video","niches":["Event Coverage","Podcast / Interview","Social Posts"],"tags":["On location","On camera","Captions","Human only"],"budget":32000,"slots":2,"posted":38,"due":70}
  ]$briefs$::jsonb) loop

    insert into public.briefs
      (brand_id, title, description, format, niches, tags, budget_naira, deadline, slots, gig_type, status, conceal_brand, location, created_at, updated_at)
    select
      brand,
      item->>'title',
      (item->>'lead') || E'\n\nWhere: ' || (item->>'location') || E'.\n\n' || shared,
      item->>'format',
      array(select jsonb_array_elements_text(item->'niches')),
      array(select jsonb_array_elements_text(item->'tags')),
      (item->>'budget')::integer,
      (current_date + ((item->>'due')::int))::date,
      (item->>'slots')::smallint,
      'original', 'open', true,
      item->>'location',
      now() - ((item->>'posted')::int || ' days')::interval,
      now() - ((item->>'posted')::int || ' days')::interval
    where not exists (
      select 1 from public.briefs b where b.brand_id = brand and b.title = item->>'title'
    );

    -- Reshape whatever is already there (the founding/mask rows) to match.
    update public.briefs b set
      description  = (item->>'lead') || E'\n\nWhere: ' || (item->>'location') || E'.\n\n' || shared,
      format       = item->>'format',
      niches       = array(select jsonb_array_elements_text(item->'niches')),
      tags         = array(select jsonb_array_elements_text(item->'tags')),
      budget_naira = (item->>'budget')::integer,
      deadline     = (current_date + ((item->>'due')::int))::date,
      slots        = (item->>'slots')::smallint,
      status       = 'open',
      conceal_brand= true,
      location     = item->>'location',
      created_at   = now() - ((item->>'posted')::int || ' days')::interval
    where b.brand_id = brand and b.title = item->>'title';
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Campaigns. Per-view funded pools can mask the brand too; add the flag, then
-- seed ~12 live campaigns with varied pools, spend, rates, and posted dates.
-- ---------------------------------------------------------------------------
alter table public.campaigns
  add column if not exists conceal_brand boolean not null default false;

do $$
declare
  brand uuid;
  item jsonb;
begin
  select id into brand from public.brand_profiles
  where company_name = 'Dream Intrepid Ltd.' order by created_at limit 1;
  if brand is null then return; end if;

  for item in select * from jsonb_array_elements($campaigns$[
    {"title":"Pay-per-view: skincare before-and-after clips","lead":"Post an honest before-and-after on your own skin. We pay for the views it earns, you keep the clip.","niches":["Beauty & Skincare","Product Reviews","Lifestyle"],"pool":300000,"spent":84000,"rate":2500,"posted":1},
    {"title":"Pay-per-view: fashion haul reels","lead":"Style a haul and post it where your people watch. Per-1,000-view payout from the pool until it runs out.","niches":["Fashion","Styling & Makeup","Social Posts"],"pool":250000,"spent":60000,"rate":2200,"posted":3},
    {"title":"Pay-per-view: quick recipes with the product","lead":"One recipe, product in it, posted to your feed. We pay per thousand views the recipe pulls.","niches":["Food & Cooking","Lifestyle"],"pool":200000,"spent":45000,"rate":2000,"posted":5},
    {"title":"Pay-per-view: fintech money tips to camera","lead":"Share one money tip that uses the app and post it. Per-view payout, Nigerian English.","niches":["Finance & Fintech","Education & Tutorials","SaaS / Tech"],"pool":400000,"spent":120000,"rate":3000,"posted":2},
    {"title":"Pay-per-view: gadget demo shorts","lead":"Show the device doing one job in under 30 seconds. Post it, we pay for the views.","niches":["Product Demo","Unboxing","SaaS / Tech"],"pool":280000,"spent":31000,"rate":2600,"posted":7},
    {"title":"Pay-per-view: day-in-the-life with the brand","lead":"Drop the product into a real day and post the clip. Payout scales with the views it earns.","niches":["Lifestyle","Brand Ambassador"],"pool":220000,"spent":0,"rate":2100,"posted":9},
    {"title":"Pay-per-view: fitness challenge clips","lead":"Post a short challenge viewers can copy, product used once. Per-1,000-view payout from the pool.","niches":["Fitness & Health","Lifestyle","Product Demo"],"pool":180000,"spent":52000,"rate":1900,"posted":4},
    {"title":"Pay-per-view: unboxing reactions","lead":"Film your first reaction opening it and post it the same day. We pay for the views that come in.","niches":["Unboxing","Product Reviews","Social Posts"],"pool":240000,"spent":17000,"rate":2300,"posted":11},
    {"title":"Pay-per-view: trend-led skits","lead":"Turn a current trend into a skit that lands the product. Post it, we pay per thousand views.","niches":["Skits","Dance & Choreography","Social Posts"],"pool":260000,"spent":74000,"rate":2400,"posted":6},
    {"title":"Pay-per-view: how-to shorts","lead":"Teach one skill with the product and post it. Payout per 1,000 views until the pool is spent.","niches":["Education & Tutorials","Product Demo","Lifestyle"],"pool":210000,"spent":0,"rate":2000,"posted":13},
    {"title":"Pay-per-view: testimonial clips","lead":"Say what the product actually did for you, one real moment, and post it. We pay for the reach.","niches":["Video Testimonials","Testimonials","Brand Ambassador"],"pool":190000,"spent":38000,"rate":2100,"posted":8},
    {"title":"Pay-per-view: get-ready-with-me","lead":"Fit the product into your getting-ready routine and post it. Per-1,000-view payout from the pool.","niches":["Styling & Makeup","Beauty & Skincare","Lifestyle"],"pool":230000,"spent":29000,"rate":2200,"posted":15}
  ]$campaigns$::jsonb) loop

    insert into public.campaigns
      (brand_id, title, description, niches, pool_naira, rate_per_1000_naira, spent_naira, funded, status, conceal_brand, created_at, updated_at)
    select
      brand,
      item->>'title',
      (item->>'lead') || E'\n\nA verified brand is funding this pool. The company name stays private until you are hired. Submit a public post, report the views, and the brand approves and pays per 1,000 from the pool. Inflated claims are forfeited in the open. No AI avatars and no stock faces.',
      array(select jsonb_array_elements_text(item->'niches')),
      (item->>'pool')::integer,
      (item->>'rate')::integer,
      (item->>'spent')::integer,
      true, 'open', true,
      now() - ((item->>'posted')::int || ' days')::interval,
      now() - ((item->>'posted')::int || ' days')::interval
    where not exists (
      select 1 from public.campaigns c where c.brand_id = brand and c.title = item->>'title'
    );

    update public.campaigns c set
      description   = (item->>'lead') || E'\n\nA verified brand is funding this pool. The company name stays private until you are hired. Submit a public post, report the views, and the brand approves and pays per 1,000 from the pool. Inflated claims are forfeited in the open. No AI avatars and no stock faces.',
      niches        = array(select jsonb_array_elements_text(item->'niches')),
      pool_naira    = (item->>'pool')::integer,
      rate_per_1000_naira = (item->>'rate')::integer,
      spent_naira   = (item->>'spent')::integer,
      funded        = true,
      status        = 'open',
      conceal_brand = true,
      created_at    = now() - ((item->>'posted')::int || ' days')::interval
    where c.brand_id = brand and c.title = item->>'title';
  end loop;
end $$;
