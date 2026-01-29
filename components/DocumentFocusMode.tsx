'use client';

import { useEffect } from 'react';

export default function DocumentFocusMode() {
  useEffect(() => {
    const body = document.body;
    body.classList.add('focus-mode');
    const toggle = document.getElementById('global-nav-toggle') as HTMLInputElement | null;
    if (toggle) toggle.checked = false;
    return () => {
      body.classList.remove('focus-mode');
      const nextToggle = document.getElementById('global-nav-toggle') as HTMLInputElement | null;
      if (nextToggle) nextToggle.checked = false;
    };
  }, []);

  return null;
}
