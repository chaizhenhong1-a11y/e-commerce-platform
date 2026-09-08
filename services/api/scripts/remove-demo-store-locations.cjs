require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is missing.');

const client = new Client({ connectionString });

async function main() {
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM "StoreLocation"
       WHERE "id" IN ('demo-location-kl','demo-location-pj','demo-location-subang','demo-location-jb')`,
    );
    const next = await client.query(
      `SELECT "id" FROM "StoreLocation"
       WHERE "isActive" = true
       ORDER BY "sortOrder" ASC, "createdAt" ASC
       LIMIT 1`,
    );
    if (next.rows[0]) {
      await client.query(
        `UPDATE "StoreLocation" SET "isPrimary" = ("id" = $1), "updatedAt" = NOW()`,
        [next.rows[0].id],
      );
    }
    await client.query('COMMIT');
    console.log('Demo locations removed.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
