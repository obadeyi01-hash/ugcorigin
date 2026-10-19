-- ============================================================================
-- UGCOrigin, chat attachment kind.
-- We store what an attachment is (image | video | audio | file) at send time so
-- the client can render the right preview — inline image/video, an audio player
-- for voice notes ("Voicebites"), or a download chip — without re-inspecting the
-- file. Voice notes are audio attachments.
-- ============================================================================

alter table public.messages
  add column if not exists attachment_kind text;

comment on column public.messages.attachment_kind is
  'image | video | audio | file — drives the chat preview. audio = Voicebite.';
