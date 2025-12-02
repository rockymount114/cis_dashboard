# Redis Caching Implementation Test Guide

I have successfully implemented Redis caching for your CIS Dashboard application. Here's how it works and how to test it:

## What Was Implemented

1. **Redis Connection (`lib/redis.ts`)**: Manages Redis connection using your provided URL
2. **Updated Database Functions (`lib/db.ts`)**: Added caching to `getKpiData()` and `getChartData()`
3. **Cache Management (`lib/cache.ts`)**: Utility functions for cache invalidation
4. **Test Script (`lib/test-cache.ts`)**: Comprehensive test to verify caching functionality

## How Redis Caching Works

### Cache Keys
- **KPI Data**: `kpi_data_{startDate}_{endDate}` or `kpi_data_all`
- **Chart Data**: `chart_data_{startDate}_{endDate}`
- **Cache TTL**: 5 minutes (300 seconds)

### API Routes Automatically Cached
- `/api/kpis` - KPI data endpoint
- `/api/kpis/billed-vs-collected` - Chart data endpoint

## Testing Steps

### 1. Environment Setup
Make sure your `.env.local` file includes:
```bash
CACHE_REDIS_URL=redis://:Ts4test%40@172.20.21.91:6379/1
# ... your existing DB config
```

### 2. Manual Testing in Browser
1. **First Load**: Open your dashboard and note the response time
2. **Check Browser Console**: Look for "Returning cached KPI data" messages
3. **Second Load**: The same date range should load much faster due to caching

### 3. Console Testing
Run the test script to verify Redis connectivity:
```bash
npx tsx lib/test-cache.ts
```

### 4. Monitor Redis CLI
Connect to Redis and monitor cache activity:
```bash
redis-cli -h 172.20.21.91 -p 6379 -a Ts4test@
MONITOR
```

## Expected Performance Improvements

- **Subsequent Requests**: Should be 90%+ faster (no DB queries)
- **Reduced DB Load**: SQL queries only execute when cache expires
- **Better User Experience**: Instant data loading for recent date ranges

## Cache Management Functions

Use these for manual cache invalidation:

```typescript
import { invalidateKpiData, invalidateChartData, invalidateAllData } from '@/lib/cache';

// Invalidate specific data types
await invalidateKpiData();      // Clear all KPI data cache
await invalidateChartData();    // Clear all chart data cache
await invalidateAllData();      // Clear everything
```

## Troubleshooting

1. **Redis Connection Failed**: Check network connectivity and credentials
2. **No Caching Messages**: Verify `CACHE_REDIS_URL` in environment
3. **Cache Not Working**: Ensure Redis is accessible from your application
4. **Slow Performance**: Check if queries are hitting the database in logs

## Cache Invalidation Strategy

The implementation uses a **time-based invalidation** approach:
- Data is cached for 5 minutes by default
- Cache keys include date ranges for granular control
- Manual invalidation available for urgent data refresh

This approach balances performance with data freshness for dashboard use cases.