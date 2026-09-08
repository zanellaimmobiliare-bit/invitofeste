'use client';

import { useState } from 'react';
import App from '@/components/band/App';
import './invite-overlay.css';

// Instagram-handle capture (gate step, lib/instagram.ts, the Apps Script
// intake endpoint) is disabled for now — it was friction before the DM link.
// The endpoint and sheet are still live; see scripts/apps-script-instagram-intake.gs
// to bring the gate back.

const WHATSAPP_NUMBER = '393494103162';
const WHATSAPP_MESSAGE = 'Ciao! Voglio iscrivermi alla festa, mi mandi la posizione?';
const WHATSAPP_DM_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

type Step = 'idle' | 'entered';

export default function Home() {
  const [step, setStep] = useState<Step>('idle');

  return (
    <main className="invite-scene">
      <App />
      <div className="invite-overlay">
        {step === 'idle' && (
          <button type="button" className="enter-btn" onClick={() => setStep('entered')}>
            Entra <span aria-hidden="true">↓</span>
          </button>
        )}

        {step === 'entered' && (
          <div className="cta-group">
            <a className="btn btn-primary" href={WHATSAPP_DM_URL}>
              💬 Scrivimi per iscriverti
            </a>
            <p className="fallback">
              Il bottone non apre WhatsApp? Tocca <strong>⋯</strong> in alto a destra e scegli{' '}
              <em>&quot;Apri nel browser&quot;</em>.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
