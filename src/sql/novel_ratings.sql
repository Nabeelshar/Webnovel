
-- This SQL will be executed separately
CREATE TABLE IF NOT EXISTS public.novel_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  novel_id UUID REFERENCES public.novels NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, novel_id)
);

-- Enable Row Level Security
ALTER TABLE public.novel_ratings ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting ratings
CREATE POLICY "Users can insert their own ratings"
ON public.novel_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for selecting ratings
CREATE POLICY "Users can view any rating"
ON public.novel_ratings
FOR SELECT
USING (true);

-- Create policy for updating ratings
CREATE POLICY "Users can update their own ratings"
ON public.novel_ratings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for deleting ratings
CREATE POLICY "Users can delete their own ratings"
ON public.novel_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update novel rating
CREATE OR REPLACE FUNCTION update_novel_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate average rating for the novel
  UPDATE novels
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM novel_ratings
    WHERE novel_id = NEW.novel_id
  )
  WHERE id = NEW.novel_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to update novel rating when a rating is added, updated, or deleted
DROP TRIGGER IF EXISTS on_rating_change ON public.novel_ratings;
CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE OR DELETE
  ON public.novel_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_novel_rating();

-- Create helper RPC function for updating ratings
CREATE OR REPLACE FUNCTION update_novel_rating(
  rating_id UUID,
  new_rating INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.novel_ratings
  SET rating = new_rating
  WHERE id = rating_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
