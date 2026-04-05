
ALTER TABLE public.custom_content ADD COLUMN video_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));
