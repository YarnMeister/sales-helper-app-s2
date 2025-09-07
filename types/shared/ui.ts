/**
 * Shared UI Component Types
 * 
 * Common types for UI components that are shared across all feature modules.
 * This ensures consistency in component interfaces and behavior.
 */

/**
 * Base component props interface
 */
export interface BaseComponentProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
  children?: React.ReactNode;
}

/**
 * Loading state interface
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  retry?: () => void;
}

/**
 * Button variants
 */
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'destructive' 
  | 'link';

/**
 * Button sizes
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Button props interface
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * Input field types
 */
export type InputType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url' 
  | 'search' 
  | 'date' 
  | 'time' 
  | 'datetime-local';

/**
 * Input field props interface
 */
export interface InputProps extends BaseComponentProps {
  type?: InputType;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  name?: string;
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Select option interface
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

/**
 * Select props interface
 */
export interface SelectProps<T = string> extends BaseComponentProps {
  options: SelectOption<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  helperText?: string;
}

/**
 * Modal props interface
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventClose?: boolean;
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification props interface
 */
export interface ToastProps extends BaseComponentProps {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

/**
 * Table column interface
 */
export interface TableColumn<T = any> {
  key: keyof T | string;
  header: string;
  width?: string | number;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

/**
 * Table props interface
 */
export interface TableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  sortable?: boolean;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selected: T[]) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

/**
 * Form field validation interface
 */
export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

/**
 * Form field interface
 */
export interface FormField<T = any> {
  name: keyof T;
  label: string;
  type: InputType | 'select' | 'textarea' | 'checkbox' | 'radio';
  placeholder?: string;
  options?: SelectOption[];
  validation?: FormFieldValidation;
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
  helperText?: string;
  className?: string;
}

/**
 * Form props interface
 */
export interface FormProps<T = any> extends BaseComponentProps {
  fields: FormField<T>[];
  initialValues?: Partial<T>;
  onSubmit: (values: T) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  validationSchema?: any; // Zod schema
  showValidationErrors?: boolean;
}

/**
 * Card props interface
 */
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

/**
 * Badge props interface
 */
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  dot?: boolean;
}

/**
 * Tooltip props interface
 */
export interface TooltipProps extends BaseComponentProps {
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  children: React.ReactElement;
}

/**
 * Dropdown menu item interface
 */
export interface DropdownMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
  children?: DropdownMenuItem[];
}

/**
 * Dropdown menu props interface
 */
export interface DropdownMenuProps extends BaseComponentProps {
  items: DropdownMenuItem[];
  trigger: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Tabs interface
 */
export interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  content: React.ReactNode;
}

/**
 * Tabs props interface
 */
export interface TabsProps extends BaseComponentProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * Accordion item interface
 */
export interface AccordionItem {
  key: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  defaultOpen?: boolean;
}

/**
 * Accordion props interface
 */
export interface AccordionProps extends BaseComponentProps {
  items: AccordionItem[];
  multiple?: boolean;
  defaultOpen?: string[];
  onItemToggle?: (key: string, open: boolean) => void;
  variant?: 'default' | 'bordered' | 'separated';
}

/**
 * Progress bar props interface
 */
export interface ProgressBarProps extends BaseComponentProps {
  value: number;
  max?: number;
  min?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  animated?: boolean;
  striped?: boolean;
}

/**
 * Spinner props interface
 */
export interface SpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary';
  label?: string;
}

/**
 * Alert props interface
 */
export interface AlertProps extends BaseComponentProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  autoDismiss?: number;
}

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

/**
 * Breadcrumb props interface
 */
export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  showHome?: boolean;
  homeIcon?: React.ReactNode;
}

/**
 * Pagination props interface
 */
export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  showPageInfo?: boolean;
  showPageSizeSelector?: boolean;
  disabled?: boolean;
}

/**
 * Search input props interface
 */
export interface SearchInputProps extends BaseComponentProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  loading?: boolean;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  debounceMs?: number;
  minLength?: number;
}

/**
 * File upload props interface
 */
export interface FileUploadProps extends BaseComponentProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  onFileSelect?: (files: File[]) => void;
  onFileRemove?: (file: File) => void;
  disabled?: boolean;
  dragAndDrop?: boolean;
  preview?: boolean;
  error?: string;
  helperText?: string;
}

/**
 * Date picker props interface
 */
export interface DatePickerProps extends BaseComponentProps {
  value?: Date;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  clearable?: boolean;
  showTime?: boolean;
  timeFormat?: '12h' | '24h';
}

/**
 * Color picker props interface
 */
export interface ColorPickerProps extends BaseComponentProps {
  value?: string;
  onChange?: (color: string) => void;
  presetColors?: string[];
  showAlpha?: boolean;
  format?: 'hex' | 'rgb' | 'hsl';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Rating props interface
 */
export interface RatingProps extends BaseComponentProps {
  value: number;
  max?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  allowHalf?: boolean;
  clearable?: boolean;
}

/**
 * Switch props interface
 */
export interface SwitchProps extends BaseComponentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  loading?: boolean;
}

/**
 * Checkbox props interface
 */
export interface CheckboxProps extends BaseComponentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  label?: string;
  description?: string;
  required?: boolean;
  error?: string;
}

/**
 * Radio group props interface
 */
export interface RadioGroupProps extends BaseComponentProps {
  value?: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  direction?: 'horizontal' | 'vertical';
}

/**
 * Textarea props interface
 */
export interface TextareaProps extends BaseComponentProps {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  minLength?: number;
  rows?: number;
  cols?: number;
  resize?: 'none' | 'horizontal' | 'vertical' | 'both';
  name?: string;
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Divider props interface
 */
export interface DividerProps extends BaseComponentProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  margin?: string | number;
}

/**
 * Skeleton props interface
 */
export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Avatar props interface
 */
export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  fallback?: string | React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
  statusColor?: string;
}

/**
 * Menu item interface
 */
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
  href?: string;
  target?: string;
  children?: MenuItem[];
}

/**
 * Menu props interface
 */
export interface MenuProps extends BaseComponentProps {
  items: MenuItem[];
  mode?: 'horizontal' | 'vertical' | 'inline';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  selectedKeys?: string[];
  onSelect?: (keys: string[]) => void;
  openKeys?: string[];
  onOpenChange?: (keys: string[]) => void;
}
