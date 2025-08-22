import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ModalConfig } from './modal.types';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="modal-overlay" 
      [class.show]="isOpen"
      [attr.data-backdrop]="config.backdrop"
      (click)="onBackdropClick($event)"
      role="dialog"
      [attr.aria-modal]="isOpen"
      [attr.aria-labelledby]="title ? 'modal-title' : null"
      [attr.aria-describedby]="description ? 'modal-description' : null">
      
      <div 
        #modalContent
        class="modal-content"
        [class]="getModalClasses()"
        (click)="$event.stopPropagation()"
        tabindex="-1"
        role="document">
        
        <!-- Header -->
        <header 
          *ngIf="!config.noHeader"
          class="modal-header"
          [class]="getHeaderClasses()">
          
          <h2 
            *ngIf="title"
            id="modal-title"
            class="modal-title">
            {{ title }}
          </h2>
          
          <button 
            *ngIf="config.showCloseButton !== false"
            type="button"
            class="modal-close"
            (click)="close()"
            [attr.aria-label]="'Fechar ' + (title || 'modal')"
            title="Fechar modal">
            <i class="fas fa-times modal-close-icon"></i>
          </button>
        </header>
        
        <!-- Body -->
        <main 
          class="modal-body"
          [class]="getBodyClasses()">
          <ng-content></ng-content>
        </main>
        
        <!-- Footer -->
        <footer 
          *ngIf="!config.noFooter"
          class="modal-footer"
          [class]="getFooterClasses()">
          <ng-content select="[modal-footer]"></ng-content>
        </footer>
      </div>
    </div>
  `,
  styleUrls: []
})
export class ModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() description = '';
  @Input() config: ModalConfig = {};
  
  @Output() modalOpen = new EventEmitter<void>();
  @Output() modalClose = new EventEmitter<void>();
  @Output() modalBeforeClose = new EventEmitter<void>();
  
  @ViewChild('modalContent') modalContent!: ElementRef<HTMLElement>;
  
  private previousActiveElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.setDefaultConfig();
    if (this.isOpen && isPlatformBrowser(this.platformId)) {
      this.openModal();
    }
  }

  ngAfterViewInit() {
    if (this.isOpen && isPlatformBrowser(this.platformId)) {
      this.setupFocusTrap();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      this.restoreFocus();
      this.enableBodyScroll();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.config.closeOnEscape !== false && this.isOpen && isPlatformBrowser(this.platformId)) {
      this.close();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  onTabKey(event: KeyboardEvent) {
    if (this.isOpen && isPlatformBrowser(this.platformId)) {
      this.handleTabNavigation(event);
    }
  }

  private setDefaultConfig() {
    this.config = {
      size: 'md',
      variant: 'default',
      backdrop: 'dynamic',
      closeOnEscape: true,
      closeOnBackdropClick: true,
      showCloseButton: true,
      footerAlignment: 'right',
      noPadding: false,
      noHeader: false,
      noFooter: false,
      scrollable: true,
      centered: true,
      ...this.config
    };
  }

  open() {
    this.isOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      this.openModal();
    }
  }

  close() {
    this.modalBeforeClose.emit();
    this.isOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      this.closeModal();
    }
  }

  private openModal() {
    this.modalOpen.emit();
    this.disableBodyScroll();
    this.setupFocusTrap();
    
    if (isPlatformBrowser(this.platformId)) {
      this.previousActiveElement = document.activeElement as HTMLElement;
      
      // Focar no modal após a animação
      setTimeout(() => {
        if (this.modalContent) {
          this.modalContent.nativeElement.focus();
        }
      }, 100);
    }
  }

  private closeModal() {
    this.modalClose.emit();
    this.restoreFocus();
    this.enableBodyScroll();
    this.cleanupFocusTrap();
  }

  onBackdropClick(event: Event) {
    if (this.config.closeOnBackdropClick !== false && event.target === event.currentTarget) {
      this.close();
    }
  }

  private setupFocusTrap() {
    if (!this.modalContent || !isPlatformBrowser(this.platformId)) return;

    // Encontrar elementos focáveis
    this.focusableElements = Array.from(
      this.modalContent.nativeElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    if (this.focusableElements.length > 0) {
      this.firstFocusableElement = this.focusableElements[0];
      this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
    }
  }

  private handleTabNavigation(event: KeyboardEvent) {
    if (this.focusableElements.length === 0) return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault();
        this.lastFocusableElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault();
        this.firstFocusableElement?.focus();
      }
    }
  }

  private cleanupFocusTrap() {
    this.focusableElements = [];
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
  }

  private restoreFocus() {
    if (this.previousActiveElement && isPlatformBrowser(this.platformId)) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }

  private disableBodyScroll() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
  }

  private enableBodyScroll() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  private getScrollbarWidth(): number {
    if (!isPlatformBrowser(this.platformId)) return 0;
    
    return window.innerWidth - document.documentElement.clientWidth;
  }

  getModalClasses(): string {
    const classes = [`modal-content--${this.config.size}`];
    
    if (this.config.variant !== 'default') {
      classes.push(`modal--${this.config.variant}`);
    }
    
    if (this.config.centered) {
      classes.push('modal--centered');
    }
    
    if (this.config.scrollable) {
      classes.push('modal--scrollable');
    }
    
    return classes.join(' ');
  }

  getHeaderClasses(): string {
    return '';
  }

  getBodyClasses(): string {
    const classes = [];
    
    if (this.config.noPadding) {
      classes.push('modal--no-padding');
    }
    
    return classes.join(' ');
  }

  getFooterClasses(): string {
    const classes = [];
    
    if (this.config.footerAlignment) {
      classes.push(`modal-footer--${this.config.footerAlignment}`);
    }
    
    return classes.join(' ');
  }
}
