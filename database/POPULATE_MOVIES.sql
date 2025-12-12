BEGIN;
INSERT INTO public.word_bank (word, category, hint) VALUES
('VIKRAM', 'kollywood', 'Kamal Haasan action thriller 2022'),
('BAASHA', 'kollywood', 'Rajinikanth iconic 1995 film'),
('ENTHIRAN', 'kollywood', 'Robot movie with Rajinikanth'),
('VADA CHENNAI', 'kollywood', 'Dhanush gangster saga'),
('SUPER DELUXE', 'kollywood', 'Vijay Sethupathi anthology'),
('JIGARTHANDA', 'kollywood', 'Filmmaker meets gangster'),
('ASURAN', 'kollywood', 'Dhanush revenge drama'),
('MASTER', 'kollywood', 'Vijay vs Vijay Sethupathi'),
('AYAN', 'kollywood', 'Suriya smuggling thriller'),
('THUPPAKKI', 'kollywood', 'Vijay army officer')
ON CONFLICT (word) DO NOTHING;
-- ================================================================
-- MOLLYWOOD (Malayalam Cinema)
-- ================================================================
INSERT INTO public.word_bank (word, category, hint) VALUES
('DRISHYAM', 'mollywood', 'Mohanlal perfect crime'),
('LUCIFER', 'mollywood', 'Mohanlal political thriller'),
('BANGALORE DAYS', 'mollywood', 'Three cousins in Bangalore'),
('PREMAM', 'mollywood', 'Nivin Pauly romance classic'),
('CHARLIE', 'mollywood', 'Dulquer free spirit'),
('MAHESHINTE PRATHIKAARAM', 'mollywood', 'Photographer revenge'),
('KUMBALANGI NIGHTS', 'mollywood', 'Four brothers drama'),
('JALLIKATTU', 'mollywood', 'Buffalo escape chaos'),
('ANDROID KUNJAPPAN', 'mollywood', 'Robot caretaker'),
('VIRUS', 'mollywood', 'Nipah outbreak thriller')
ON CONFLICT (word) DO NOTHING;
-- ================================================================
-- TOLLYWOOD (Telugu Cinema)
-- ================================================================
INSERT INTO public.word_bank (word, category, hint) VALUES
('BAAHUBALI', 'tollywood', 'Epic Prabhas fantasy'),
('RRR', 'tollywood', 'Ram Charan NTR period action'),
('PUSHPA', 'tollywood', 'Allu Arjun red sanders'),
('ARJUN REDDY', 'tollywood', 'Vijay Deverakonda intense romance'),
('EEGA', 'tollywood', 'Reincarnated as fly'),
('MAGADHEERA', 'tollywood', 'Ram Charan reincarnation'),
('ALA VAIKUNTHAPURRAMULOO', 'tollywood', 'Allu Arjun family drama'),
('JERSEY', 'tollywood', 'Nani cricket comeback'),
('FIDAA', 'tollywood', 'Varun Tej romance'),
('RANGASTHALAM', 'tollywood', 'Ram Charan village drama')
ON CONFLICT (word) DO NOTHING;
-- ================================================================
-- BOLLYWOOD (Hindi Cinema)
-- ================================================================
INSERT INTO public.word_bank (word, category, hint) VALUES
('DANGAL', 'bollywood', 'Aamir Khan wrestling'),
('THREE IDIOTS', 'bollywood', 'Engineering college comedy'),
('SHOLAY', 'bollywood', 'Classic Amitabh Dharmendra'),
('DILWALE DULHANIA LE JAYENGE', 'bollywood', 'SRK Kajol romance'),
('LAGAAN', 'bollywood', 'Cricket vs British'),
('GANGS OF WASSEYPUR', 'bollywood', 'Coal mafia saga'),
('ZINDAGI NA MILEGI DOBARA', 'bollywood', 'Three friends Spain'),
('ANDHADHUN', 'bollywood', 'Blind pianist thriller'),
('TAARE ZAMEEN PAR', 'bollywood', 'Dyslexic child story'),
('PK', 'bollywood', 'Aamir alien comedy')
ON CONFLICT (word) DO NOTHING;
-- ================================================================
-- HOLLYWOOD
-- ================================================================
INSERT INTO public.word_bank (word, category, hint) VALUES
('INCEPTION', 'hollywood', 'DiCaprio dream heist'),
('INTERSTELLAR', 'hollywood', 'Space time travel'),
('THE DARK KNIGHT', 'hollywood', 'Batman vs Joker'),
('PULP FICTION', 'hollywood', 'Tarantino crime classic'),
('THE SHAWSHANK REDEMPTION', 'hollywood', 'Prison escape drama'),
('FORREST GUMP', 'hollywood', 'Tom Hanks life journey'),
('THE MATRIX', 'hollywood', 'Keanu Reeves simulation'),
('FIGHT CLUB', 'hollywood', 'Brad Pitt underground'),
('GOODFELLAS', 'hollywood', 'Mafia life story'),
('THE GODFATHER', 'hollywood', 'Corleone family saga')
ON CONFLICT (word) DO NOTHING;
COMMIT;
SELECT category, COUNT(*) as movie_count
FROM public.word_bank
GROUP BY category
ORDER BY category;
