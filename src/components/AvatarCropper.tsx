import React, { useEffect, useState } from 'react';
import { X, Check, ZoomIn, ZoomOut, Circle, Square, RectangleHorizontal } from 'lucide-react';

export type AvatarShape = 'circle' | 'rounded' | 'square';

export const AvatarCropper: React.FC<{ file: File; onCancel: () => void; onSave: (file: File, shape: AvatarShape) => Promise<void> }> = ({ file, onCancel, onSave }) => {
  const [preview, setPreview] = useState('');
  const [zoom, setZoom] = useState(1);
  const [shape, setShape] = useState<AvatarShape>('circle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  const save = async () => {
    setBusy(true); setError('');
    try {
      const image = await createImageBitmap(file);
      const side = Math.min(image.width, image.height) / zoom;
      const sx = (image.width - side) / 2; const sy = (image.height - side) / 2;
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Fotoğraf düzenlenemedi.');
      ctx.drawImage(image, sx, sy, side, side, 0, 0, 512, 512); image.close();
      if (shape !== 'square') {
        ctx.globalCompositeOperation = 'destination-in'; ctx.beginPath();
        if (shape === 'circle') ctx.arc(256, 256, 256, 0, Math.PI * 2);
        else ctx.roundRect(0, 0, 512, 512, 92);
        ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      }
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Fotoğraf dışa aktarılamadı.')), 'image/png'));
      await onSave(new File([blob], 'abstract-avatar.png', { type: 'image/png' }), shape);
    } catch (e) { setError(e instanceof Error ? e.message : 'Fotoğraf düzenlenemedi.'); }
    finally { setBusy(false); }
  };
  const shapeOptions: { value: AvatarShape; label: string; icon: React.ReactNode }[] = [
    { value: 'circle', label: 'Yuvarlak', icon: <Circle size={17} /> },
    { value: 'rounded', label: 'Yuvarlatılmış kare', icon: <RectangleHorizontal size={17} /> },
    { value: 'square', label: 'Kare', icon: <Square size={17} /> }
  ];
  return <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title" className="w-full max-w-md rounded-t-3xl border border-[var(--ln)] bg-[var(--sf)] p-5 shadow-2xl sm:rounded-3xl">
      <header className="flex items-center justify-between"><div><h2 id="avatar-crop-title" className="text-base font-bold text-[var(--ink)]">Profil fotoğrafını düzenle</h2><p className="mt-1 text-xs text-[var(--mu)]">Fotoğrafı yakınlaştır ve görüntü şeklini seç.</p></div><button type="button" onClick={onCancel} disabled={busy} aria-label="Kapat" className="rounded-xl p-2 text-[var(--mu)] hover:bg-[var(--bg)]"><X size={18}/></button></header>
      <div className="mt-5 flex justify-center"><div className="h-52 w-52 overflow-hidden bg-[var(--bg)] shadow-inner" style={{ borderRadius: shape === 'circle' ? '9999px' : shape === 'rounded' ? '28px' : '4px' }}>{preview && <img src={preview} alt="Kırpma önizlemesi" className="h-full w-full object-cover" style={{ transform: `scale(${zoom})` }} />}</div></div>
      <div className="mt-5 flex items-center gap-3"><ZoomOut size={16} className="text-[var(--mu)]"/><input aria-label="Yakınlaştırma" type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="min-w-0 flex-1 accent-sky-700"/><ZoomIn size={16} className="text-[var(--mu)]"/></div>
      <div className="mt-4 grid grid-cols-3 gap-2">{shapeOptions.map(option => <button key={option.value} type="button" onClick={() => setShape(option.value)} className={'flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 text-[11px] font-semibold ' + (shape === option.value ? 'border-sky-600 bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200' : 'border-[var(--ln)] text-[var(--mu)]')} >{option.icon}<span>{option.label}</span></button>)}</div>
      {error && <p role="alert" className="mt-3 text-xs text-rose-600">{error}</p>}
      <div className="mt-5 flex gap-2"><button type="button" onClick={onCancel} disabled={busy} className="min-h-11 flex-1 rounded-xl border border-[var(--ln)] text-sm font-semibold text-[var(--mu)]">Vazgeç</button><button type="button" onClick={() => void save()} disabled={busy} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-700 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Kaydediliyor…' : <><Check size={16}/> Fotoğrafı kullan</>}</button></div>
    </section>
  </div>;
};