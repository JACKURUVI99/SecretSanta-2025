-- Insert Kollywood words if missing
INSERT INTO public.word_bank (word, hint, category) VALUES
('VIKRAM', 'Ghost and Agent', 'Kollywood'),
('EO', 'Rolex calling', 'Kollywood'),
('MASTER', 'JD vs Bhavani', 'Kollywood'),
('KAITHI', 'Biryani and Gatling Gun', 'Kollywood'),
('THUPPAKKI', 'Jagdish in Mumbai', 'Kollywood'),
('MANKATHA', 'Vinayak Mahadev Money Heist', 'Kollywood'),
('ANNIYAN', 'Multiple personality vigilante', 'Kollywood'),
('ENTHIRAN', 'Chitti the Robot', 'Kollywood'),
('CHANDRAMUKHI', 'Laka Laka Laka', 'Kollywood'),
('GILLI', 'Kabaddi Kabaddi', 'Kollywood'),
('PADAYAPPA', 'Neelambari vs Rajini', 'Kollywood'),
('BAASHA', 'Auto driver don', 'Kollywood'),
('SIVAJI', 'Black money to white', 'Kollywood'),
('MERSAL', 'Three vijays', 'Kollywood'),
('BIGIL', 'Women football coach', 'Kollywood'),
('VARISU', 'The returns of the son', 'Kollywood'),
('TUNIVU', 'No Guts No Glory', 'Kollywood'),
('JAILER', 'Hukum Tigar Ka Hukum', 'Kollywood'),
('LEO', 'Bloody Sweet', 'Kollywood'),
('THUNIVU', 'Bank Heist in Chennai', 'Kollywood')
ON CONFLICT DO NOTHING;

-- Force refresh of today's assignment to ensure user gets these new words
-- OPTIONAL: Only if you want to reset for users who saw empty screen today
-- DELETE FROM public.user_word_progress WHERE assigned_at = CURRENT_DATE AND word_id IN (SELECT id FROM public.word_bank WHERE category = 'Kollywood');
-- Actually, the RPC handles "if < 5 insert more". So if they have 0, calling it again (reloading page) will checking count (0), insert 5, and return them.
-- So just inserting words is enough!

NOTIFY pgrst, 'reload schema';
