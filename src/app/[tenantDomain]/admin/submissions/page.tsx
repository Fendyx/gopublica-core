'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Eye, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';

interface Submission {
  _id: string;
  fields: Record<string, any>;
  sourceSectionId?: {
    _id?: string;
    settings?: { title?: string };
    page?: string;
  };
  resumeUrl?: string;
  status?: 'new' | 'viewed' | 'processed' | 'archived';
  createdAt: string;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) router.push('/admin/login');
    else setToken(savedToken);
  }, [router]);

  const fetchSubmissions = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/forms/submissions?page=${page}&limit=10`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 403) { router.push('/admin'); return; }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setSubmissions(data.data);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, [token, page]);

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pl-PL', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const getFormName = (s: Submission) => {
    return s.sourceSectionId?.settings?.title || s.sourceSectionId?.page || '—';
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Ładowanie...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Zgłoszenia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista zgłoszeń</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FileText className="mx-auto mb-2" size={32} />
              Brak zgłoszeń
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Źródło</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>{formatDate(s.createdAt)}</TableCell>
                    <TableCell>{getFormName(s)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog
                        open={selected?._id === s._id}
                        onOpenChange={(open) => {
                          if (!open) setSelected(null);
                          else setSelected(s);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye size={16} className="mr-1" />
                            Podgląd
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Zgłoszenie</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                            {s.sourceSectionId?.settings?.title && (
                              <div className="text-sm">
                                <span className="font-medium">Źródło: </span>
                                {s.sourceSectionId.settings.title}
                              </div>
                            )}
                            {s.createdAt && (
                              <div className="text-sm">
                                <span className="font-medium">Data: </span>
                                {formatDate(s.createdAt)}
                              </div>
                            )}
                            {Object.entries(s.fields || {}).map(([key, value]) => (
                              <div key={key} className="text-sm border-b pb-1">
                                <span className="font-medium">{key}: </span>
                                {value == null ? '—' : String(value)}
                              </div>
                            ))}
                            {s.resumeUrl && (
                              <div className="pt-2">
                                <a
                                  href={s.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-blue-600 hover:underline"
                                >
                                  <Download size={14} className="mr-1" />
                                  Pobierz załącznik
                                </a>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} className="mr-1" />
            Wstecz
          </Button>
          <span className="text-sm text-gray-500">
            Strona {page} z {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Dalej
            <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}