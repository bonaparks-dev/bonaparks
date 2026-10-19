import React from 'react';
import { Booking } from '../../types';
import { Page } from '../../App';
import { PageHeader, PageShell, Panel, Button, Badge } from '../ui';
import { useLanguage } from '../../i18n/LanguageContext';

interface ControlRoomPageProps {
  bookings: Booking[];
  onNavigate: (page: Page) => void;
}

const statusStyles: Record<Booking['status'], string> = {
  Active: 'border-gold/50 text-gold',
  Redeemed: 'border-line text-muted',
  Pending: 'border-bone/30 text-bone',
};

const ControlRoomPage: React.FC<ControlRoomPageProps> = ({ bookings, onNavigate }) => {
  const { t } = useLanguage();
  return (
  <PageShell>
    <PageHeader
      eyebrow={t.account.myAccount}
      title={t.account.myBookings}
      intro={
        bookings.length > 0
          ? t.bookings.intro
          : undefined
      }
    />

    {bookings.length > 0 ? (
      <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
        {bookings.map((booking) => {
          const demo = t.bookings.demo[booking.id];
          return (
          <Panel key={booking.id} hover className="p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl leading-tight text-bone">{demo?.title ?? booking.title}</h2>
              <Badge className={statusStyles[booking.status]}>{t.bookings.status[booking.status]}</Badge>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted">{demo?.description ?? booking.description}</p>

            <div className="mt-8 flex items-end justify-between border-t border-line pt-6">
              <div>
                <p className="text-[11px] uppercase tracking-widest2 text-muted">{t.bookings.acquired}</p>
                <p className="mt-1 text-sm text-bone">
                  {new Date(booking.lastUpdate).toLocaleDateString('en-GB')}
                </p>
              </div>
              <Button variant="outline">{t.bookings.viewPass}</Button>
            </div>
          </Panel>
          );
        })}
      </div>
    ) : (
      <div className="mt-12">
        <p className="max-w-lg text-base leading-relaxed text-muted">
          {t.bookings.empty}
        </p>
        <Button className="mt-8" onClick={() => onNavigate('home')}>
          {t.bookings.explore}
        </Button>
      </div>
    )}
  </PageShell>
  );
};

export default ControlRoomPage;
