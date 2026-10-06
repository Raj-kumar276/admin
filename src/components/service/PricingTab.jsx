import React, { useState } from 'react';
import Icon from '../common/Icon.jsx';
import Switch from '../common/Switch.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVC } from '../../data/constants.js';
import { PRICING_DEFAULT, clone } from '../../data/generators.js';
import { inr } from '../../utils/format.js';

export default function PricingTab({ svcId: id }) {
  const { db, toast, refresh } = useAdmin();
  const [formKey, setFormKey] = useState(0); // bump to re-mount the form after a reset

  // Ensure any newly added default pricing fields or toggles are synchronized into in-memory state
  const defaultP = PRICING_DEFAULT[id];
  if (defaultP && db.pricing[id]) {
    defaultP.fields.forEach((defF) => {
      if (!db.pricing[id].fields.some((f) => f[0] === defF[0])) {
        db.pricing[id].fields.push([...defF]);
      }
    });
    defaultP.toggles.forEach((defT) => {
      if (!db.pricing[id].toggles.some((t) => t[0] === defT[0])) {
        db.pricing[id].toggles.push([...defT]);
      }
    });
  }
  const P = db.pricing[id];

  const isClimate = (name) => {
    const s = name.toLowerCase();
    return s.includes('climate') || s.includes('weather') || s.includes('rain');
  };

  const isNight = (name) => {
    const s = name.toLowerCase();
    return s.includes('night');
  };

  // Keep original indices for form binding
  const standardFields = [];
  const specialFields = [];
  P.fields.forEach((f, idx) => {
    if (isClimate(f[0]) || isNight(f[0])) {
      specialFields.push({ f, idx, isClimate: isClimate(f[0]), isNight: isNight(f[0]) });
    } else {
      standardFields.push({ f, idx });
    }
  });

  const specialToggles = [];
  const standardToggles = [];
  P.toggles.forEach((t, idx) => {
    if (isClimate(t[0]) || isNight(t[0])) {
      specialToggles.push({ t, idx, isClimate: isClimate(t[0]), isNight: isNight(t[0]) });
    } else {
      standardToggles.push({ t, idx });
    }
  });

  const hasSpecial = specialFields.length > 0 || specialToggles.length > 0;

  const save = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    for (let i = 0; i < P.fields.length; i++) {
      const raw = fd.get('f' + i);
      if (raw === '' || !(+raw >= 0)) {
        toast(`Enter a valid value for “${P.fields[i][0]}”`, true);
        return;
      }
    }
    P.fields.forEach((x, i) => (x[2] = +fd.get('f' + i)));
    P.toggles.forEach((x, i) => (x[1] = fd.get('t' + i) === 'on'));
    if (id === 'ride')
      db.plans.forEach((p, i) => {
        const v = +fd.get('plan' + i);
        if (v > 0) p[1] = v;
      });
    toast(`Pricing & rules saved for ${SVC[id].name}`);
    setFormKey((k) => k + 1);
    refresh();
  };

  const reset = () => {
    db.pricing[id] = clone(PRICING_DEFAULT[id]);
    toast('Pricing reset to defaults');
    setFormKey((k) => k + 1);
    refresh();
  };

  // Find active status of climate and night for the top banner
  const climateToggle = specialToggles.find((x) => x.isClimate);
  const nightToggle = specialToggles.find((x) => x.isNight);
  const climateField = specialFields.find((x) => x.isClimate);
  const nightField = specialFields.find((x) => x.isNight);

  return (
    <form key={formKey} onSubmit={save} className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 18 }}>
      {/* Climate & Night Time Live Status Banner for food, grocery, ride */}
      {hasSpecial && (
        <div className="pricing-banner">
          <div className="row" style={{ gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tile sm" style={{ '--c': 'var(--info)' }}>
                <Icon name="rain" size={16} />
              </span>
              <div>
                <b style={{ fontSize: 13, display: 'block' }}>Climate & Weather Surge</b>
                <small style={{ color: 'var(--muted)', fontSize: 11.5 }}>
                  {climateToggle?.t[1]
                    ? `Active (${climateField ? '+' + inr(climateField.f[2]) : 'Enabled'})`
                    : 'Disabled'}
                </small>
              </div>
            </div>

            <div style={{ width: 1, height: 28, background: 'var(--line)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tile sm" style={{ '--c': 'var(--vio)' }}>
                <Icon name="moon" size={16} />
              </span>
              <div>
                <b style={{ fontSize: 13, display: 'block' }}>Night-Time Operations (11 PM – 6 AM)</b>
                <small style={{ color: 'var(--muted)', fontSize: 11.5 }}>
                  {nightToggle?.t[1]
                    ? `Active (${nightField ? '+' + inr(nightField.f[2]) : 'Enabled'})`
                    : 'Disabled'}
                </small>
              </div>
            </div>
          </div>

          <span className="pill t-info plain" style={{ fontSize: 11.5 }}>
            Dynamic pricing rules enabled for {SVC[id].name}
          </span>
        </div>
      )}

      {/* Standard Fees & Fares */}
      <div>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>
          {hasSpecial ? 'Base fees & fares' : 'Fees & fares'}
        </h3>
        <div className="pgrid">
          {standardFields.map(({ f, idx }) => (
            <div className="field" key={f[0]}>
              <label htmlFor={'pf' + idx}>{f[0]}</label>
              <div className="adorn">
                <input
                  className="inp num"
                  id={'pf' + idx}
                  name={'f' + idx}
                  type="number"
                  min="0"
                  step={f[2] % 1 ? 0.5 : 1}
                  defaultValue={f[2]}
                />
                <span>{f[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Climate & Night Time Dynamic Fees (if applicable) */}
      {specialFields.length > 0 && (
        <div className="pricing-special-block">
          <div className="pricing-special-head">
            <div className="pricing-special-title">
              <Icon name="sliders" size={16} />
              <span>Climate & Night-Time Surcharges</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Applied dynamically to orders under adverse weather or late-night hours
            </span>
          </div>

          <div className="pricing-special-grid">
            {specialFields.map(({ f, idx, isClimate: isC, isNight: isN }) => (
              <div
                className="field"
                key={f[0]}
                style={{
                  background: 'var(--surface)',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <Icon name={isC ? 'rain' : isN ? 'moon' : 'zap'} size={15} style={{ color: isC ? 'var(--info)' : 'var(--vio)' }} />
                  <label htmlFor={'pf' + idx} style={{ fontWeight: 600, fontSize: 13 }}>
                    {f[0]}
                  </label>
                </div>
                <div className="adorn">
                  <input
                    className="inp num"
                    id={'pf' + idx}
                    name={'f' + idx}
                    type="number"
                    min="0"
                    step={f[2] % 1 ? 0.5 : 1}
                    defaultValue={f[2]}
                  />
                  <span>{f[1]}</span>
                </div>
                <small style={{ color: 'var(--muted)', fontSize: 11.5, marginTop: 4 }}>
                  {isC
                    ? 'Direct compensation to fleet partners during heavy rain or severe weather'
                    : 'Overnight incentive fee charged for orders placed between 11 PM and 6 AM'}
                </small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ride Captain Plans */}
      {id === 'ride' && (
        <div>
          <h3 style={{ fontSize: 15 }}>Captain partner plans</h3>
          <p className="muted" style={{ fontSize: 12.5, margin: '2px 0 10px' }}>
            Captains pay a fixed plan fee instead of per-ride commission; ride earnings go straight to them.
          </p>
          <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 12 }}>
            <table style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Plan price</th>
                  <th>Rides included</th>
                  <th className="r">Active captains</th>
                  <th className="r">Collected</th>
                </tr>
              </thead>
              <tbody>
                {db.plans.map((p, i) => (
                  <tr key={i}>
                    <td>{p[0]}</td>
                    <td style={{ width: 150 }}>
                      <div className="adorn">
                        <input
                          className="inp num"
                          name={'plan' + i}
                          type="number"
                          min="0"
                          defaultValue={p[1]}
                          aria-label={`${p[0]} ${p[2]} plan price`}
                          style={{ height: 32 }}
                        />
                        <span style={{ top: 6 }}>₹</span>
                      </div>
                    </td>
                    <td>{p[2]}</td>
                    <td className="r num">{p[3]}</td>
                    <td className="r num">{inr(p[1] * p[3])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rules Section */}
      <div>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>
          {hasSpecial ? 'Operational rules & policy switches' : 'Rules'}
        </h3>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
          Configure live platform behaviors, surge activations, and dispatch policies.
        </p>

        {/* Special Climate & Night Rules Group */}
        {specialToggles.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <b style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              Climate & Night-Time Policies
            </b>
            <div className="toggles" style={{ background: 'var(--surface-2)', padding: '4px 16px', borderRadius: 12, border: '1px solid var(--line)' }}>
              {specialToggles.map(({ t, idx, isClimate: isC, isNight: isN }) => (
                <label className="trow" htmlFor={'pt' + idx} key={t[0]}>
                  <div className="rule-meta">
                    <div className="rule-icon">
                      <Icon name={isC ? 'rain' : isN ? 'moon' : 'zap'} size={17} style={{ color: isC ? 'var(--info)' : 'var(--vio)' }} />
                    </div>
                    <div>
                      <b>{t[0]}</b>
                      {t[2] && <small>{t[2]}</small>}
                    </div>
                  </div>
                  <Switch id={'pt' + idx} name={'t' + idx} defaultChecked={t[1]} />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Standard Rules Group */}
        {standardToggles.length > 0 && (
          <div>
            {specialToggles.length > 0 && (
              <b style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                General Service Policies
              </b>
            )}
            <div className="toggles">
              {standardToggles.map(({ t, idx }) => (
                <label className="trow" htmlFor={'pt' + idx} key={t[0]}>
                  <div>
                    <b>{t[0]}</b>
                    {t[2] && <small>{t[2]}</small>}
                  </div>
                  <Switch id={'pt' + idx} name={'t' + idx} defaultChecked={t[1]} />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" className="btn" onClick={reset}>
          Reset to defaults
        </button>
        <button type="submit" className="btn primary">
          <Icon name="check" size={15} />
          Save changes
        </button>
      </div>
    </form>
  );
}
