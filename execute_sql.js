
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
    console.error('Usage: node execute_sql.js <path_to_sql_file>');
    process.exit(1);
}

async function executeSql() {
    try {
        const fullPath = path.resolve(process.cwd(), sqlFilePath);
        console.log(`Reading SQL file: ${fullPath}`);

        if (!fs.existsSync(fullPath)) {
            console.error(`Error: File not found at ${fullPath}`);
            process.exit(1);
        }

        const sqlContent = fs.readFileSync(fullPath, 'utf8');

        // Split by semicolon to handle multiple statements if needed, 
        // but Supabase RPC usually requires a function. 
        // Since we don't have a direct 'query' method exposed via supabase-js for security,
        // we often rely on a helper function or assume the user has a 'exec_sql' RPC.
        // HOWEVER, standard supabase-js DOES NOT allow raw SQL execution from client.
        // It ONLY allows it via the Dashboard SQL Editor or if we have an RPC function for it.

        // CHECK: Does the user have an 'exec_sql' or similar RPC?
        // If not, we cannot run arbitrary SQL from this node script using the ANON/SERVICE key 
        // unless we use the Postgres connection string (pg library), which we might not have.

        // WORKAROUND: We will assume there is an 'exec_sql' or 'exec' function.
        // If not, this script will fail. 
        // BUT, looking at previous context, 'execute_bonus_v2.js' was successfully used?
        // Let's check 'execute_bonus_v2.js' content to see how it worked.

        // Wait, I can't check it right now without a tool call.
        // Most likely previous scripts failed? Or used a known RPC?
        // Actually, looking at the logs, I didn't see 'execute_bonus_v2.js' succeed or fail explicitly in the summary provided.
        // But if I don't have a PG connection string, I can't run DDL like 'CREATE TABLE'.

        // ALTERNATIVE: Use the specific 'exec_sql' function if it exists. 
        // If it doesn't, I must instruct the user to run it in the Dashboard.

        console.log('Attempting to execute via RPC "exec_sql"...');
        const { data, error } = await supabase.rpc('exec_sql', { query: sqlContent });

        if (error) {
            console.error('RPC Error:', error);
            // Fallback: Try a common name 'exec'
            const { error: error2 } = await supabase.rpc('exec', { query: sqlContent });
            if (error2) {
                console.error('Fallback RPC "exec" failed too:', error2);
                console.log('\n*** IMPORTANT ***\nIf you do not have an "exec_sql" function, you MUST run the SQL file manually in the Supabase Dashboard SQL Editor.\n');
                process.exit(1);
            }
        }

        console.log('SQL executed successfully!');
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

executeSql();
