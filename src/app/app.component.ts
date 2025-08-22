import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { User } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'CleanSoft Estética';
  sidebarCollapsed = false;
  showUserMenu = false;
  currentUser: User | null = null;
  isMobile = false;
  mobileMenuOpen = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Só verificar tamanho da tela se estiver no browser
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
    }
  }

  ngOnDestroy() {
    // Cleanup se necessário
  }

  @HostListener('window:resize')
  onResize() {
    // Só executar se estiver no browser
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
    }
  }

  checkScreenSize() {
    // Verificar se está no browser antes de acessar window
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 768;
      
      // Fechar menu mobile se mudar para desktop
      if (!this.isMobile && this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
      }
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  logout() {
    // Implementar lógica de logout
    console.log('Logout realizado');
    this.showUserMenu = false;
  }
}
