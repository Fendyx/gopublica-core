'use client';

import { useParams } from 'next/navigation';
import AnalyticsDashboard from '@/features/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  const params = useParams();
  const tenantDomain = params?.tenantDomain as string; // например, "myrestaurant.localhost"

  // tenantDomain используем как tenantId (или получим через контекст, если есть)
  return <AnalyticsDashboard tenantId={tenantDomain} />;
}