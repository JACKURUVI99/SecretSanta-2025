import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyFixes() {
    // Connection string from apply_migration.js
    const connectionString = 'postgres://postgres:0804@db.cfbywlyxypchqljzjdmc.supabase.co:5432/postgres';

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully. Executing fixes...');

        // 1. Fix Bonus Task Logic & Seed Kollywood (First attempt)
        const fixPath = path.join(__dirname, '../database/FIX_KOLLYWOOD_AND_BONUS.sql');
        console.log(`Reading ${fixPath}...`);
        const fixSql = fs.readFileSync(fixPath, 'utf8');
        await client.query(fixSql);
        console.log('FIX_KOLLYWOOD_AND_BONUS.sql executed successfully.');

        // 2. Full Reseed (Just to be sure about all categories)
        const reseedPath = path.join(__dirname, '../database/RESEED_ALL_WORDS.sql');
        console.log(`Reading ${reseedPath}...`);
        const reseedSql = fs.readFileSync(reseedPath, 'utf8');
        await client.query(reseedSql);
        console.log('RESEED_ALL_WORDS.sql executed successfully.');

        console.log(' ALL DATABASE FIXES APPLIED!');

    } catch (err) {
        console.error(' Execution failed:', err.message);
    } finally {
        await client.end();
    }
}

applyFixes();
