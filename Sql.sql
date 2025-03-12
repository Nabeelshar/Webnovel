CREATE TABLE public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  novel_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT bookmarks_user_id_novel_id_key UNIQUE (user_id, novel_id),
  CONSTRAINT bookmarks_novel_id_fkey FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
  CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
); 

CREATE TABLE public.chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  novel_id uuid NOT NULL,
  title text NOT NULL,
  chapter_number integer NOT NULL,
  content text NOT NULL,
  is_premium boolean NULL DEFAULT false,
  coin_cost integer NULL DEFAULT 0,
  views integer NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chapters_pkey PRIMARY KEY (id),
  CONSTRAINT chapters_novel_id_chapter_number_key UNIQUE (novel_id, chapter_number),
  CONSTRAINT chapters_novel_id_fkey FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
); 

CREATE TABLE public.coin_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NULL,
  coin_amount integer NOT NULL,
  price numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coin_packages_pkey PRIMARY KEY (id)
); 

CREATE TABLE public.coin_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  description text NULL,
  reference_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coin_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT coin_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT coin_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['purchase'::text, 'reward'::text, 'author_earnings'::text, 'refund'::text])))
); 

CREATE TABLE public.featured_novels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  novel_id uuid NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT featured_novels_pkey PRIMARY KEY (id),
  CONSTRAINT unique_featured_novel UNIQUE (novel_id),
  CONSTRAINT featured_novels_novel_id_fkey FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
); 

CREATE TABLE public.genres (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  CONSTRAINT genres_pkey PRIMARY KEY (id),
  CONSTRAINT genres_name_key UNIQUE (name)
); 

CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  menu_location text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  parent_id uuid NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES menu_items(id),
  CONSTRAINT menu_items_menu_location_check CHECK ((menu_location = ANY (ARRAY['header'::text, 'footer'::text])))
); 

CREATE TABLE public.novel_genres (
  novel_id uuid NOT NULL,
  genre_id uuid NOT NULL,
  CONSTRAINT novel_genres_pkey PRIMARY KEY (novel_id, genre_id),
  CONSTRAINT novel_genres_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
  CONSTRAINT novel_genres_novel_id_fkey FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
); 

CREATE TABLE public.novel_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  novel_id uuid NOT NULL,
  rating integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  comment text NULL,
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT novel_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT novel_ratings_user_id_novel_id_key UNIQUE (user_id, novel_id),
  CONSTRAINT novel_ratings_novel_id_fkey FOREIGN KEY (novel_id) REFERENCES novels(id),
  CONSTRAINT novel_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT novel_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
); 

CREATE TABLE public.novel_tags (
  novel_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  CONSTRAINT novel_tags_pkey PRIMARY KEY (novel_id, tag_id),
  CONSTRAINT novel_tags_novel_id_fkey FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
  CONSTRAINT novel_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
); 

CREATE TABLE public.novels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  description text NULL,
  cover_image text NULL,
  status text NULL DEFAULT 'ongoing'::text,
  rating numeric(3,2) NULL DEFAULT 0,
  views integer NULL DEFAULT 0,
  bookmarks integer NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT novels_pkey PRIMARY KEY (id),
  CONSTRAINT novels_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT novels_status_check CHECK ((status = ANY (ARRAY['ongoing'::text, 'completed'::text, 'hiatus'::text])))
); 

CREATE TABLE public.pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  in_menu boolean NOT NULL DEFAULT false,
  menu_order integer NULL DEFAULT 0,
  CONSTRAINT pages_pkey PRIMARY KEY (id),
  CONSTRAINT pages_slug_key UNIQUE (slug)
); 

CREATE TABLE public.payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_settings_pkey PRIMARY KEY (id)
); 

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL,
  display_name text NULL,
  avatar_url text NULL,
  bio text NULL,
  coins integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_admin boolean NOT NULL DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_username_key UNIQUE (username),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
); 

CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id uuid NOT NULL,
  coin_amount integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT purchases_pkey PRIMARY KEY (id),
  CONSTRAINT purchases_user_id_chapter_id_key UNIQUE (user_id, chapter_id),
  CONSTRAINT purchases_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
); 

CREATE TABLE public.reading_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id uuid NOT NULL,
  last_position integer NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  novel_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reading_history_pkey PRIMARY KEY (id),
  CONSTRAINT reading_history_user_id_chapter_id_key UNIQUE (user_id, chapter_id),
  CONSTRAINT reading_history_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  CONSTRAINT reading_history_novel_id_fkey FOREIGN KEY (novel_id) REFERENCES novels(id),
  CONSTRAINT reading_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
); 

CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'NovelVerse'::text,
  footer_site_name text NOT NULL DEFAULT 'NovelHaven'::text,
  site_tagline text NOT NULL DEFAULT 'Discover the best stories from emerging and established authors.'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_single_row ON public.site_settings USING btree ((true)) TABLESPACE pg_default;

CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_name_key UNIQUE (name)
);
