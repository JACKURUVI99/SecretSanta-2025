-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, roll_number, points, favorite_emoji)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Anonymous Elf'),
    COALESCE(new.raw_user_meta_data->>'roll_number', split_part(new.email, '@', 1)),
    0,
    '🎅'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    roll_number = EXCLUDED.roll_number;
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
