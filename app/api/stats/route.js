import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const totalDonorsResult = await query("SELECT COUNT(*) as count FROM donors");
    const totalDonationsResult = await query("SELECT COUNT(*) as count FROM donations");
    const todayDonationsResult = await query("SELECT COUNT(*) as count FROM donations WHERE donation_date = date('now')");
    
    const eligibleCountResult = await query(`
      SELECT COUNT(*) as count FROM donors d
      WHERE d.donor_id NOT IN (
          SELECT donor_id FROM donations
          WHERE donation_date > date('now', '-90 days')
      )
    `);

    return NextResponse.json({
      totalDonors: totalDonorsResult[0].count,
      totalDonations: totalDonationsResult[0].count,
      todayDonations: todayDonationsResult[0].count,
      eligibleCount: eligibleCountResult[0].count
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
