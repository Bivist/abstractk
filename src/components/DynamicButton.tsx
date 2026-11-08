import React, { type Key, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type DynamicButtonProps = Omit<
  React.ComponentProps<typeof motion.button>,
  'children' | 'animate' | 'exit'
> & {
  children: string;
  icon?: ReactNode;
  stateKey?: Key;
  variant?: 'primary' | 'secondary';
  width?: 'content' | 'full';
};

const labelEase = [0.23, 1, 0.32, 1] as const;

export function DynamicButton({
  children,
  icon,
  stateKey,
  variant = 'primary',
  width = 'content',
  className = '',
  ...props
}: DynamicButtonProps) {
  const reduceMotion = useReducedMotion();
  const transition = { duration: reduceMotion ? 0.01 : 0.2, ease: labelEase };

  return (
    <motion.button
      {...props}
      layout
      initial={false}
      transition={{ layout: { type: 'spring', stiffness: 360, damping: 30 } }}
      className={[
        'relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-xs font-bold',
        'transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98]',
        width === 'full' ? 'w-full flex-1' : 'w-auto',
        variant === 'primary'
          ? 'border border-sky-500/30 bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-600 text-white shadow-md shadow-sky-900/15 hover:brightness-105'
          : 'border border-[#c5dfe9] bg-[#e9f5fa] text-[#164b6b] hover:bg-[#dff0f7] dark:border-[#0d3a55] dark:bg-[#0d2b40] dark:text-sky-100',
        className,
      ].join(' ')}
    >
      {icon && (
        <span className="relative grid size-4 shrink-0 place-items-center overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={stateKey ?? children}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 7 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -7 }}
              transition={transition}
              className="absolute inset-0 flex items-center justify-center"
            >
              {icon}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
      <span className="relative grid min-w-0 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={stateKey ?? children}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            transition={transition}
            className="col-start-1 row-start-1 whitespace-nowrap"
          >
            {children}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
