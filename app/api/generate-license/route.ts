import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: Request) {
  try {
    const { clinic_name, email, plan_code, max_devices } = await request.json();

    if (!clinic_name || !email || !plan_code) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a secure random raw license key
    const rawKey = `LIC-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Hash the license key for secure storage
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // Calculate expiration date based on plan
    const expiresAt = new Date();
    if (plan_code === 'demo') {
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days trial
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year annual
    }

    const client = await pool.connect();

    try {
      const query = `
        INSERT INTO public.licenses (clinic_name, email, license_key_hash, plan_code, max_devices, expires_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING id, created_at;
      `;

      const values = [
        clinic_name,
        email,
        keyHash,
        plan_code,
        max_devices || 2,
        expiresAt,
      ];

      const result = await client.query(query, values);

      return NextResponse.json({
        success: true,
        message: 'License generated successfully',
        license_key: rawKey, // Return the raw key ONLY once to the admin
        license_id: result.rows[0].id,
        expires_at: expiresAt,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error generating license:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}