import React, { type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useReducedMotion } from 'motion/react';

type ConfirmationInput = 'keyboard' | 'pointer';
type HoldStatus = 'idle' | 'holding' | 'confirmed';

type HoldToConfirmButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'onClick'> & {
  children?: ReactNode;
  confirmedContent?: ReactNode;
  duration?: number;
  onConfirm: (input: ConfirmationInput) => void;
  resetAfter?: number;
};

export function HoldToConfirmButton({
  children = 'Basılı tutarak sil',
  className = '',
  confirmedContent,
  disabled,
  duration = 1200,
  onConfirm,
  resetAfter = 1500,
  ...buttonProps
}: HoldToConfirmButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerId = useRef<number | null>(null);
  const holding = useRef(false);
  const inputMode = useRef<ConfirmationInput>('pointer');
  const [mode, setMode] = useState<ConfirmationInput | null>(null);
  const [status, setStatus] = useState<HoldStatus>('idle');
  const reduceMotion = useReducedMotion();

  const clearConfirm = useCallback(() => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = null;
  }, []);

  const cancel = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    pointerId.current = null;
    clearConfirm();
    setStatus('idle');
  }, [clearConfirm]);

  const complete = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    pointerId.current = null;
    clearConfirm();
    setStatus('confirmed');
    onConfirm(inputMode.current);
    if (resetAfter > 0) {
      resetTimer.current = setTimeout(() => {
        setStatus('idle');
        resetTimer.current = null;
      }, resetAfter);
    }
  }, [clearConfirm, onConfirm, resetAfter]);

  const start = useCallback((input: ConfirmationInput) => {
    if (disabled || status === 'confirmed' || holding.current) return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = null;
    inputMode.current = input;
    setMode(input);
    holding.current = true;
    setStatus('holding');
    confirmTimer.current = setTimeout(complete, duration);
  }, [complete, disabled, duration, status]);

  useEffect(() => () => {
    clearConfirm();
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, [clearConfirm]);

  useEffect(() => {
    if (disabled) cancel();
  }, [cancel, disabled]);

  const releaseCapture = (id: number) => {
    const el = buttonRef.current;
    if (el?.hasPointerCapture(id)) el.releasePointerCapture(id);
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!e.isPrimary || e.button !== 0 || disabled) return;
    pointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    start('pointer');
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!holding.current || pointerId.current !== e.pointerId) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX < r.left - 8 || e.clientX > r.right + 8 || e.clientY < r.top - 8 || e.clientY > r.bottom + 8) {
      cancel();
      releaseCapture(e.pointerId);
    }
  };

  const onPointerEnd = (e: PointerEvent<HTMLButtonElement>) => {
    if (pointerId.current !== e.pointerId) return;
    cancel();
    releaseCapture(e.pointerId);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    start('keyboard');
  };

  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    cancel();
  };

  const confirmed = status === 'confirmed';
  const isHolding = status === 'holding';

  return (
    <button
      {...buttonProps}
      ref={buttonRef}
      type="button"
      disabled={disabled}
      aria-busy={isHolding}
      data-input={mode}
      onBlur={cancel}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onLostPointerCapture={cancel}
      onPointerCancel={onPointerEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      className={`relative isolate inline-flex min-h-8 touch-none select-none items-center justify-center overflow-hidden rounded-lg border border-rose-300/70 bg-rose-500/15 px-3 py-1.5 text-[11px] font-bold text-rose-100 outline-none transition-[transform,background-color] duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-400/25 ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        {confirmed ? <><Check aria-hidden="true" size={14} />{confirmedContent ?? 'Silindi'}</> : children}
      </span>
      {!confirmed && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center gap-1.5 bg-rose-600 px-3 text-white"
          style={{
            clipPath: isHolding ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
            transitionProperty: 'clip-path',
            transitionDuration: reduceMotion || mode === 'keyboard' ? '0ms' : isHolding ? `${duration}ms` : '180ms',
            transitionTimingFunction: isHolding ? 'linear' : 'cubic-bezier(0.23,1,0.32,1)',
          }}
        >
          {children}
        </span>
      )}
    </button>
  );
}
