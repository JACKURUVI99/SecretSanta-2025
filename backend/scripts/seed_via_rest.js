import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfbywlyxypchqljzjdmc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmYnl3bHl4eXBjaHFsanpqZG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDA1NjIsImV4cCI6MjA4MDg3NjU2Mn0.TH-34fM1lO6OQA3nuRBJwh2cTMgbke8FQhDd566oeB8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ALL_WORDS = [
    // KOLLYWOOD
    { word: 'VIKRAM', hint: 'Ghost and Agent', category: 'Kollywood' },
    { word: 'LEO', hint: 'Bloody Sweet', category: 'Kollywood' },
    { word: 'JAILER', hint: 'Tiger Ka Hukum', category: 'Kollywood' },
    { word: 'MASTER', hint: 'JD vs Bhavani', category: 'Kollywood' },
    { word: 'KAITHI', hint: 'Biryani and Gatling Gun', category: 'Kollywood' },
    { word: 'THUPPAKKI', hint: 'Jagdish in Mumbai', category: 'Kollywood' },
    { word: 'MANKATHA', hint: 'Vinayak Mahadev Money Heist', category: 'Kollywood' },
    { word: 'ANNIYAN', hint: 'Multiple personality vigilante', category: 'Kollywood' },
    { word: 'ENTHIRAN', hint: 'Chitti the Robot', category: 'Kollywood' },
    { word: 'CHANDRAMUKHI', hint: 'Laka Laka Laka', category: 'Kollywood' },
    { word: 'GILLI', hint: 'Kabaddi Kabaddi', category: 'Kollywood' },
    { word: 'PADAYAPPA', hint: 'Neelambari vs Rajini', category: 'Kollywood' },
    { word: 'BAASHA', hint: 'Auto driver don', category: 'Kollywood' },
    { word: 'SIVAJI', hint: 'Black money to white', category: 'Kollywood' },
    { word: 'MERSAL', hint: 'Three vijays', category: 'Kollywood' },
    { word: 'BIGIL', hint: 'Women football coach', category: 'Kollywood' },
    { word: 'VARISU', hint: 'The returns of the son', category: 'Kollywood' },
    { word: 'THUNIVU', hint: 'Bank Heist in Chennai', category: 'Kollywood' },
    { word: 'KANTARA', hint: 'Divine scream', category: 'Kollywood' },
    { word: 'KGF', hint: 'Salaam Rocky Bhai', category: 'Kollywood' },

    // TOLLYWOOD
    { word: 'BAAHUBALI', hint: 'Why did Katappa kill him?', category: 'Tollywood' },
    { word: 'RRR', hint: 'Fire and Water friendship', category: 'Tollywood' },
    { word: 'PUSHPA', hint: 'Thaggedhe Le', category: 'Tollywood' },
    { word: 'MAGADHEERA', hint: 'Reincarnation love story', category: 'Tollywood' },
    { word: 'ARJUN REDDY', hint: 'Intense medical student', category: 'Tollywood' },
    { word: 'EEGA', hint: 'Reborn as a housefly', category: 'Tollywood' },
    { word: 'RANGASTHALAM', hint: 'Sound Engineer in village', category: 'Tollywood' },
    { word: 'ALA VAIKUNTHAPURRAMULOO', hint: 'Boardroom dance fight', category: 'Tollywood' },
    { word: 'MAHANATI', hint: 'Savitri biopic', category: 'Tollywood' },
    { word: 'JERSEY', hint: 'Cricket comeback at 36', category: 'Tollywood' },
    { word: 'SALAAR', hint: 'Ceasefire', category: 'Tollywood' },
    { word: 'DEVARA', hint: 'Fear is the only emotion', category: 'Tollywood' },
    { word: 'KALKI', hint: 'Future meets Mythology', category: 'Tollywood' },
    { word: 'HANUMAN', hint: 'Superhero of Anjanadri', category: 'Tollywood' },
    { word: 'GUNTUR KAARAM', hint: 'Spicy mass masala', category: 'Tollywood' },

    // MOLLYWOOD
    { word: 'DRISHYAM', hint: 'Georgekutty and his family', category: 'Mollywood' },
    { word: 'PREMAM', hint: 'Three stages of love', category: 'Mollywood' },
    { word: 'LUCIFER', hint: 'Stephen Nedumpally', category: 'Mollywood' },
    { word: 'BANGALORE DAYS', hint: 'Cousins trip', category: 'Mollywood' },
    { word: 'MANICHITRATHAZHU', hint: 'Nagavalli is watching', category: 'Mollywood' },
    { word: 'KUMBALANGI NIGHTS', hint: 'Shammi is the hero', category: 'Mollywood' },
    { word: 'MINNAL MURALI', hint: 'Local superhero', category: 'Mollywood' },
    { word: 'RDX', hint: 'Karate action', category: 'Mollywood' },
    { word: 'KANNUR SQUAD', hint: 'Police investigation across states', category: 'Mollywood' },
    { word: 'BRAMAYUGAM', hint: 'Black and white horror', category: 'Mollywood' },

    // BOLLYWOOD
    { word: 'SHOLAY', hint: 'Kitne aadmi the', category: 'Bollywood' },
    { word: 'DDLJ', hint: 'Palat Palat Palat', category: 'Bollywood' },
    { word: '3 IDIOTS', hint: 'All is Well', category: 'Bollywood' },
    { word: 'DANGAL', hint: 'Wrestling sisters', category: 'Bollywood' },
    { word: 'LAGAAN', hint: 'Cricket match taxes', category: 'Bollywood' },
    { word: 'PK', hint: 'Wrong number', category: 'Bollywood' },
    { word: 'WAR', hint: 'Hrithik vs Tiger', category: 'Bollywood' },
    { word: 'PATHAAN', hint: 'Spy universe begins', category: 'Bollywood' },
    { word: 'JAWAN', hint: 'Bald SRK metro hijack', category: 'Bollywood' },
    { word: 'ANIMAL', hint: 'Papa meri jaan', category: 'Bollywood' },

    // HOLLYWOOD
    { word: 'AVENGERS', hint: 'Earths Mightiest Heroes', category: 'Hollywood' },
    { word: 'TITANIC', hint: 'Near, far, wherever you are', category: 'Hollywood' },
    { word: 'INCEPTION', hint: 'Dreams within dreams', category: 'Hollywood' },
    { word: 'JURASSIC PARK', hint: 'Dinosaurs rule the earth', category: 'Hollywood' },
    { word: 'THE MATRIX', hint: 'Red pill or blue pill', category: 'Hollywood' },
    { word: 'AVATAR', hint: 'Blue people on Pandora', category: 'Hollywood' },
    { word: 'DARK KNIGHT', hint: 'Why so serious', category: 'Hollywood' },
    { word: 'INTERSTELLAR', hint: 'Love transcends dimensions', category: 'Hollywood' },
    { word: 'OPPENHEIMER', hint: 'Now I am become Death', category: 'Hollywood' },
    { word: 'BARBIE', hint: 'Hi Barbie!', category: 'Hollywood' }
];

async function seed() {
    console.log('Seeding Database via REST...');

    // 1. Try to delete user_word_progress (might fail if RLS)
    const { error: delProgError } = await supabase.from('user_word_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delProgError) console.log('Warn: Could not clear progress:', delProgError.message);
    else console.log('Cleared user_word_progress');

    // 2. Insert Words (upsert to avoid duplicates, or just insert)
    // We can't delete all from word_bank easily without Admin, but we can try UPSERT

    // Let's just UPSERT based on 'word' if it's unique? or just insert and ignore conflicts.
    // Ideally we want to ensure these exist.

    const { error: insertError } = await supabase.from('word_bank').upsert(ALL_WORDS, { onConflict: 'word', ignoreDuplicates: true });

    if (insertError) {
        console.error('Error seeding words:', insertError.message);
    } else {
        console.log('Successfully seeded words!');
    }
}

seed();
