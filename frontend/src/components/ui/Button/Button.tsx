import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export type ButtonAsButtonProps = BaseButtonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    to?: never;
    href?: never;
  };

export type ButtonAsRouterLinkProps = BaseButtonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
    to: string;
    href?: never;
  };

export type ButtonAsExternalLinkProps = BaseButtonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
    href: string;
    to?: never;
  };

export type ButtonProps =
  | ButtonAsButtonProps
  | ButtonAsRouterLinkProps
  | ButtonAsExternalLinkProps;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  iconPosition = 'right',
  fullWidth = false,
  ...rest
}) => {
  const combinedClassName = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className={styles.iconLeft}>{icon}</span>}
      <span className={styles.label}>{children}</span>
      {icon && iconPosition === 'right' && <span className={styles.iconRight}>{icon}</span>}
    </>
  );

  if ('to' in rest && rest.to) {
    const { to, ...linkProps } = rest as ButtonAsRouterLinkProps;
    return (
      <Link to={to} className={combinedClassName} {...linkProps}>
        {content}
      </Link>
    );
  }

  if ('href' in rest && rest.href) {
    const { href, ...anchorProps } = rest as ButtonAsExternalLinkProps;
    return (
      <a href={href} className={combinedClassName} {...anchorProps}>
        {content}
      </a>
    );
  }

  const buttonProps = rest as ButtonAsButtonProps;
  return (
    <button className={combinedClassName} {...buttonProps}>
      {content}
    </button>
  );
};
