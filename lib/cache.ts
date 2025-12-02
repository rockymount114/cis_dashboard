import { deleteCache, clearCache } from './redis';

// Cache helper functions for managing cached data

export async function invalidateKpiData() {
  console.log('Invalidating KPI data cache');
  await clearCache('kpi_data_*');
}

export async function invalidateChartData() {
  console.log('Invalidating chart data cache');
  await clearCache('chart_data_*');
}

export async function invalidateAllData() {
  console.log('Invalidating all data cache');
  await clearCache('*_data_*');
}

export async function invalidateByDateRange(startDate: string, endDate: string) {
  console.log(`Invalidating cache for date range: ${startDate} to ${endDate}`);
  await deleteCache(`kpi_data_${startDate}_${endDate}`);
  await deleteCache(`chart_data_${startDate}_${endDate}`);
}