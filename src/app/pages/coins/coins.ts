import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { CoinService } from '../../services/coin.service';
import { PortfolioService } from '../../services/portfolio.service';
import { Coin } from '../../models/coin.interface';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShortNumberPipe } from '../../pipes/short-number.pipe';

@Component({
  selector: 'app-coins',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, RouterLink, ShortNumberPipe],
  templateUrl: './coins.html',
  styleUrl: './coins.css',
})
export class Coins implements OnInit {
  private coinService = inject(CoinService);
  private portfolioService = inject(PortfolioService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  coins: Coin[] = [];
  loading = true;
  error = '';

  //PAGINATION
  currentPage = 1;
  itemsPerPage = 7;

  ngOnInit(): void {
    this.loadCoins();
  }

  private loadCoins(): void {
    this.loading = true;
    this.error = '';

    this.coinService.getCoins().subscribe({
      next: (data) => {
        this.coins = data;
        this.currentPage = 1;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load cryptocurrency data.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // дані для таблиці
  get paginatedCoins(): Coin[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.coins.slice(start, start + this.itemsPerPage);
  }

  // кількість сторінок
  get totalPages(): number {
    return Math.ceil(this.coins.length / this.itemsPerPage);
  }

  // масив сторінок
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // перемикання
  goToPage(page: number): void {
    this.currentPage = page;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  addToPortfolio(coin: Coin): void {
    this.portfolioService.addCoin({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      amount: 1,
      totalUsd: coin.current_price,
    });

    this.snackBar.open(`${coin.name} added to portfolio`, '', {
      duration: 2000,
      panelClass: ['success-snackbar'],
    });
  }
}
