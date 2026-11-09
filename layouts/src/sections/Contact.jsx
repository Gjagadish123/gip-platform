import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { COMPANY, OFFICES } from '../data/project.js';
import { directionsUrl } from '../lib/projects.js';
import { saveEnquiry, toE164 } from '../lib/live.js';
import { mapBus } from '../lib/mapBus.js';
import { findPlot, plotInput } from '../lib/plots.js';

/** choices: in All projects, the layouts to pick from (the visit is to one of them); otherwise null. */
export default function Contact({ project, model, pin, choices }) {
  // like: the plot came from a map card for a plot that isn't available, so the visitor wants plots like it
  const [form, setForm] = useState({ name: '', phone: '', plot: '', like: false, when: 'This weekend', to: choices?.[0]?.id ?? '' });
  const visit = choices ? (choices.find((p) => p.id === form.to) ?? choices[0]) : project; // {id, name}
  const [error, setError] = useState('');
  // null, 'sending', or the confirmation once the Common sheet has the enquiry
  const [sent, setSent] = useState(null);
  const change = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    if (sent && sent !== 'sending') setSent(null);
  };
  const c = project.content || {};
  const section = useRef(null);
  const nameField = useRef(null);

  // a plot card's Know more: this form, with that plot filled in
  useEffect(() => {
    const onEnquire = (e) => {
      setForm((f) => ({ ...f, plot: e.detail.plot, like: e.detail.similar }));
      setError('');
      setSent(null);
      nameField.current?.focus({ preventScroll: true });
      section.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    };
    mapBus.addEventListener('enquire', onEnquire);
    return () => mapBus.removeEventListener('enquire', onEnquire);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (sent) return;
    const name = form.name.trim().replace(/\s+/g, ' ');
    const phone = toE164(form.phone);
    const typed = form.plot.trim();
    const plot = typed && model ? findPlot(model, typed) : typed.replace(/^0+(?=\d)/, '');
    if (name.length < 2) return setError('Add your name so the sales team knows who to ask for.');
    if (!phone) return setError('Enter a 10 digit mobile number, or the full number with + and the country code.');
    if (typed && !plot) return setError(`There is no plot ${typed}. Plots run from ${model.plotRange}.`);
    setError('');
    setSent('sending');
    // The admin's Common sheet is where sales picks the visit up: the visitor is told whether it got there.
    try {
      const id = await saveEnquiry({ form: 'site_visit', project_id: visit?.id, plot_number: plot || null, similar: Boolean(plot && form.like), name, phone, visit_when: form.when });
      if (id == null) throw new Error('No backend in this build');
      setSent(`Thank you, ${name.split(' ')[0]}. Our sales team has your request and will call you on ${phone} to confirm the visit.`);
    } catch (err) {
      console.warn('Site visit request not sent', err);
      setSent(null);
      setError(`We couldn't send it just now. Please try again, or email us at ${COMPANY.email}.`);
    }
  };

  const field = 'h-12 w-full rounded-xl border border-line bg-white px-4 text-[16px] text-ink placeholder:text-ink-muted focus:border-navy-500 focus:outline-none';

  return (
    <section ref={section} id="contact" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            {c.cta?.subheading && <p className="text-sm font-semibold uppercase tracking-[0.1em] text-navy-600">{c.cta.subheading}</p>}
            <h2 className="display mt-3 text-[36px] sm:text-[48px]">Walk the plot before you book it</h2>
            <p className="mt-4 max-w-[52ch] text-lg text-ink-soft">Send your details and the sales team will call you to confirm a site visit. Mention a plot number and they will have its papers ready.</p>

            <form onSubmit={submit} noValidate className="mt-8 grid gap-4 sm:grid-cols-2">
              {choices && (
                <div className="sm:col-span-2">
                  <label htmlFor="c-project" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Which project?
                  </label>
                  <select id="c-project" className={field} value={visit?.id ?? ''} onChange={(e) => change({ to: e.target.value, plot: '' })}>
                    {choices.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2">
                <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Your name
                </label>
                <input ref={nameField} id="c-name" autoComplete="name" className={field} value={form.name} onChange={(e) => change({ name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="c-phone" className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Mobile number
                </label>
                <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="10 digit mobile" className={`${field} num`} value={form.phone} onChange={(e) => change({ phone: e.target.value })} />
              </div>
              <div>
                <label htmlFor="c-plot" className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Plot number, if you have one in mind
                </label>
                <input
                  id="c-plot"
                  inputMode={model?.lettered ? 'text' : 'numeric'}
                  autoCapitalize="characters"
                  placeholder={model ? model.plotRange : 'Plot no.'}
                  className={`${field} num`}
                  value={form.plot}
                  onChange={(e) => change({ plot: plotInput(model, e.target.value), like: false })}
                />
                {form.like && form.plot && <p className="mt-1.5 text-sm text-ink-muted">Plot {form.plot} isn&apos;t available, so sales will suggest plots like it.</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-when" className="mb-1.5 block text-sm font-medium text-ink-soft">
                  When would you like to visit?
                </label>
                <select id="c-when" className={field} value={form.when} onChange={(e) => change({ when: e.target.value })}>
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
                <button type="submit" disabled={Boolean(sent)} className="flex h-12 items-center gap-2 rounded-xl bg-navy-700 px-6 text-[15px] font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
                  <Icon name="pin" size={19} /> {sent === 'sending' ? 'Sending…' : sent ? 'Sent' : 'Book a site visit'}
                </button>
              </div>
              <p role="status" className="text-sm font-medium text-ink-soft empty:hidden sm:col-span-2">
                {sent && sent !== 'sending' ? sent : ''}
              </p>
            </form>
          </div>

          <div>
            <div className="rounded-2xl bg-navy-50 p-6 sm:p-8">
              <h3 className="text-xl font-bold">{choices ? 'Project sites' : 'Project site'}</h3>
              <p className="mt-2 text-ink-soft">
                {choices ? choices.map((p) => p.name).join(' · ') : project.name}
                {!choices && c.location?.full ? `, ${c.location.full}` : ''}
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

            <ul className="mt-8 divide-y divide-line border-t border-line">
              {OFFICES.map((o) => (
                <li key={o.place} className="flex gap-4 py-5">
                  <Icon name="pin" size={20} className="mt-1 shrink-0 text-navy-600" />
                  <div>
                    <h3 className="text-[17px] font-bold">
                      {o.place} <span className="ml-1 text-sm font-medium text-ink-muted">{o.kind}</span>
                    </h3>
                    <address className="mt-1 not-italic leading-relaxed text-ink-soft">
                      {o.lines.map((l) => (
                        <span key={l} className="block">
                          {l}
                        </span>
                      ))}
                    </address>
                    <a href={o.maps} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-navy-500">
                      Open in Google Maps <Icon name="external" size={14} />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-muted">
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
