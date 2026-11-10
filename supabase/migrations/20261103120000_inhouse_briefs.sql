-- In-house briefs are work the hiring company is running itself. Accepting an
-- applicant starts the job and the conversation. It does not take a payment
-- and it does not create escrow.

alter table public.briefs
  add column if not exists in_house boolean not null default false;

alter table public.gigs
  add column if not exists in_house boolean not null default false;

update public.briefs b
set in_house = true
from public.brand_profiles p
where p.id = b.brand_id
  and p.company_name = 'Dream Intrepid Ltd.';
