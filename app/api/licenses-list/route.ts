import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM licenses ORDER BY created_at DESC');
    return NextResponse.json({
      success: true,
      licenses: result.rows,
    });
  } catch (error: any)يف {
    console.error('Error fetching licenses list:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
