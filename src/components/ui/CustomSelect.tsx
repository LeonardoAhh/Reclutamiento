import { useMemo, useState, type AriaAttributes, type ReactNode } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, ChevronUp } from 'lucide';
import { CircleCheckBig } from 'lucide-react';
import {
  FLOATING_SURFACE_COLLISION_PADDING,
  FLOATING_SURFACE_SIDE_OFFSET,
} from '@/lib/floatingSurface';
import { cn } from '@/lib/utils-shadcn';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import './CustomSelect.css';

export interface Option {
  value: string;
  label: string;
}

type SelectAriaProps = Pick<
  AriaAttributes,
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'aria-invalid'
  | 'aria-required'
>;

interface CustomSelectProps extends SelectAriaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  customTrigger?: ReactNode;
}

const ITEM_VALUE_PREFIX = 'custom-select-item:';
const EMPTY_STATE_ITEM_VALUE = 'custom-select-empty-state';

function getItemValue(value: string) {
  return `${ITEM_VALUE_PREFIX}${encodeURIComponent(value)}`;
}

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className,
  disabled = false,
  customTrigger,
  ...ariaProps
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const visibleOptions = useMemo(
    () =>
      placeholder && !options.some((option) => option.value === '')
        ? [{ value: '', label: placeholder }, ...options]
        : options,
    [options, placeholder],
  );
  const selectedItemValue = visibleOptions.some((option) => option.value === value)
    ? getItemValue(value)
    : undefined;
  const isRequired =
    ariaProps['aria-required'] === true || ariaProps['aria-required'] === 'true';

  const handleValueChange = (itemValue: string) => {
    const option = visibleOptions.find(
      (candidate) => getItemValue(candidate.value) === itemValue,
    );

    if (option) onChange(option.value);
  };

  return (
    <div className={cn('custom-select-container', className)}>
      <SelectPrimitive.Root
        value={selectedItemValue}
        onValueChange={handleValueChange}
        onOpenChange={setIsOpen}
        disabled={disabled}
        required={isRequired}
      >
        <SelectPrimitive.Trigger
          id={id}
          className={cn(
            'custom-select-trigger',
            customTrigger && 'custom-select-trigger--unstyled',
            !selectedOption && !customTrigger && 'is-placeholder',
          )}
          {...ariaProps}
        >
          {customTrigger ? (
            <SelectPrimitive.Value className="custom-select-value">
              {customTrigger}
            </SelectPrimitive.Value>
          ) : (
            <SelectPrimitive.Value
              className="custom-select-value"
              placeholder={placeholder}
            />
          )}

          {!customTrigger && (
            <SelectPrimitive.Icon asChild>
              <MorphingIcon
                icon={isOpen ? ChevronUp : ChevronDown}
                aria-hidden="true"
                className="custom-select-icon"
              />
            </SelectPrimitive.Icon>
          )}
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="custom-select-dropdown"
            position="popper"
            align="start"
            sideOffset={FLOATING_SURFACE_SIDE_OFFSET}
            collisionPadding={FLOATING_SURFACE_COLLISION_PADDING}
          >
            <SelectPrimitive.Viewport className="custom-select-list">
              {visibleOptions.length > 0 ? (
                visibleOptions.map((option) => (
                  <SelectPrimitive.Item
                    key={`${option.value}-${option.label}`}
                    value={getItemValue(option.value)}
                    className="custom-select-option"
                  >
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="custom-select-check">
                      <CircleCheckBig aria-hidden="true" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))
              ) : (
                <SelectPrimitive.Item
                  className="custom-select-no-results"
                  value={EMPTY_STATE_ITEM_VALUE}
                  disabled
                >
                  <SelectPrimitive.ItemText>Sin opciones</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              )}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
