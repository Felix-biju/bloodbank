import { NextResponse } from 'next/server';
import { query, run } from '@/lib/db';

export async function GET() {
  try {
    const donors = await query(`
      SELECT 
        d.donor_id,
        d.name,
        d.age,
        d.gender,
        d.blood_group,
        d.phone,
        d.address,
        d.created_at,
        MAX(dt.donation_date) AS last_donation,
        COUNT(dt.donation_id) AS total_donations,
        CAST(julianday('now') - julianday(MAX(dt.donation_date)) AS INTEGER) AS days_since,
        CASE
            WHEN MAX(dt.donation_date) IS NULL THEN 1
            WHEN CAST(julianday('now') - julianday(MAX(dt.donation_date)) AS INTEGER) >= 90 THEN 1
            ELSE 0
        END AS eligible
      FROM donors d
      LEFT JOIN donations dt ON d.donor_id = dt.donor_id
      GROUP BY d.donor_id
      ORDER BY d.created_at DESC
    `);
    return NextResponse.json(donors);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, age, gender, blood_group, phone, address } = body;
    
    await run(
      "INSERT INTO donors (name, age, gender, blood_group, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
      [name, age, gender, blood_group, phone, address]
    );
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: "Phone number already registered." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
