import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PipesModule } from "../../pipes/mask.module";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, PipesModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  showUserMenu = false;
  isMobile = window.innerWidth <= 768;
  currentUser = { name: 'Usuario'}; 

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

    cpf = '12345678901';
  cnpj = '12345678000199';
  phone = '9981708802';
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
    localStorage.removeItem('token');    
    this.router.navigate(['/login']);
  }

  constructor(private router: Router) {}
}
