import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import KpiCards from '../components/overview/KpiCards.jsx';
import OrderValueChart from '../components/overview/OrderValueChart.jsx';
import ServiceHealth from '../components/overview/ServiceHealth.jsx';
import LiveFeed from '../components/overview/LiveFeed.jsx';
import ApprovalsCard from '../components/overview/ApprovalsCard.jsx';
import TicketsMini from '../components/overview/TicketsMini.jsx';
import { useAdmin } from '../context/AdminContext.jsx';

const RANGES = [
  ['today', 'Today'],
  ['7d', '7 days'],
  ['30d', '30 days'],
];

export default function OverviewPage() {
  const { db, ui, setUi, live } = useAdmin();
  const nav = useNavigate();
  const d = new Date();
  const greet = d.getHours() < 12 ? 'morning' : d.getHours() < 17 ? 'afternoon' : 'evening';

  return (
    <>
      <div className="pagehead">
        <div>
          <h2>Good {greet}, Ops team</h2>
          <p>
            {d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · Hyderabad · {db.orders.length} orders placed today
          </p>
        </div>
        <div className="seg" role="group" aria-label="Date range">
          {RANGES.map(([k, l]) => (
            <button key={k} aria-pressed={ui.range === k} onClick={() => setUi({ range: k })}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <KpiCards />

      <section className="grid-main">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Order value by service</h3>
              <p>{ui.range === 'today' ? 'Hourly, last 12 hours' : ui.range === '7d' ? 'Daily, last 7 days' : 'Daily, last 30 days'}</p>
            </div>
            <button className="btn sm" onClick={() => setUi({ chartTable: !ui.chartTable })}>
              <Icon name={ui.chartTable ? 'bars' : 'table'} size={15} />
              {ui.chartTable ? 'Chart' : 'Table'}
            </button>
          </div>
          <div className="card-b">
            <OrderValueChart />
          </div>
        </div>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Service health</h3>
              <p>Today's order value and share</p>
            </div>
          </div>
          <div className="card-b">
            <ServiceHealth />
          </div>
        </div>
      </section>

      <section className="grid-3">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Live activity</h3>
              <p>{live ? 'Updating as orders come in' : 'Paused — turn on Live to stream'}</p>
            </div>
          </div>
          <div className="card-b">
            <LiveFeed />
          </div>
        </div>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Partner approvals</h3>
              <p>KYC documents waiting for review</p>
            </div>
            <button className="btn sm ghost" onClick={() => nav('/partners')}>
              View all
              <Icon name="arrow" size={14} />
            </button>
          </div>
          <div className="card-b">
            <ApprovalsCard />
          </div>
        </div>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Open tickets</h3>
              <p>Customer issues needing a reply</p>
            </div>
            <button className="btn sm ghost" onClick={() => nav('/support')}>
              Inbox
              <Icon name="arrow" size={14} />
            </button>
          </div>
          <div className="card-b">
            <TicketsMini />
          </div>
        </div>
      </section>
    </>
  );
}
