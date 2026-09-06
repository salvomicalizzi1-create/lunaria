import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Link } from '@/lib/i18n/navigation';

type Variant = 'primary' | 'ghost';

type BaseProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  /** Shown to everyone, not only on hover: a disabled control must say why. */
  reason?: string;
};

type ButtonProps = BaseProps & ComponentPropsWithoutRef<'button'> & { href?: never };
type LinkProps = BaseProps & { href: string } & Omit<ComponentPropsWithoutRef<'a'>, 'href'>;

export function Button(props: ButtonProps | LinkProps) {
  const { variant = 'primary', children, className, reason, ...rest } = props as BaseProps & {
    href?: string;
  } & Record<string, unknown>;

  const classes = clsx('btn', `btn--${variant}`, className);

  if (typeof rest.href === 'string') {
    const { href, ...anchorRest } = rest as { href: string } & ComponentPropsWithoutRef<'a'>;
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as ComponentPropsWithoutRef<'button'>;
  return (
    <button
      type={buttonRest.type ?? 'button'}
      className={classes}
      title={buttonRest.disabled ? reason : undefined}
      {...buttonRest}
    >
      {children}
    </button>
  );
}

export default Button;
