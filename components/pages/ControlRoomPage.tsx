import React from 'react';
import { Booking } from '../../types';
import { Page } from '../../App';
import { PageHeader, PageShell, Panel, Button, Badge } from '../ui';

interface ControlRoomPageProps {
  bookings: Booking[];
  onNavigate: (page: Page) => void;
}

const statusStyles: Record<Booking['status'], string> = {
  Active: 'border-accent/50 text-accent',
  Redeemed: 'border-line text-muted',
  Pending: 'border-bone/30 text-bone',
};

const ControlRoomPage: React.FC<ControlRoomPageProps> = ({ bookings, onNavigate }) => (
  <PageShell>
    <PageHeader
      eyebrow="My account"
      title="My bookings"
      intro={
        bookings.length > 0
          ? 'Your access passes and tickets for Bona Parks experiences.'
          : undefined
      }
    />

    {bookings.length > 0 ? (
      <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
        {bookings.map((booking) => (
          <Panel key={booking.id} hover className="p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl leading-tight text-bone">{booking.title}</h2>
              <Badge className={statusStyles[booking.status]}>{booking.status}</Badge>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted">{booking.description}</p>

            <div className="mt-8 flex items-end justify-between border-t border-line pt-6">
              <div>
                <p className="text-[11px] uppercase tracking-widest2 text-muted">Acquired</p>
                <p className="mt-1 text-sm text-bone">
                  {new Date(booking.lastUpdate).toLocaleDateString('en-GB')}
                </p>
              </div>
              <Button variant="outline">View access pass</Button>
            </div>
          </Panel>
        ))}
      </div>
    ) : (
      <div className="mt-12">
        <p className="max-w-lg text-base leading-relaxed text-muted">
          You have no bookings yet. Explore our venues to get started.
        </p>
        <Button className="mt-8" onClick={() => onNavigate('home')}>
          Explore experiences
        </Button>
      </div>
    )}
  </PageShell>
);

export default ControlRoomPage;
