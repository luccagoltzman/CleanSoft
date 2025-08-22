export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'default' | 'success' | 'warning' | 'danger';
export type ModalFooterAlignment = 'left' | 'center' | 'right' | 'space-between';

export interface ModalConfig {
  size?: ModalSize;
  variant?: ModalVariant;
  backdrop?: 'static' | 'dynamic';
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  footerAlignment?: ModalFooterAlignment;
  noPadding?: boolean;
  noHeader?: boolean;
  noFooter?: boolean;
  scrollable?: boolean;
  centered?: boolean;
}
