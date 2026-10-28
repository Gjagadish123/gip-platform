import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { COMPANY } from '../data/project.js';
import { directionsUrl } from '../lib/projects.js';

export default function Contact({ project, model, pin }) {
  const [form, setForm] = useState({ name: '', phone: '', plot: '', when: 'This weekend' });
  const [error, setError] = useState('');
  const c = project.content || {};

  const submit = (e) => {
    e.preventDefault();
    const phone = form.phone.replace(/\D/g, '');
    const plot = form.plot.replace(/^0+(?=\d)/, '');
    if (!form.name.trim()) return setError('Add your name so the sales team knows who to ask for.');
    if (phone.length < 10) return setError('Enter a 10 digit mobile number.');
    if (plot && model && !model.plotByNumber.has(plot)) return setError(`There is no plot ${plot}. Plots run from ${model.firstPlot} to ${model.lastPlot}.`);
    setError('');
    const msg = [
      `Hi, I would like to book a site visit to ${project.name}.`,
      `Name: ${form.name.trim()}`,
      `Mobile: ${phone}`,
      plot ? `Interested in plot: ${plot}` : null,
      `Preferred time: ${form.when}`,
    ]
      .filter(Boolean)
      .join('\n');
    window.open(`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  const field = 'h-12 w-full rounded-xl border border-line bg-white px-4 text-[16px] text-ink placeholder:text-ink-muted focus:border-navy-500 focus:outline-none';

  return (
    <section id="contact" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            {c.cta?.subheading && <p className="text-sm font-semibold uppercase tracking-[0.1em] text-navy-600">{c.cta.subheading}</p>}
            <h2 className="display mt-3 text-[36px] sm:text-[48px]">Walk the plot before you book it</h2>
            <p className="mt-4 max-w-[52ch] text-lg text-ink-soft">Send your details and the sales team will confirm a site visit on WhatsApp. Mention a plot number and they will have its papers ready.</p>

            <form onSubmit={submit} noValidate className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Your name
                </label>
                <input id="c-name" autoComplete="name" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="c-phone" className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Mobile number
                </label>
                <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="10 digit mobile" className={`${field} num`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label htmlFor="c-plot" className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Plot number, if you have one in mind
                </label>
                <input
                  id="c-plot"
                  inputMode="numeric"
                  placeholder={model ? `${model.firstPlot} to ${model.lastPlot}` : 'Plot no.'}
                  className={`${field} num`}
                  value={form.plot}
                  onChange={(e) => setForm({ ...form, plot: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-when" className="mb-1.5 block text-sm font-medium text-ink-soft">
                  When would you like to visit?
                </label>
                <select id="c-when" className={field} value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })}>
                  {['This weekend', 'On a weekday', 'Next weekend', 'Call me to decide'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-[#a3241d] sm:col-span-2">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <button type="submit" className="flex h-12 items-center gap-2 rounded-xl bg-navy-700 px-6 text-[15px] font-semibold text-white hover:bg-navy-800">
                  <Icon name="whatsapp" size={19} /> Book a site visit
                </button>
                <a href={`tel:${COMPANY.tel}`} className="num flex h-12 items-center gap-2 rounded-xl border border-line px-5 text-[17px] font-semibold text-navy-700 hover:border-navy-500">
                  <Icon name="phone" size={18} /> {COMPANY.phone}
                </a>
              </div>
            </form>
          </div>

          <div>
            <div className="rounded-2xl bg-navy-50 p-6 sm:p-8">
              <h3 className="text-xl font-bold">Project site</h3>
              <p className="mt-2 text-ink-soft">
                {project.name}
                {c.location?.full ? `, ${c.location.full}` : ''}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {pin && (
                  <a href={directionsUrl(pin)} target="_blank" rel="noreferrer" className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-navy-700 shadow-panel hover:text-navy-500">
                    <Icon name="route" size={17} /> Directions to the site
                  </a>
                )}
                <a href={`mailto:${COMPANY.email}`} className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-navy-700 shadow-panel hover:text-navy-500">
                  <Icon name="mail" size={17} /> {COMPANY.email}
                </a>
              </div>
            </div>

            <div className="mt-8 flex gap-4 border-t border-line pt-6">
              <Icon name="pin" size={20} className="mt-1 shrink-0 text-navy-600" />
              <div>
                <h3 className="text-[17px] font-bold">
                  {COMPANY.name} <span className="ml-1 text-sm font-medium text-ink-muted">Head office</span>
                </h3>
                <p className="mt-1 text-ink-soft">{COMPANY.office}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${COMPANY.name}, ${COMPANY.office}`)}`} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-navy-500">
                  Open in Google Maps <Icon name="external" size={14} />
                </a>
              </div>
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              <a href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-navy-700 hover:text-navy-500">
                <Icon name="whatsapp" size={16} /> WhatsApp sales
              </a>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              <a href={COMPANY.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-navy-700 hover:text-navy-500">
                All our projects <Icon name="external" size={14} />
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
