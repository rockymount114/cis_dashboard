import { NextResponse } from 'next/server';
import { getKpiData } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const kpiData = await getKpiData(startDate && endDate ? { startDate, endDate } : undefined);
    return NextResponse.json(kpiData);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Error fetching KPI data' }, { status: 500 });
  }
}
