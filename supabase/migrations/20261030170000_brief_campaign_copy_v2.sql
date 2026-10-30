-- Copy pass v2 for the demo briefs and campaigns. The previous rewrite
-- (20261030150000) gave each brief a distinct voice but leaned on em dashes in
-- almost every title and description, and held every description to roughly the
-- same medium length. The 12 per-view campaigns (20261030120000) still shared
-- ONE identical boilerplate paragraph and were never voiced. This pass:
--   * strips every em dash and en dash from brief + campaign copy (commas,
--     periods and parentheses do the work instead);
--   * keeps each brief's distinct brand voice but gives real LENGTH variety,
--     roughly a third short, a third medium, a third long;
--   * replaces the shared campaign boilerplate with a distinct, voiced,
--     length-varied description per campaign and varies the samey titles.
-- Touches title + description only (briefs keep their format/budget/tags/
-- location/slots; campaigns keep their pool/rate/spent/niches/dates). Matched on
-- the CURRENT title. Additive + idempotent. Dream Intrepid only.

do $$
declare
  brand uuid;
  item jsonb;
begin
  select id into brand from public.brand_profiles
  where company_name = 'Dream Intrepid Ltd.' order by created_at limit 1;
  if brand is null then
    raise notice 'Dream Intrepid Ltd. not found; skipping brief copy v2';
    return;
  end if;

  for item in select * from jsonb_array_elements($b$[
    {"old":"We want the 2-step, not the 10-step — skincare that fits a real morning","title":"Two steps, not ten. Skincare for a real morning.","desc":"Here is the truth. Most people will never do a ten step routine, and we have stopped pretending otherwise. Film your actual morning, the rushing, the half asleep face, whatever it really looks like, and show where our two products slot in. Give us one honest line about what your skin was doing before. Harsh bathroom light is welcome. We would rather have that than a ring lit lie."},
    {"old":"One look, one reason — a try-on, not a fashion show","title":"One look, one reason.","desc":"Skip the haul. Put on the single piece you would actually text a friend about, move in it, and tell us the one reason it is worth the money."},
    {"old":"Cook the thing you'd cook anyway (just let our spice earn its spot)","title":"Cook what you would cook anyway (and let our spice earn its spot)","desc":"We are a small kitchen brand and we are allergic to fake cooking content. Make a dish you genuinely make, jollof, stew, a fast breakfast, and use the product where it actually belongs. Give us the real kitchen (the gas cooker, the noise, your hands) and one honest taste reaction at the end."},
    {"old":"A 30-second move someone can copy before they talk themselves out of it","title":"A 30 second move someone can copy before they talk themselves out of it","desc":"No transformation arc and no gym bro voice. Give us one move a beginner can actually do at home, use the product once the way you really would, and keep it honest. A little out of breath is perfect."},
    {"old":"Explain sending money like you're teaching your mum — on camera","title":"Explain sending money like you are teaching your mum","desc":"We will pay well for one thing done properly. Take a single task in the app (send money, create a goal, pay a bill) and explain it so a first timer understands it in under a minute. Talk to camera the way you would walk your mum through it, patient, plain Nigerian English, no jargon, no feature list. If your grandma would follow it, you nailed it."},
    {"old":"Show it working — one job, start to finish, no feature dump","title":"Show it working, start to finish.","desc":"Pick one job the app does and walk it end to end. Open, do, done. Keep your face and the screen both in frame so it feels like a person and not a tutorial channel. If you hit a rough edge, leave it in. Honest beats polished here."},
    {"old":"A real day, lightly branded — story first, product second","title":"A real day, lightly branded.","desc":"We do not want an ad, we want a day. String a few real moments together and let the product appear once, where it actually fits, with your voice calm over the top."},
    {"old":"Open it on camera — we want the first face, not the fifth take","title":"Open it on camera. We want the first face, not the fifth take.","desc":"Press record before you open it. We want the genuine first reaction, the pause, the surprise, even the quiet hmm. Add one honest sentence about what you expected versus what you got. Please do not reshoot for a better take. The real one is the asset."},
    {"old":"Review it like you owe us nothing — what's good AND what you'd change","title":"Review it like you owe us nothing.","desc":"A review that only praises is useless to us and obvious to everyone watching. Use it for a few days, then tell the camera what actually worked and the one thing you would change. We will not reject you for a fair criticism. In fact we will trust the praise more because of it. Speak the way you would to a friend who asked if it was worth buying."},
    {"old":"One specific moment it helped — name, face, and a real detail","title":"One specific moment it helped.","desc":"Skip the slogans. Tell us the single moment the product actually did something for you, where you were, what happened, how it felt. Use your real name and face. A small true detail sells harder than a big vague claim."},
    {"old":"Make us laugh in 30 seconds — and the product is the punchline","title":"Make us laugh in 30 seconds (the product is the punchline)","desc":"You are funny, so prove it. Write a tiny scene with a setup and a turn, where the product is the reason the scene flips. Perform it yourself. We would far rather have one genuinely funny 25 second skit than a full minute of trying too hard. If it makes our edit team laugh out loud, you are hired. Keep it tight and keep it yours."},
    {"old":"Lend us your voice — warm, Nigerian, 60 seconds, we cut to picture","title":"Lend us your voice.","desc":"Remote and clean. Record up to 60 seconds of warm, clear Nigerian English voice over to the script we send. No music bed from your side and no effects, just your voice recorded well, with a couple of reads so we can choose. If your room echoes, hang a blanket up. We will notice."},
    {"old":"Teach one thing a viewer can finish with you in a minute","title":"Teach one thing a viewer can finish with you in a minute","desc":"One skill, start to finish, nothing extra. Put the steps on screen, stay in frame, and let the viewer finish it right alongside you."},
    {"old":"Get ready like we're not watching — the product just happens to be there","title":"Get ready like we are not watching.","desc":"Do your real getting ready, the pace, the pauses, the talking to yourself, and let the product land where it naturally fits. The less it feels performed, the more we want it."},
    {"old":"Say what it does in one sentence, then prove it with your hands","title":"Say what it does in one sentence, then prove it with your hands","desc":"No spec sheet. Open on the one sentence that says what this device is for, then immediately show it doing that job in your hands, close and clear. One oh, nice moment beats a list of features. Lagos creators preferred so we can ship the unit fast."},
    {"old":"Make someone who missed it feel the FOMO — a 90-second recap","title":"Make someone who missed it feel the FOMO","desc":"Do not document the event, bottle the feeling of being in the room. We want the crowd, one face, one moment, and a last beat that makes someone who skipped it wish they had come. Shoot it on location in Lagos. Lean into energy over coverage. If it moves fast and makes a pulse jump, you understood the brief."},
    {"old":"Film your city like you live there — because you do","title":"Film your city like you live there.","desc":"Pick one spot in your city that means something to you and place the brand into that scene like it belongs. Let your place do the talking."},
    {"old":"Answer one question like a host just asked you — a whole thought, not a quote card","title":"Answer one question like a host just asked you","desc":"We will send one question. Answer it to camera as if someone across the table just asked, a complete and considered thought with a beginning and an end. No quote card energy and no rush. Remote is fine. A quiet room and clear sound is the whole job."},
    {"old":"Ride the current trend — but don't stop dancing to explain the product","title":"Ride the trend, and never stop to explain the product","desc":"Use whatever is moving right now and keep the product visible without ever breaking the flow to pitch it. If you have to pause and explain, it is not working. Make it feel native to your feed."},
    {"old":"Open on a feeling, not a logo — one story people will repeat","title":"Open on a feeling, not a logo.","desc":"This is the ambitious one, and we are paying for it. Open on an emotion, not a product. Tell one small human story where the product matters quietly in the background, never shouting for attention. End on a line a viewer would actually repeat to someone the next day. Take your time with it. We are not after another ad, we are after something people feel and remember."},
    {"old":"Shoot it like it's about to sell out — a drop reel with urgency","title":"Shoot it like it is about to sell out.","desc":"One product, clean light, a few strong angles, and one line on why to grab it before it is gone. Fast and crisp, built for a feed that scrolls. Lagos so we can courier the sample today. Think last three left, not museum piece."},
    {"old":"Answer the three questions every buyer asks — no fluff between them","title":"Answer the three questions every buyer asks","desc":"We will give you the three questions buyers always ask. Answer them to camera, one after another, tight, so a viewer leaves with zero doubts. Remote is fine. Brevity is the skill we are paying for."},
    {"old":"Put it in strangers' hands on a Lagos street — keep the awkward reactions","title":"Put it in strangers' hands on a Lagos street","desc":"Take it to the street and ask real people one question about it. Keep the honest reactions, the confused ones, the surprised ones, the I would buy that ones. Do not stage any of it. The awkwardness is the whole credibility here, and the polished version is worthless to us. Roll long, catch the real moments, and trust that the street is more convincing than any script."}
  ]$b$::jsonb) loop
    update public.briefs b set
      title = item->>'title',
      description = item->>'desc'
    where b.brand_id = brand and b.title = item->>'old';
  end loop;

  -- Campaigns: distinct, voiced, length-varied descriptions + varied titles.
  for item in select * from jsonb_array_elements($c$[
    {"old":"Pay-per-view: skincare before-and-after clips","title":"Honest before and after skin clips (paid by the view)","desc":"Post an honest before and after on your own skin, no filters doing the work for you. Put it where your people actually watch, then report the views it earns. You are paid per 1,000 views from the pool until the pool runs dry, and you keep the clip either way. One thing we will say plainly. The view counts have to be real, and inflated numbers are forfeited in the open where everyone can see."},
    {"old":"Pay-per-view: fashion haul reels","title":"Style a haul, get paid for every 1,000 views","desc":"Style a haul and post it where your people watch. We pay per 1,000 views from the pool, so report the real numbers and keep the reel."},
    {"old":"Pay-per-view: quick recipes with the product","title":"Quick recipes, one product, paid on views","desc":"One recipe, our product in it, posted to your own feed. Report the views and we pay per 1,000 from the pool until it is spent. Real counts only. Padded numbers get forfeited, no arguments."},
    {"old":"Pay-per-view: fintech money tips to camera","title":"One money tip to camera, paid per view","desc":"Share one money tip that genuinely uses the app, in plain Nigerian English, and post it publicly. You are paid per 1,000 views the clip pulls, drawn from the funded pool. Report honest view counts. Inflated claims are forfeited."},
    {"old":"Pay-per-view: gadget demo shorts","title":"Gadget demo shorts, paid by the views they pull","desc":"Show the device doing one job in under 30 seconds, post it, and report the views. Paid per 1,000 from the pool. No padded numbers."},
    {"old":"Pay-per-view: day-in-the-life with the brand","title":"A real day with the product, paid on reach","desc":"Drop the product into a real day of yours and post the clip where it belongs, not somewhere you never post. Payout scales with the views it earns, paid per 1,000 from the funded pool until the pool runs out. Report the real figures when you submit. We check, and anything inflated is forfeited in the open. Keep the content whichever way the numbers land."},
    {"old":"Pay-per-view: fitness challenge clips","title":"Fitness challenge clips viewers can copy, paid per view","desc":"Post a short challenge viewers can copy at home, with the product used once along the way. Report the views and we pay per 1,000 from the pool. Honest counts only, inflated ones are forfeited."},
    {"old":"Pay-per-view: unboxing reactions","title":"First reaction unboxings, paid for the views","desc":"Film your real first reaction opening it and post it the same day. We pay for the views that come in, per 1,000 from the pool."},
    {"old":"Pay-per-view: trend-led skits","title":"Turn a trend into a skit, paid per 1,000 views","desc":"Turn a current trend into a short skit that actually lands the product, then post it publicly. You are paid per 1,000 views from the pool, so report the real numbers. Anything padded is forfeited in the open."},
    {"old":"Pay-per-view: how-to shorts","title":"Teach one skill, get paid per 1,000 views","desc":"Teach one skill with the product and post it. Report the views, get paid per 1,000 from the pool until it is spent."},
    {"old":"Pay-per-view: testimonial clips","title":"One real testimonial, paid for the reach","desc":"Tell one real moment the product did something for you, your face, your name, no slogans, and post it where people will see it. You are paid for the reach, per 1,000 views from the funded pool, until the pool is spent. When you submit, report the true view count. We verify, and inflated claims are forfeited out in the open where it is obvious. The point of this one is trust, so earn it honestly."},
    {"old":"Pay-per-view: get-ready-with-me","title":"Get ready with me, paid per view","desc":"Fit the product into your real getting ready routine and post the clip to your feed. Report the views and we pay per 1,000 from the pool. Keep the numbers honest. Inflated ones are forfeited."}
  ]$c$::jsonb) loop
    update public.campaigns c set
      title = item->>'title',
      description = item->>'desc'
    where c.brand_id = brand and c.title = item->>'old';
  end loop;
end $$;
