BEGIN;

-- 1. RESET DATA
-- We are clearing the table to remove any bad data/mismatches.
TRUNCATE TABLE public.word_bank CASCADE;
-- This will also cascade delete from user_word_progress due to FK, which is good (resets progress).
-- If not cascade, we do it manually:
DELETE FROM public.user_word_progress;

-- 2. INSERT WORDS (20 per category minimum)

-- KOLLYWOOD (Tamil)
INSERT INTO public.word_bank (word, hint, category) VALUES
('VIKRAM', 'Ghost and Agent', 'Kollywood'),
('LEO', 'Bloody Sweet', 'Kollywood'),
('JAILER', 'Tiger Ka Hukum', 'Kollywood'),
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
('THUNIVU', 'Bank Heist in Chennai', 'Kollywood'),
('KANTARA', 'Divine scream', 'Kollywood'), -- Dubbed hit
('KGF', 'Salaam Rocky Bhai', 'Kollywood'); -- Dubbed hit

-- TOLLYWOOD (Telugu)
INSERT INTO public.word_bank (word, hint, category) VALUES
('BAAHUBALI', 'Why did Katappa kill him?', 'Tollywood'),
('RRR', 'Fire and Water friendship', 'Tollywood'),
('PUSHPA', 'Thaggedhe Le', 'Tollywood'),
('MAGADHEERA', 'Reincarnation love story', 'Tollywood'),
('ARJUN REDDY', 'Intense medical student', 'Tollywood'),
('EEGA', 'Reborn as a housefly', 'Tollywood'),
('RANGASTHALAM', 'Sound Engineer in village', 'Tollywood'),
('ALA VAIKUNTHAPURRAMULOO', 'Boardroom dance fight', 'Tollywood'),
('MAHANATI', 'Savitri biopic', 'Tollywood'),
('JERSEY', 'Cricket comeback at 36', 'Tollywood'),
('SALAAR', 'Ceasefire', 'Tollywood'),
('DEVARA', 'Fear is the only emotion', 'Tollywood'),
('KALKI', 'Future meets Mythology', 'Tollywood'),
('HANUMAN', 'Superhero of Anjanadri', 'Tollywood'),
('GUNTUR KAARAM', 'Spicy mass masala', 'Tollywood'),
('KARTIK', 'Mystical thriller', 'Tollywood'),
('MAJOR', 'Sandeep Unnikrishnan', 'Tollywood'),
('SITA RAMAM', 'Letter to Sita', 'Tollywood'),
('DASARA', 'Coal mine revenge', 'Tollywood'),
('OG', 'They call him OG', 'Tollywood');

-- MOLLYWOOD (Malayalam)
INSERT INTO public.word_bank (word, hint, category) VALUES
('DRISHYAM', 'Georgekutty and his family', 'Mollywood'),
('PREMAM', 'Three stages of love', 'Mollywood'),
('LUCIFER', 'Stephen Nedumpally', 'Mollywood'),
('BANGALORE DAYS', 'Cousins trip', 'Mollywood'),
('MANICHITRATHAZHU', 'Nagavalli is watching', 'Mollywood'),
('KUMBALANGI NIGHTS', 'Shammi is the hero', 'Mollywood'),
('MINNAL MURALI', 'Local superhero', 'Mollywood'),
('RDX', 'Karate action', 'Mollywood'),
('KANNUR SQUAD', 'Police investigation across states', 'Mollywood'),
('BRAMAYUGAM', 'Black and white horror', 'Mollywood'),
('AADUJEEVITHAM', 'Goat life survival', 'Mollywood'),
('MANJUMMEL BOYS', 'Guna cave rescue', 'Mollywood'),
('AAVESHAM', 'College gang and Ranga', 'Mollywood'),
('2018', 'Kerala floods heroes', 'Mollywood'),
('IYOBINTE PUSTHAKAM', 'Period drama visuals', 'Mollywood'),
('CHARLIE', 'The wandering djinn', 'Mollywood'),
('USTAD HOTEL', 'Biryani and grandfather', 'Mollywood'),
('KURUP', 'Fugitive criminal', 'Mollywood'),
('BHEESHMA PARVAM', 'Micheal appan', 'Mollywood'),
('THALLUMAALA', 'Non-stop fights', 'Mollywood');

-- BOLLYWOOD (Hindi)
INSERT INTO public.word_bank (word, hint, category) VALUES
('SHOLAY', 'Kitne aadmi the', 'Bollywood'),
('DDLJ', 'Palat Palat Palat', 'Bollywood'),
('3 IDIOTS', 'All is Well', 'Bollywood'),
('DANGAL', 'Wrestling sisters', 'Bollywood'),
('LAGAAN', 'Cricket match taxes', 'Bollywood'),
('PK', 'Wrong number', 'Bollywood'),
('WAR', 'Hrithik vs Tiger', 'Bollywood'),
('PATHAAN', 'Spy universe begins', 'Bollywood'),
('JAWAN', 'Bald SRK metro hijack', 'Bollywood'),
('ANIMAL', 'Papa meri jaan', 'Bollywood'),
('GADDAR', 'Handpumpscene', 'Bollywood'),
('K3G', 'Its all about loving your family', 'Bollywood'),
('ZINDAGI NA MILEGI DOBARA', 'Spain road trip', 'Bollywood'),
('STREE', 'O Stree kal aana', 'Bollywood'),
('BRAHMASTRA', 'Shiva finding fire', 'Bollywood'),
('TIGER 3', 'Tiger is back', 'Bollywood'),
('DUNKI', 'Donkey flight to London', 'Bollywood'),
('ROCKY AUR RANI', 'Randhawa paradise', 'Bollywood'),
('OMG 2', 'Lord Shiva messenger', 'Bollywood'),
('CREW', 'Air hostess heist', 'Bollywood');

-- HOLLYWOOD (English)
INSERT INTO public.word_bank (word, hint, category) VALUES
('AVENGERS', 'Earths Mightiest Heroes', 'Hollywood'),
('TITANIC', 'Near, far, wherever you are', 'Hollywood'),
('INCEPTION', 'Dreams within dreams', 'Hollywood'),
('JURASSIC PARK', 'Dinosaurs rule the earth', 'Hollywood'),
('THE MATRIX', 'Red pill or blue pill', 'Hollywood'),
('AVATAR', 'Blue people on Pandora', 'Hollywood'),
('DARK KNIGHT', 'Why so serious', 'Hollywood'),
('INTERSTELLAR', 'Love transcends dimensions', 'Hollywood'),
('OPPENHEIMER', 'Now I am become Death', 'Hollywood'),
('BARBIE', 'Hi Barbie!', 'Hollywood'),
('SPIDERMAN', 'With great power', 'Hollywood'),
('IRON MAN', 'I am Iron Man', 'Hollywood'),
('BLACK PANTHER', 'Wakanda Forever', 'Hollywood'),
('LION KING', 'Circle of Life', 'Hollywood'),
('FROZEN', 'Let it go', 'Hollywood'),
('TOY STORY', 'You got a friend in me', 'Hollywood'),
('HARRY POTTER', 'Boy who lived', 'Hollywood'),
('LORD OF THE RINGS', 'My Precious', 'Hollywood'),
('STAR WARS', 'May the Force be with you', 'Hollywood'),
('DUNE', 'Spice must flow', 'Hollywood');

NOTIFY pgrst, 'reload schema';
COMMIT;
