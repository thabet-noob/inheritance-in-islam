import { useEffect, useRef, useState } from 'react';
import { track } from '../analytics';
import { Strings } from '../i18n/strings';

interface Props {
  s: Strings;
  url: string;
  text: string; // full summary (WhatsApp, Telegram, email, native share)
}

const enc = encodeURIComponent;

export function ShareMenu({ s, url, text }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const links = [
    { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${text}\n\n${url}`)}` },
    { key: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(s.shareShort)}&url=${enc(url)}` },
    { key: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { key: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { key: 'email', label: s.shareEmail, href: `mailto:?subject=${enc(s.title)}&body=${enc(`${text}\n\n${url}`)}` },
  ];

  const copy = async () => {
    track('share', { channel: 'copy-link' });
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt(s.shareCopy, url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share" ref={ref}>
      <button
        className="action"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (!open) track('share-menu-opened');
          setOpen(!open);
        }}
      >
        <span aria-hidden="true">⤴</span> {s.share}
      </button>
      {open && (
        <div className="share__menu" role="menu">
          {canNativeShare && (
            <button
              role="menuitem"
              className="share__item share__item--native"
              onClick={() => {
                track('share', { channel: 'native' });
                navigator.share({ title: s.title, text, url }).catch(() => undefined);
              }}
            >
              {s.shareNative}
            </button>
          )}
          {links.map((l) => (
            <a
              key={l.key}
              role="menuitem"
              className={`share__item share__item--${l.key}`}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track('share', { channel: l.key });
                setOpen(false);
              }}
            >
              {l.label}
            </a>
          ))}
          <button role="menuitem" className="share__item" onClick={copy}>
            {copied ? s.shareCopied : s.shareCopy}
          </button>
          <p className="share__note">{s.sharePrivacy}</p>
        </div>
      )}
    </div>
  );
}
