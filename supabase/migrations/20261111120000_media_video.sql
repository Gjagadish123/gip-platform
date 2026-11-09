-- Project films (the hero video on a project page): the media bucket also takes MP4 and WebM, up to 50 MB.
-- The admin still caps images and PDFs at 20 MB. The first migration's insert skips an existing bucket, so update it.
update storage.buckets
set file_size_limit = 50 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'application/pdf',
                               'video/mp4', 'video/webm']
where id = 'project-media';
