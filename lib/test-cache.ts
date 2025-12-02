import { getKpiData, getChartData } from './db';
import { invalidateAllData } from './cache';

// Test function to demonstrate Redis caching
export async function testRedisCaching() {
  console.log('\n=== Testing Redis Caching Implementation ===\n');

  // Test data
  const testDateRange = {
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  };

  try {
    console.log('1. Testing KPI data caching...');
    console.time('First KPI call (should hit database)');
    const kpiData1 = await getKpiData(testDateRange);
    console.timeEnd('First KPI call (should hit database)');
    console.log('KPI Data retrieved:', kpiData1);

    console.time('Second KPI call (should hit cache)');
    const kpiData2 = await getKpiData(testDateRange);
    console.timeEnd('Second KPI call (should hit cache)');
    console.log('KPI Data retrieved (cached):', kpiData2);

    console.log('\n2. Testing Chart data caching...');
    console.time('First Chart call (should hit database)');
    const chartData1 = await getChartData(testDateRange);
    console.timeEnd('First Chart call (should hit database)');
    console.log('Chart Data retrieved:', chartData1);

    console.time('Second Chart call (should hit cache)');
    const chartData2 = await getChartData(testDateRange);
    console.timeEnd('Second Chart call (should hit cache)');
    console.log('Chart Data retrieved (cached):', chartData2);

    console.log('\n3. Testing cache invalidation...');
    console.log('Invalidating all cache...');
    await invalidateAllData();

    console.log('\n4. Testing after cache invalidation...');
    console.time('KPI call after invalidation (should hit database)');
    const kpiData3 = await getKpiData(testDateRange);
    console.timeEnd('KPI call after invalidation (should hit database)');

    console.log('\n=== Test completed successfully! ===');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run this test function to verify Redis caching is working
if (require.main === module) {
  testRedisCaching();
}