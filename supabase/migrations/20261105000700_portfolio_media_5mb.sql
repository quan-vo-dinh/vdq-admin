-- Raise storage and metadata limits alongside the API and browser validator.
alter table public.portfolio_media drop constraint portfolio_media_bytes_check;
alter table public.portfolio_media add constraint portfolio_media_bytes_check
  check (bytes between 1 and 5242880);
update storage.buckets set file_size_limit = 5242880 where id = 'portfolio-media';
