'use client';

import { useState } from 'react';
import App from '@/components/band/App';
import './invite-overlay.css';

const WHATSAPP_NUMBER = '393494103162';
const WHATSAPP_MESSAGE = 'Ciao! Ho visto la storia della festa, mi dai qualche info in più?';
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/FHj2uIKjqMD2e7gZId5lUD?s=cl&p=i&mlu=4&amv=2';
const WHATSAPP_DM_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export default function Home() {
  const [entered, setEntered] = useState(false);

  return (
    <main className="invite-scene">
      <App />
      <div className="invite-overlay">
        {!entered ? (
          <button type="button" className="enter-btn" onClick={() => setEntered(true)}>
            Entra <span aria-hidden="true">↓</span>
          </button>
        ) : (
          <div className="cta-group">
            <a className="btn btn-primary" href={WHATSAPP_DM_URL}>
              💬 Hai domande? Scrivimi
            </a>
            <a className="btn btn-secondary" href={WHATSAPP_GROUP_URL}>
              👥 Entra nel gruppo
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
