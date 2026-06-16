import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { donor_id } = body;
    
    if (!donor_id) {
      return NextResponse.json({ error: "Donor ID is required" }, { status: 400 });
    }

    await run("INSERT INTO donations (donor_id, donation_date) VALUES (?, date('now'))", [donor_id]);
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
