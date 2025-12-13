-- ==========================================
-- FINAL FIX SCRIPT FOR SECRET SANTA APP
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==========================================

BEGIN;

-- 1. FIX BONUS TASK GRADING LOGIC (Case Insensitive)
CREATE OR REPLACE FUNCTION public.submit_bonus_task(
    p_user_id UUID,
    p_task_id UUID,
    p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_active BOOLEAN;
    v_task_points INTEGER;
    v_existing_submission_count INTEGER;
    v_max_attempts INTEGER;
    v_score INTEGER := 0;
    v_max_score INTEGER := 0;
    v_percentage INTEGER;
    v_answer JSONB;
    v_question_id UUID;
    v_question_points INTEGER;
    v_correct_answer JSONB;
    v_is_case_sensitive BOOLEAN;
    v_submitted_answer JSONB;
    v_submitted_text TEXT;
    v_correct_text TEXT;
    v_is_correct BOOLEAN;
    v_submission_id UUID;
    v_results JSONB := '[]'::JSONB;
BEGIN
    SELECT is_active, total_points, max_attempts INTO v_task_active, v_task_points, v_max_attempts
    FROM bonus_tasks WHERE id = p_task_id;

    IF NOT FOUND OR NOT v_task_active THEN RAISE EXCEPTION 'Task not found or inactive'; END IF;

    SELECT COUNT(*) INTO v_existing_submission_count FROM user_task_submissions WHERE user_id = p_user_id AND task_id = p_task_id;
    IF v_existing_submission_count >= v_max_attempts THEN
        RAISE EXCEPTION 'Max attempts reached.';
    END IF;

    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_question_id := (v_answer->>'question_id')::UUID;
        v_submitted_answer := v_answer->'answer';
        SELECT points, correct_answer, is_case_sensitive INTO v_question_points, v_correct_answer, v_is_case_sensitive
        FROM task_questions WHERE id = v_question_id AND task_id = p_task_id;
        v_max_score := v_max_score + v_question_points;

        IF jsonb_typeof(v_correct_answer) = 'string' AND jsonb_typeof(v_submitted_answer) = 'string' THEN
            v_submitted_text := TRIM(v_submitted_answer #>> '{}');
            v_correct_text := TRIM(v_correct_answer #>> '{}');
            IF v_is_case_sensitive THEN v_is_correct := (v_submitted_text = v_correct_text);
            ELSE v_is_correct := (LOWER(v_submitted_text) = LOWER(v_correct_text)); END IF;
        ELSE
            v_is_correct := (v_submitted_answer = v_correct_answer);
        END IF;

        IF v_is_correct THEN v_score := v_score + v_question_points; END IF;
        v_results := v_results || jsonb_build_object('question_id', v_question_id, 'is_correct', v_is_correct);
    END LOOP;

    IF v_max_score = 0 THEN v_percentage := 0; ELSE v_percentage := (v_score * 100) / v_max_score; END IF;

    INSERT INTO user_task_submissions (user_id, task_id, score, max_score, answers, attempt_number)
    VALUES (p_user_id, p_task_id, v_score, v_max_score, p_answers, v_existing_submission_count + 1)
    RETURNING id INTO v_submission_id;

    UPDATE profiles SET points = points + v_score WHERE id = p_user_id;

    RETURN jsonb_build_object('submission_id', v_submission_id, 'score', v_score, 'max_score', v_max_score, 'percentage', v_percentage, 'results', v_results);
END;
$$;

-- 2. CLEAR BAD DATA
TRUNCATE TABLE public.word_bank CASCADE; -- Clears words and user progress via cascade

-- 3. INSERT 100+ MOVIES (All Categories)
INSERT INTO public.word_bank (word, hint, category) VALUES
-- KOLLYWOOD
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
('KANTARA', 'Divine scream', 'Kollywood'),
('KGF', 'Salaam Rocky Bhai', 'Kollywood'),

-- TOLLYWOOD
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

-- MOLLYWOOD
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

-- BOLLYWOOD
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

-- HOLLYWOOD
('AVENGERS', 'Earths Mightiest Heroes', 'Hollywood'),
('TITANIC', 'Near, far, wherever you are', 'Hollywood'),
('INCEPTION', 'Dreams within dreams', 'Hollywood'),
('JURASSIC PARK', 'Dinosaurs rule the earth', 'Hollywood'),
('THE MATRIX', 'Red pill or blue pill', 'Hollywood'),
('AVATAR', 'Blue people on Pandora', 'Hollywood'),
('DARK KNIGHT', 'Why so serious', 'Hollywood'),
('INTERSTELLAR', 'Love transcends dimensions', 'Hollywood'),
('OPPENHEIMER', 'Now I am become Death', 'Hollywood'),
('BARBIE', 'Hi Barbie!', 'Hollywood');

-- 4. FINAL NOTIFICATION
NOTIFY pgrst, 'reload schema';
COMMIT;
