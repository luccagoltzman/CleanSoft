import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats = {
    totalCustomers: 0,
    totalVehicles: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingServices: 0,
    lowStockProducts: 0
  };

  recentSales: any[] = [];
  lowStockProducts: any[] = [];

  constructor() {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Dados mockados para demonstração
    this.stats = {
      totalCustomers: 156,
      totalVehicles: 203,
      totalSales: 89,
      totalRevenue: 15420.50,
      pendingServices: 12,
      lowStockProducts: 8
    };

    this.recentSales = [
      {
        id: 1,
        customer: 'João Silva',
        vehicle: 'ABC-1234',
        total: 180.00,
        date: new Date(),
        status: 'Pago'
      },
      {
        id: 2,
        customer: 'Maria Santos',
        vehicle: 'XYZ-5678',
        total: 250.00,
        date: new Date(Date.now() - 86400000),
        status: 'Pago'
      }
    ];

    this.lowStockProducts = [
      {
        name: 'Shampoo Automotivo',
        currentStock: 5,
        minimumStock: 10
      },
      {
        name: 'Cera de Polimento',
        currentStock: 3,
        minimumStock: 8
      }
    ];
  }
}
