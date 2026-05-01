import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { CoinService } from '../../services/coin.service';
import { Coin } from '../../models/coin.interface';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-coins',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, RouterLink],
  templateUrl: './coins.html',
  styleUrl: './coins.css',
})
export class Coins implements OnInit {
  private coinService = inject(CoinService);
  private snackBar = inject(MatSnackBar);

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
      },
      error: () => {
        this.error = 'Failed to load cryptocurrency data.';
        this.loading = false;
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
    const STORAGE_KEY = 'crypto-portfolio';

    const portfolio = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    const index = portfolio.findIndex((item: any) => item.id === coin.id);

    if (index !== -1) {
      portfolio[index].amount += 1;
      portfolio[index].totalUsd += coin.current_price;
    } else {
      portfolio.push({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        amount: 1,
        totalUsd: coin.current_price,
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));

    this.snackBar.open(`${coin.name} added`, 'OK', {
      duration: 2000,
    });
  }
}
