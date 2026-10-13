'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { RegistryBatch } from '../../types';

function TokenizeWizardContent() {
  const { t, formatNumber } = useI18n();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const paramBatch = searchParams.get('batch');

  const [batches, setBatches] = useState<RegistryBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [amount, setAmount] = useState<string>('500');

  // Wizard state
  const [phase, setPhase] = useState<'idle' | 'locking' | 'locked' | 'minting' | 'minted'>('idle');
  const [progress, setProgress] = useState(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.getRegistryBatches()
      .then((data) => {
        setBatches(data);
        if (paramBatch && data.some((b) => b.id === paramBatch)) {
          setSelectedBatchId(paramBatch);
        } else if (data.length > 0) {
          setSelectedBatchId(data[0].id);
        }
      })
      .catch(() => {});
  }, [paramBatch]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const numAmount = parseFloat(amount) || 0;
  const onChainUnits = numAmount * 1000;

  const handleStartLock = async () => {
    if (!selectedBatch || numAmount <= 0 || numAmount > selectedBatch.remaining) {
      showToast(t('toast_lock_invalid'));
      return;
    }

    try {
      setPhase('locking');
      setProgress(25);
      const res = await api.createLockJob(selectedBatchId, numAmount);
      setActiveJobId(res.jobId);

      setTimeout(async () => {
        setPhase('locked');
        setProgress(50);
        showToast(t('toast_lock_success'));
      }, 1500);
    } catch (err: any) {
      setPhase('idle');
      setProgress(0);
      showToast(err.message || t('toast_lock_failed'));
    }
  };

  const handleStartMint = async () => {
    if (!activeJobId) return;

    try {
      setPhase('minting');
      setProgress(75);

      const mintRes = await api.processMint(activeJobId);
      setResult(mintRes.result);
      setPhase('minted');
      setProgress(100);
      showToast(t('toast_mint_success'));
    } catch (err: any) {
      setPhase('locked');
      setProgress(50);
      showToast(err.message || t('toast_mint_failed'));
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setProgress(0);
    setActiveJobId(null);
    setResult(null);
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    showToast(t('btn_copied'));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('tokenize_title')}</h2>
        <p className="text-sm text-slate-500">{t('tokenize_sub')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Panel: Step Progression */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-6">
          <h3 className="font-bold text-slate-900 text-sm">{t('flow_heading')}</h3>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              style={{ width: `${progress}%` }}
              className="bg-emerald-600 h-full transition-all duration-500"
            />
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  progress >= 25 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {progress > 25 ? '✓' : '1'}
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900">{t('step_1_title')}</div>
                <div className="text-xs text-slate-400">{t('step_1_desc')}</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  progress >= 50 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {progress > 50 ? '✓' : '2'}
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900">{t('step_2_title')}</div>
                <div className="text-xs text-slate-400">{t('step_2_desc')}</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  progress >= 75 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {progress > 75 ? '✓' : '3'}
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900">{t('step_3_title')}</div>
                <div className="text-xs text-slate-400">{t('step_3_desc')}</div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  progress === 100 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {progress === 100 ? '✓' : '4'}
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900">{t('step_4_title')}</div>
                <div className="text-xs text-slate-400">{t('step_4_desc')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Form / Result */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
          {phase !== 'minted' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('select_batch_label')}</label>
                <select
                  disabled={phase !== 'idle'}
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:bg-slate-50"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.project} ({b.id} · {t('col_remaining').toLowerCase()} {b.remaining} t)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>{t('credit_amount_label')}</span>
                  <span>{t('available_label')}: {selectedBatch?.remaining || 0} t</span>
                </div>
                <input
                  type="number"
                  disabled={phase !== 'idle'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:bg-slate-50"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <div className="text-slate-500">{t('spl_units_label')}</div>
                <div className="text-lg font-black mono text-emerald-700">
                  {formatNumber(onChainUnits, { maximumFractionDigits: 0 })} UNITS
                </div>
                <div className="text-slate-400">{t('spl_unit_ratio')}</div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {phase === 'idle' && (
                  <button
                    type="button"
                    onClick={handleStartLock}
                    className="w-full bg-emerald-600 text-white font-semibold text-sm px-4 py-3 rounded-xl hover:bg-emerald-700 transition"
                  >
                    {t('btn_start_lock')}
                  </button>
                )}

                {phase === 'locking' && (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-slate-100 text-slate-400 font-semibold text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    {t('btn_locking')}
                  </button>
                )}

                {phase === 'locked' && (
                  <button
                    type="button"
                    onClick={handleStartMint}
                    className="w-full bg-emerald-600 text-white font-semibold text-sm px-4 py-3 rounded-xl hover:bg-emerald-700 transition shadow-sm"
                  >
                    {t('btn_sign_mint')}
                  </button>
                )}

                {phase === 'minting' && (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-slate-100 text-slate-400 font-semibold text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    {t('btn_minting')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Minted Result Screen */
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl">
                ✓
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{t('mint_success_title')}</h3>
              <p className="text-xs text-slate-500">{t('mint_success_sub')}</p>

              <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-xs p-4 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400">{t('label_mint_address')}</dt>
                <dd className="mono truncate text-slate-800">{result?.mint}</dd>

                <dt className="text-slate-400">{t('label_token_account')}</dt>
                <dd className="mono truncate text-slate-800">{result?.ata}</dd>

                <dt className="text-slate-400">{t('label_signature')}</dt>
                <dd className="mono break-all text-slate-800 flex items-center gap-2">
                  <span className="truncate">{result?.signature}</span>
                  <button
                    type="button"
                    onClick={() => copyText(result?.signature)}
                    className="text-emerald-700 font-semibold shrink-0"
                  >
                    {t('btn_copy')}
                  </button>
                </dd>

                <dt className="text-slate-400">{t('label_solana_slot')}</dt>
                <dd className="mono font-bold text-slate-800">{result?.slot}</dd>
              </dl>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50 transition"
                >
                  {t('btn_tokenize_again')}
                </button>
                <Link
                  href="/audit"
                  className="flex-1 bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-700 text-center transition"
                >
                  {t('btn_open_audit')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TokenizeWizardPage() {
  const { t } = useI18n();

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">{t('loading_tokenize')}</div>}>
      <TokenizeWizardContent />
    </Suspense>
  );
}
