import { useId } from 'react';
import { IconChevronDown } from './icons/Icons';

const SELECT_SIZE = {
  default:
    'text-base font-semibold sm:text-[17px] lg:text-lg pr-10',
  search:
    'text-sm font-semibold sm:text-[15px] pr-9 truncate',
};

/** Styled select — full-width hit target, label opens dropdown */
export default function SelectField({
  label,
  children,
  className = '',
  labelClassName = 'text-caption',
  id: idProp,
  selectSize = 'default',
  disabled,
  ...props
}) {
  const autoId = useId();
  const selectId = idProp || autoId;

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      {label && (
        <label htmlFor={selectId} className={`${labelClassName} cursor-pointer`}>
          {label}
        </label>
      )}
      <div className="relative mt-2 min-h-[2.25rem] min-w-0">
        <select
          {...props}
          id={selectId}
          disabled={disabled}
          className={`relative z-[1] w-full max-w-full min-w-0 cursor-pointer appearance-none border-0 bg-transparent py-1 text-ink outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ${SELECT_SIZE[selectSize] || SELECT_SIZE.default}`}
        >
          {children}
        </select>
        <span
          className="pointer-events-none absolute inset-y-0 right-0 flex w-9 shrink-0 items-center justify-center text-ink-muted"
          aria-hidden
        >
          <IconChevronDown size={selectSize === 'search' ? 16 : 18} />
        </span>
      </div>
    </div>
  );
}
