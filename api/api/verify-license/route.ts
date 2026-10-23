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
    const { license_key, hardware_id } = await request.json();

    if (!license_key || !hardware_id) {
      return NextResponse.json(
        { success: false, message: 'License key and hardware ID are required' },
        { status: 400 }
      );
    }

    // Hash license key to match stored hash in database
    const keyHash = crypto.createHash('sha256').update(license_key).digest('hex');

    const client = await pool.connect();

    try {
      // 1. Check if license exists
      const licenseResult = await client.query(
        `SELECT * FROM public.licenses WHERE license_key_hash = $1`,
        [keyHash]
      );

      if (licenseResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid license key' },
          { status: 404 }
        );
      }

      const license = licenseResult.rows[0];

      // 2. Check license status and expiration date
      if (license.status !== 'active') {
        return NextResponse.json(
          { success: false, message: `License is not active, status: ${license.status}` },
          { status: 403 }
        );
      }

      if (license.expires_at && new Date(license.expires_at) < new Date()) {
        return NextResponse.json(
          { success: false, message: 'This license has expired' },
          { status: 403 }
        );
      }

      // 3. Manage associated devices
      const devicesResult = await client.query(
        `SELECT * FROM public.devices WHERE license_id = $1`,
        [license.id]
      );

      const registeredDevices = devicesResult.rows;
      const deviceExists = registeredDevices.find((d: any) => d.hardware_id === hardware_id);

      if (!deviceExists) {
        if (registeredDevices.length >= license.max_devices) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Maximum allowed devices limit reached for this license' 
            },
            { status: 403 }
          );
        }

        // Register new device automatically
        await client.query(
          `INSERT INTO public.devices (license_id, hardware_id, device_name) VALUES ($1, $2, $3)`,
          [license.id, hardware_id, 'Clinic PC']
        );
      } else {
        // Update device last seen timestamp
        await client.query(
          `UPDATE public.devices SET last_seen_at = NOW() WHERE id = $1`,
          [deviceExists.id]
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'License verified successfully',
        clinic_name: license.clinic_name,
        expires_at: license.expires_at
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('License verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}