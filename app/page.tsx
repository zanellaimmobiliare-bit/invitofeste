'use client';

import { FormEvent, useState } from 'react';
import App from '@/components/band/App';
import { instagramProfileUrl, normalizeInstagramInput } from '@/lib/instagram';
import './invite-overlay.css';

const WHATSAPP_NUMBER = '393494103162';
const WHATSAPP_MESSAGE = 'Ciao! Ho visto la storia della festa, mi dai qualche info in più?';
const WHATSAPP_DM_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const IG_ENDPOINT = process.env.NEXT_PUBLIC_IG_ENDPOINT;

async function submitInstagramProfile(username: string): Promise<void> {
  if (!IG_ENDPOINT) return;

  const payload = {
    username,
    profileUrl: instagramProfileUrl(username),
    ts: new Date().toISOString(),
  };

  try {
    await fetch(IG_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Best-effort: a network hiccup shouldn't block a guest from seeing the invite.
  }
}

type Step = 'idle' | 'gate' | 'entered';

export default function Home() {
  const [step, setStep] = useState<Step>('idle');
  const [igInput, setIgInput] = useState('');
  const [igError, setIgError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = normalizeInstagramInput(igInput);
    if (!username) {
      setIgError('Inserisci un profilo Instagram valido (es. @tuonome o instagram.com/tuonome).');
      return;
    }
    setIgError(null);
    setSubmitting(true);
    await submitInstagramProfile(username);
    setSubmitting(false);
    setStep('entered');
  }

  return (
    <main className="invite-scene">
      <App />
      <div className="invite-overlay">
        {step === 'idle' && (
          <button type="button" className="enter-btn" onClick={() => setStep('gate')}>
            Entra <span aria-hidden="true">↓</span>
          </button>
        )}

        {step === 'gate' && (
          <form className="ig-gate" onSubmit={handleGateSubmit} noValidate>
            <label className="ig-label" htmlFor="ig-profile">
              Lasciami il tuo profilo Instagram per continuare
            </label>
            <input
              id="ig-profile"
              className="ig-input"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={100}
              placeholder="@tuoprofilo"
              value={igInput}
              onChange={(event) => {
                setIgInput(event.target.value);
                if (igError) setIgError(null);
              }}
              aria-invalid={igError ? 'true' : 'false'}
              aria-describedby={igError ? 'ig-error' : undefined}
            />
            {igError && (
              <p id="ig-error" className="ig-error" role="alert">
                {igError}
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Un attimo…' : 'Continua'}
            </button>
          </form>
        )}

        {step === 'entered' && (
          <div className="cta-group">
            <a className="btn btn-primary" href={WHATSAPP_DM_URL}>
              💬 Hai domande? Scrivimi
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
