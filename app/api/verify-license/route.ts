import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { licenseKey, hardwareId } = body;

    if (!licenseKey || !hardwareId) {
      return NextResponse.json(
        { valid: false, message: 'License key and hardware ID are required' },
        { status: 400 }
      );
    }

    // 1. Query the license from database
    const licenseQuery = 'SELECT * FROM licenses WHERE license_key = $1';
    const licenseResult = await pool.query(licenseQuery, [licenseKey]);

    if (licenseResult.rows.length === 0) {
      return NextResponse.json(
        { valid: false, message: 'Invalid license key' },
        { status: 404 }
      );
    }

    const license = licenseResult.rows[0];

    // 2. Check if license status is active
    if (license.status !== 'active') {
      return NextResponse.json(
        { valid: false, message: 'License is suspended or inactive' },
        { status: 403 }
      );
    }

    // 3. Check expiration date
    const expiresAt = new Date(license.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, message: 'License has expired' },
        { status: 403 }
      );
    }

    // 4. Check device registration in 'devices' table
    const deviceQuery = 'SELECT * FROM devices WHERE license_id = $1 AND hardware_id = $2';
    const deviceResult = await pool.query(deviceQuery, [license.id, hardwareId]);

    if (deviceResult.rows.length > 0) {
      // Device already registered and valid
      return NextResponse.json({
        valid: true,
        message: 'License verified successfully',
        clinicName: license.clinic_name,
        expiresAt: license.expires_at,
      });
    }

    // 5. If device not registered, check max devices limit
    const countQuery = 'SELECT COUNT(*) FROM devices WHERE license_id = $1';
    const countResult = await pool.query(countQuery, [license.id]);
    const registeredCount = parseInt(countResult.rows[0].count, 10);

    if (registeredCount >= license.max_devices) {
      return NextResponse.json(
        { valid: false, message: 'Maximum allowed devices limit reached for this license' },
        { status: 403 }
      );
    }

    // 6. Register the new device automatically
    const insertDeviceQuery = 'INSERT INTO devices (license_id, hardware_id) VALUES ($1, $2)';
    await pool.query(insertDeviceQuery, [license.id, hardwareId]);

    return NextResponse.json({
      valid: true,
      message: 'Device activated and license verified successfully',
      clinicName: license.clinic_name,
      expiresAt: license.expires_at,
    });

  } catch (error: any) {
    console.error('Error verifying license:', error);
    return NextResponse.json(
      { valid: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
