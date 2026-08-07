import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Send, Info, Cpu, ChevronLeft } from 'lucide-react';
import api from '../../../services/api';

const EMPTY_FORM = {
  titre: '',
  equipement: '',
  date_souhaitee: '',
  description: '',
};

export default function InterventionNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      await api.post('/client/interventions', {
        titre: form.titre,
        equipement: form.equipement || null,
        date_souhaitee: form.date_souhaitee || null,
        description: form.description,
      });
      navigate('/client/interventions', {
        state: {
          success:
            'Your request has been submitted. A Vengineers engineer will get back to you shortly.',
        },
      });
    } catch (err) {
      if (err.response?.status === 422) {
        const fieldErrors = {};
        Object.entries(err.response.data.errors || {}).forEach(([key, msgs]) => {
          fieldErrors[key] = msgs[0];
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/client/interventions"
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[#707070] hover:text-black"
        >
          <ChevronLeft size={16} />
          Back to interventions
        </Link>
        <h1 className="font-['Sora'] text-3xl font-bold text-black md:text-4xl">
          New Intervention Request
        </h1>
        <p className="mt-2 max-w-2xl text-[#707070]">
          Fill in the details below to report a technical malfunction or schedule
          preventive maintenance on your equipment.
        </p>
      </div>

      {errors.general && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#C62221]">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left: equipment & problem details */}
        <div className="space-y-6 rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F7]">
              <Cpu size={18} className="text-black" />
            </div>
            <h2 className="font-['Sora'] text-lg font-bold text-black">
              Issue Details
            </h2>
          </div>

          <div>
            <label
              htmlFor="intervention-titre"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#707070]"
            >
              Title
            </label>
            <input
              id="intervention-titre"
              type="text"
              value={form.titre}
              onChange={handleChange('titre')}
              placeholder="e.g. Screen won't turn on"
              className="w-full rounded-lg border border-[#dedede] px-4 py-2.5 text-sm focus:border-[#F80000] focus:outline-none focus:ring-1 focus:ring-[#F80000]"
              required
            />
            {errors.titre && (
              <p className="mt-1 text-xs text-[#C62221]">{errors.titre}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="intervention-equipement"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#707070]"
              >
                Equipment concerned{' '}
                <span className="font-normal normal-case text-[#a0a0a0]">
                  (optional)
                </span>
              </label>
              <input
                id="intervention-equipement"
                type="text"
                value={form.equipement}
                onChange={handleChange('equipement')}
                placeholder="e.g. Touch panel, serial no..."
                className="w-full rounded-lg border border-[#dedede] px-4 py-2.5 text-sm focus:border-[#F80000] focus:outline-none focus:ring-1 focus:ring-[#F80000]"
              />
              {errors.equipement && (
                <p className="mt-1 text-xs text-[#C62221]">{errors.equipement}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="intervention-date"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#707070]"
              >
                Preferred Date{' '}
                <span className="font-normal normal-case text-[#a0a0a0]">
                  (optional)
                </span>
              </label>
              <input
                id="intervention-date"
                type="date"
                value={form.date_souhaitee}
                onChange={handleChange('date_souhaitee')}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-[#dedede] px-4 py-2.5 text-sm focus:border-[#F80000] focus:outline-none focus:ring-1 focus:ring-[#F80000]"
              />
              {errors.date_souhaitee && (
                <p className="mt-1 text-xs text-[#C62221]">{errors.date_souhaitee}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="intervention-description"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#707070]"
            >
              Problem Description
            </label>
            <textarea
              id="intervention-description"
              rows={5}
              value={form.description}
              onChange={handleChange('description')}
              placeholder="Please describe precisely the abnormal behavior observed or the error code shown by the system..."
              className="w-full resize-none rounded-lg border border-[#dedede] px-4 py-3 text-sm focus:border-[#F80000] focus:outline-none focus:ring-1 focus:ring-[#F80000]"
              required
            />
            {errors.description && (
              <p className="mt-1 text-xs text-[#C62221]">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Right: info + submit */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Info size={18} className="text-[#707070]" />
              <h3 className="font-['Sora'] text-sm font-bold text-black">
                Priority
              </h3>
            </div>
            <p className="text-sm text-[#707070]">
              Every request is reviewed by our team, who will set the priority
              level and assign an engineer based on the issue you describe.
            </p>
          </div>

          <div className="rounded-xl bg-black p-6 text-white">
            <h3 className="font-['Sora'] text-lg font-bold">Ready to submit?</h3>
            <p className="mt-2 text-sm text-white/70">
              A Vengineers engineer will review your ticket and get back to you
              shortly.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#F80000] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send Request'}
              <Send size={16} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
