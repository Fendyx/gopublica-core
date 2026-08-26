'use client';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Users } from 'lucide-react';
import type { CustomerSummary } from '@/entities/customer/types';
import { getCustomers } from '@/entities/customer/api';
import CustomerDetailsSheet from './CustomerDetailsSheet';

export default function CustomersPageContent() {
  const t = useTranslations('admin.customersPage');
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Store only the ID; the customer object is derived from `customers`,
  // so a list re-fetch automatically updates the open sheet.
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const selectedCustomer = customers.find((c) => c._id === selectedCustomerId) ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getCustomers();
      if (!cancelled) {
        setCustomers(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Client-side text filter across name / phone / email. */
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.email ?? ''].some((field) => field.toLowerCase().includes(q))
    );
  }, [customers, search]);

  if (loading) return <div className="text-center py-16 text-muted-foreground">{t('loading')}</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{t('subtitle', { count: customers.length })}</p>
        </div>

        {/* Client-side search across name / phone / email */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-9"
          />
        </div>
      </div>

      {customers.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg">{t('empty')}</p>
          </CardContent>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg">{t('noResults')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.customer')}</TableHead>
                  <TableHead className="text-right">{t('table.orders')}</TableHead>
                  <TableHead className="text-right">{t('table.totalSpent')}</TableHead>
                  <TableHead>{t('table.lastOrder')}</TableHead>
                  <TableHead>{t('table.registered')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer._id}
                    onClick={() => setSelectedCustomerId(customer._id)}
                    className="group hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    {/* CUSTOMER COLUMN */}
                    <TableCell className="align-top">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">{customer.phone}</div>
                    </TableCell>

                    {/* ORDERS COUNT COLUMN */}
                    <TableCell className="align-top text-right tabular-nums">
                      {customer.orderCount || 0}
                    </TableCell>

                    {/* TOTAL SPENT COLUMN */}
                    <TableCell className="align-top text-right">
                      <div className="font-bold text-base text-gray-900 tabular-nums">
                        {(customer.totalSpent || 0).toFixed(2)}
                        {customer.currency ? ` ${customer.currency.toUpperCase()}` : ''}
                      </div>
                    </TableCell>

                    {/* LAST ORDER COLUMN */}
                    <TableCell className="align-top">
                      {customer.lastOrderAt ? (
                        new Date(customer.lastOrderAt).toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* REGISTERED COLUMN */}
                    <TableCell className="align-top">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Details drawer */}
      <CustomerDetailsSheet
        customer={selectedCustomer}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
}
