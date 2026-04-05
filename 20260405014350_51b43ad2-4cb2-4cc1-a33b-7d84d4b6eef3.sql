
-- Watch history / continue watching
CREATE TABLE public.watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id text NOT NULL,
  content_type text NOT NULL DEFAULT 'movie',
  title text NOT NULL,
  poster_path text,
  backdrop_path text,
  video_url text,
  playback_position real NOT NULL DEFAULT 0,
  total_duration real NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  last_watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_watch_history_user_content ON public.watch_history (user_id, content_id, content_type);
CREATE INDEX idx_watch_history_last ON public.watch_history (user_id, last_watched_at DESC);

ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watch history" ON public.watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watch history" ON public.watch_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own watch history" ON public.watch_history FOR DELETE USING (auth.uid() = user_id);

-- Episodes for series
CREATE TABLE public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id text NOT NULL,
  season_number integer NOT NULL DEFAULT 1,
  episode_number integer NOT NULL DEFAULT 1,
  title text,
  overview text,
  video_url text,
  thumbnail_path text,
  duration_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_episodes_unique ON public.episodes (content_id, season_number, episode_number);
CREATE INDEX idx_episodes_content ON public.episodes (content_id, season_number);

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view episodes" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Admins can insert episodes" ON public.episodes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update episodes" ON public.episodes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete episodes" ON public.episodes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Device sessions for concurrent login limiting
CREATE TABLE public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_info text,
  session_token text NOT NULL,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_sessions_user ON public.device_sessions (user_id, last_active_at DESC);

ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.device_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.device_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.device_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.device_sessions FOR DELETE USING (auth.uid() = user_id);
