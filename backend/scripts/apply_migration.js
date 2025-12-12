import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function applyMigration() {
    // Use the connection string with the provided password
    // Note: 0804 seems very weak, but we use what is given.
    const connectionString = 'postgres://postgres:0804@db.cfbywlyxypchqljzjdmc.supabase.co:5432/postgres';
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL
    });
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully.');
        const migrationPath = path.join(__dirname, '../supabase/migrations/20251209142038_create_secret_santa_schema.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log('Applying migration...');
        await client.query(sql);
        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Migration failed:', err.message);
        if (err.message.includes('authentication failed')) {
            console.error('Possibility: Password "0804" might be incorrect.');
        }
    } finally {
        await client.end();
    }
}
applyMigration();
