import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clinicName, email, customerPhone, planCode, maxDevices, amount, paymentStatus } = body;

    if (!clinicName || !email) {
      return NextResponse.json(
        { success: false, message: 'Clinic name and email are required' },
        { status: 400 }
      );
    }

    // Generate a secure unique license key
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const licenseKey = `LIC-${randomHex}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Calculate expiration date based on plan
    const expiresAt = new Date();
    if (planCode === 'Monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (planCode === 'Annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 100); // Lifetime
    }

    const query = `
      INSERT INTO licenses (
        license_key, 
        clinic_name, 
        email, 
        customer_phone, 
        plan_code, 
        max_devices, 
        amount, 
        payment_status, 
        status, 
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9)
      RETURNING *;
    `;

    const values = [
      licenseKey,
      clinicName,
      email,
      customerPhone || null,
      planCode || 'Annual',
      maxDevices || 1,
      amount || 0,
      paymentStatus || 'paid',
      expiresAt.toISOString(),
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      message: 'License generated and saved successfully',
      licenseKey: licenseKey,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error generating license:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
