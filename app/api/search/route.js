import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const blood_group = searchParams.get('blood_group');

    if (!blood_group) {
      return NextResponse.json({ error: "Blood group parameter is required" }, { status: 400 });
    }

    const results = await query(`
      SELECT 
          d.donor_id,
          d.name,
          d.age,
          d.gender,
          d.address,
          MAX(dt.donation_date) AS last_donation,
          CAST(julianday('now') - julianday(MAX(dt.donation_date)) AS INTEGER) AS days_since
      FROM donors d
      LEFT JOIN donations dt ON dt.donor_id = d.donor_id
      WHERE d.blood_group = ?
      GROUP BY d.donor_id
      ORDER BY
          CASE WHEN MAX(dt.donation_date) IS NULL THEN 0
               WHEN CAST(julianday('now') - julianday(MAX(dt.donation_date)) AS INTEGER) >= 90 THEN 1
               ELSE 2 END,
          d.name
    `, [blood_group]);
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
