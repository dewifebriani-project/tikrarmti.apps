require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT conname, pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            JOIN pg_class t ON c.conrelid = t.oid 
            WHERE t.relname = 'jurnal_records' 
            AND c.contype = 'c';
        `);
        console.log('CONSTRAINTS:');
        res.rows.forEach(r => {
            console.log(`- ${r.conname}: ${r.pg_get_constraintdef}`);
        });

        const res2 = await client.query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'jurnal_records';
        `);
        console.log('\nCOLUMNS:');
        res2.rows.forEach(r => {
            console.log(`- ${r.column_name}: ${r.data_type} (${r.udt_name})`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
