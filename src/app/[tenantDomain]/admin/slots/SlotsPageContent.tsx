'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTenant } from '@/entities/tenant/TenantContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays,
  Clock,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  MapPin,
  UserPlus,
  Eye,
  Phone,
} from 'lucide-react';
import {
  getAdminSlots,
  generateAdminSlots,
  getSlotBookings,
  addManualBooking,
  removeBooking,
  updateBookingStatus,
} from '@/entities/slot-booking/api';
import type { BookingSlot, SlotBooking } from '@/entities/slot-booking/types';
import { fetchBranchSections } from '@/entities/branch-section/api';
import type { BookingSettings } from '@/entities/branch-section/types';

const today = new Date().toISOString().split('T')[0];

export default function SlotsPageContent() {
  const t = useTranslations('admin.slotsPage');
  const tAdmin = useTranslations('admin');
  const { selectedBranch, loading: branchLoading } = useBranch();
  const { tenantId } = useTenant() || {};

  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Slot detail dialog
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [slotBookings, setSlotBookings] = useState<SlotBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Add manual booking dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', partySize: 1, comment: '' });
  const [addLoading, setAddLoading] = useState(false);

  // Generate dialog
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [genConfig, setGenConfig] = useState({
    slotStartTime: '09:00',
    slotEndTime: '22:00',
    slotIntervalMinutes: 60,
    slotCapacity: 10,
  });
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load slot config from the active BranchSection on mount
  useEffect(() => {
    if (!tenantId || !selectedBranch) return;
    fetchBranchSections(tenantId, selectedBranch._id, 'reservations')
      .then((sections) => {
        const bookingSection = sections.find(
          (s) => s.type === 'booking' && (s.settings as BookingSettings)?.bookingMode === 'slot_booking'
        );
        if (bookingSection) {
          const s = bookingSection.settings as BookingSettings;
          setGenConfig({
            slotStartTime: s.slotStartTime || '09:00',
            slotEndTime: s.slotEndTime || '22:00',
            slotIntervalMinutes: s.slotIntervalMinutes || 60,
            slotCapacity: s.slotCapacity || 10,
          });
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [tenantId, selectedBranch]);

  const fetchSlots = useCallback(async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const data = await getAdminSlots(selectedBranch._id, date);
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, date]);

  useEffect(() => {
    if (!branchLoading && selectedBranch) fetchSlots();
  }, [selectedBranch, branchLoading, date, fetchSlots]);

  const handleGenerateSlots = async () => {
    if (!selectedBranch) return;
    setGenerating(true);
    try {
      await generateAdminSlots(selectedBranch._id, date, genConfig);
      await fetchSlots();
      setGenDialogOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const openSlotDetail = async (slot: BookingSlot) => {
    setSelectedSlot(slot);
    setBookingsLoading(true);
    try {
      const data = await getSlotBookings(slot._id);
      setSlotBookings(data);
    } catch {
      setSlotBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleAddBooking = async () => {
    if (!selectedSlot) return;
    setAddLoading(true);
    try {
      await addManualBooking(selectedSlot._id, addForm);
      await openSlotDetail(selectedSlot);
      await fetchSlots();
      setAddDialogOpen(false);
      setAddForm({ name: '', phone: '', email: '', partySize: 1, comment: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveBooking = async (bookingId: string) => {
    if (!confirm(t('deleteBookingConfirm'))) return;
    try {
      await removeBooking(bookingId);
      if (selectedSlot) {
        await openSlotDetail(selectedSlot);
      }
      await fetchSlots();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (bookingId: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      await updateBookingStatus(bookingId, status);
      if (selectedSlot) {
        await openSlotDetail(selectedSlot);
      }
      await fetchSlots();
    } catch (err) {
      console.error(err);
    }
  };

  const formatSlotTime = (slot: BookingSlot) => `${slot.startTime} – ${slot.endTime}`;

  const getOccupancyPercent = (slot: BookingSlot) =>
    slot.capacity > 0 ? Math.round((slot.bookedCount / slot.capacity) * 100) : 0;

  const getOccupancyColor = (slot: BookingSlot) => {
    const pct = getOccupancyPercent(slot);
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const isPastSlot = (slot: BookingSlot) => {
    const slotDateTime = new Date(`${slot.date}T${slot.endTime}`);
    return slotDateTime < new Date();
  };

  if (branchLoading || loading) {
    return <div className="text-center py-16 text-muted-foreground">{tAdmin('loading')}</div>;
  }
  if (!selectedBranch) {
    return <div className="text-center py-16 text-muted-foreground">{tAdmin('selectBranchHint')}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6" />
            {t('title')}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <MapPin className="w-4 h-4" />
            <strong>{selectedBranch.name}</strong>
            {selectedBranch.city && `(${selectedBranch.city})`}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGenDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('generateSlots')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSlots}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slots Table */}
      {slots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t('noSlotsForDate')}</p>
            <Button onClick={() => setGenDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('generateSlots')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('time')}</TableHead>
                  <TableHead>{t('occupancy')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot) => {
                  const past = isPastSlot(slot);
                  const full = slot.remaining <= 0;
                  return (
                    <TableRow key={slot._id} className={past ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium tabular-nums">{formatSlotTime(slot)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="tabular-nums">
                              {slot.bookedCount} / {slot.capacity}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({slot.remaining} {t('remaining')})
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getOccupancyColor(slot)}`}
                              style={{ width: `${getOccupancyPercent(slot)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {full ? (
                          <Badge variant="destructive">{t('full')}</Badge>
                        ) : past ? (
                          <Badge variant="secondary">{t('past')}</Badge>
                        ) : (
                          <Badge variant="default">{t('available')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSlotDetail(slot)}
                          disabled={past}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t('viewBookings')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Slot Detail Dialog ── */}
      <Dialog open={!!selectedSlot} onOpenChange={(open) => { if (!open) setSelectedSlot(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {selectedSlot && `${selectedSlot.date} · ${formatSlotTime(selectedSlot)}`}
            </DialogTitle>
          </DialogHeader>

          {selectedSlot && (
            <>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  {selectedSlot.bookedCount} / {selectedSlot.capacity} {t('spotsFilled')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {t('addBooking')}
                </Button>
              </div>

              {bookingsLoading ? (
                <div className="py-8 text-center text-muted-foreground">{tAdmin('loading')}</div>
              ) : slotBookings.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">{t('noBookings')}</div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {slotBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{booking.name}</span>
                          <Badge
                            variant={
                              booking.status === 'confirmed'
                                ? 'default'
                                : booking.status === 'cancelled'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {booking.partySize}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {booking.phone}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {booking.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(booking._id, 'confirmed')}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {booking.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(booking._id, 'cancelled')}
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBooking(booking._id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add Manual Booking Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addBookingTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('name')}</Label>
                <Input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('phone')}</Label>
                <Input
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="+48 123 456 789"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('email')} ({t('optional')})</Label>
              <Input
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('partySize')}</Label>
              <Input
                type="number"
                min={1}
                value={addForm.partySize}
                onChange={(e) => setAddForm({ ...addForm, partySize: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('comment')} ({t('optional')})</Label>
              <Input
                value={addForm.comment}
                onChange={(e) => setAddForm({ ...addForm, comment: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>{t('cancel')}</Button>
            <Button
              onClick={handleAddBooking}
              disabled={!addForm.name || !addForm.phone || addLoading}
            >
              {addLoading ? tAdmin('loading') : t('addBooking')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generate Slots Dialog ── */}
      <Dialog open={genDialogOpen} onOpenChange={setGenDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('generateSlotsTitle')}</DialogTitle>
            {!configLoaded && (
              <p className="text-xs text-muted-foreground">{tAdmin('loading')}...</p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('slotStartTime')}</Label>
                <Input
                  type="time"
                  value={genConfig.slotStartTime}
                  onChange={(e) => setGenConfig({ ...genConfig, slotStartTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('slotEndTime')}</Label>
                <Input
                  type="time"
                  value={genConfig.slotEndTime}
                  onChange={(e) => setGenConfig({ ...genConfig, slotEndTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('slotInterval')}</Label>
                <Select
                  value={String(genConfig.slotIntervalMinutes)}
                  onValueChange={(val) => setGenConfig({ ...genConfig, slotIntervalMinutes: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">120 min</SelectItem>
                    <SelectItem value="180">180 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('slotCapacity')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={genConfig.slotCapacity}
                  onChange={(e) => setGenConfig({ ...genConfig, slotCapacity: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleGenerateSlots} disabled={generating}>
              {generating ? tAdmin('loading') : t('generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
