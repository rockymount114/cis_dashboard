import { NextResponse } from 'next/server';
import { getChartData } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ message: 'Missing startDate or endDate' }, { status: 400 });
  }

  try {
    const chartData = await getChartData({ startDate, endDate });
    return NextResponse.json(chartData);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Error fetching chart data' }, { status: 500 });
  }
}
