
CREATE TABLE public.custom_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  overview TEXT,
  vote_average NUMERIC DEFAULT 0,
  release_date TEXT,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tmdb_id, media_type)
);

ALTER TABLE public.custom_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom content"
ON public.custom_content FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can insert custom content"
ON public.custom_content FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update custom content"
ON public.custom_content FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete custom content"
ON public.custom_content FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
