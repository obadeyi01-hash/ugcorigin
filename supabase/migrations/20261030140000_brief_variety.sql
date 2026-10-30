-- Brief variety. The 20261030120000 seed put every brief in Lagos/Nigeria and
-- gave most of them 2–3 slots. This additive pass moves a few to Abuja and
-- drops a handful to a single creator, so the public listing reads as a real
-- mix of locations and team sizes. Idempotent: it only rewrites the targeted
-- rows (by brand + title) and does not touch the applied seed migration.
do $$
declare
  brand uuid;
  loc jsonb;
begin
  select id into brand from public.brand_profiles
  where company_name = 'Dream Intrepid Ltd.' order by created_at limit 1;
  if brand is null then
    raise notice 'Dream Intrepid Ltd. not found; skipping brief variety';
    return;
  end if;

  -- Three briefs move to Abuja. Update the location column AND the "Where:"
  -- line baked into the description so the two never disagree.
  for loc in select * from jsonb_array_elements($locs$[
    {"title":"Fintech app explainer, talking to camera","location":"Nigeria · Abuja"},
    {"title":"Testimonial video about a product you use","location":"Nigeria · Abuja"},
    {"title":"Event recap, what it felt like to be there","location":"Abuja"}
  ]$locs$::jsonb) loop
    update public.briefs b set
      location    = loc->>'location',
      description = regexp_replace(b.description, E'\\nWhere: [^\\n]*', E'\\nWhere: ' || (loc->>'location') || '.')
    where b.brand_id = brand and b.title = loc->>'title';
  end loop;

  -- Four briefs need only one creator.
  update public.briefs b set slots = 1
  where b.brand_id = brand and b.title in (
    'Voice-over for a brand film',
    'Interview clip, one question answered well',
    'Customer FAQ video, answer the top three questions',
    'Get-ready-with-me using one product'
  );
end $$;
