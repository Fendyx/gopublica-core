'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download } from 'lucide-react';

interface Application {
  _id: string;
  fields: Record<string, any>;
  status: 'new' | 'viewed' | 'invited' | 'rejected' | 'hired';
  comment: string;
  resumeUrl: string;
  createdAt: string;
}

export default function JobApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Подключаемся к уровню jobsPage
  const t = useTranslations('admin.jobsPage'); 
  
  const id = params.id as string;
  
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) {
      router.push('/admin/login');
    } else {
      setToken(savedToken);
    }
  }, [router]);

  useEffect(() => {
    if (!token || !id) return;
    const fetchApplication = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/jobs/applications/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setApplication(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [token, id]);

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      new: t('statusLabels.new'),
      viewed: t('statusLabels.viewed'),
      invited: t('statusLabels.invited'),
      rejected: t('statusLabels.rejected'),
      hired: t('statusLabels.hired'),
    };
    return statusMap[status] || status;
  };

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    new: 'default',
    viewed: 'secondary',
    invited: 'outline',
    rejected: 'destructive',
    hired: 'default',
  };

  // Обрати внимание: t('detail.loading')
  if (loading) return <div className="text-center py-10 font-medium text-gray-500">{t('detail.loading')}</div>;
  if (!application) return <div className="text-center py-10 font-medium text-red-500">{t('detail.notFound')}</div>;

  const fields = application.fields || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="shadow-sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> {t('detail.back')}
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('detail.title', { id: application._id.slice(-6) })}
          </h1>
          <Badge variant={statusColors[application.status] || 'default'} className="shadow-none text-sm px-2.5 py-0.5">
            {getStatusLabel(application.status)}
          </Badge>
        </div>
      </div>

      <Card className="shadow-sm border-gray-100">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-lg text-gray-800">{t('detail.candidateData')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(fields).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider w-full sm:w-1/3 mt-0.5">
                  {key}
                </span>
                <span className="text-sm font-medium text-gray-900 w-full sm:w-2/3 break-words">
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>
          
          <Separator className="my-2" />
          
          {application.resumeUrl && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">
                {t('detail.resume')}
              </span>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}${application.resumeUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm"
              >
                <Download className="w-4 h-4" /> {t('detail.download')}
              </a>
            </div>
          )}
          
          <div className="flex flex-col gap-1 p-3">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {t('detail.comment')}
            </span>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">
              {application.comment || <span className="text-gray-400 italic">{t('detail.noComment')}</span>}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-1 p-3">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">
              {t('detail.submittedAt')}
            </span>
            <p className="text-sm text-gray-900 font-medium">
              {new Date(application.createdAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}