import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  showUserMenu = false;
  isMobile = window.innerWidth <= 768;
  currentUser = { name: 'Usuario'}; 

  ngOnInit() {
  const email = localStorage.getItem('user_email');
  if (email) {
    this.currentUser.name = email;
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
    localStorage.removeItem('token');    
    this.router.navigate(['/login']);
  }

  constructor(private router: Router) {}
}
