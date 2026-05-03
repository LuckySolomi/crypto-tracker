import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CoinService } from '../../services/coin.service';
import { PortfolioItem } from '../../models/portfolio-item.interface';
import { RouterLink } from '@angular/router';
import { Coin } from '../../models/coin.interface';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EditCoinDialog } from '../../components/edit-coin-dialog/edit-coin-dialog';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, MatDialogModule, MatSnackBarModule],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio implements OnInit {
  private coinService = inject(CoinService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  portfolio: any[] = []; // UI дані
  rawPortfolio: PortfolioItem[] = []; // тільки localStorage

  totalBalance = 0;
  totalProfit = 0;

  private readonly STORAGE_KEY = 'crypto-portfolio';

  ngOnInit(): void {
    this.loadPortfolio();
  }

  // LOAD

  loadPortfolio(): void {
    this.rawPortfolio = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');

    this.coinService.getCoins().subscribe((coins: Coin[]) => {
      this.portfolio = this.rawPortfolio.map((item) => {
        const coin = coins.find((c) => c.id === item.id);

        return {
          ...item,
          name: coin?.name ?? '',
          symbol: coin?.symbol ?? '',
          image: coin?.image ?? '',
          currentPrice: coin?.current_price ?? 0,
        };
      });

      this.calculateTotals();
    });
  }

  // CALCULATIONS

  getAvgPrice(item: any): number {
    return item.totalUsd / item.amount;
  }

  getCurrentValue(item: any): number {
    return item.amount * item.currentPrice;
  }

  getProfit(item: any): number {
    const avgBuyPrice = this.getAvgPrice(item);
    return (item.currentPrice - avgBuyPrice) * item.amount;
  }

  calculateTotals(): void {
    this.totalBalance = this.portfolio.reduce((sum, item) => sum + this.getCurrentValue(item), 0);
    this.totalProfit = this.portfolio.reduce((sum, item) => sum + this.getProfit(item), 0);
  }

  // SAVE ONLY RAW DATA

  private saveRaw(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.rawPortfolio));
  }

  // DELETE

  deleteCoin(item: any): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '350px',
      data: { name: item.name },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.rawPortfolio = this.rawPortfolio.filter((i) => i.id !== item.id);
        this.portfolio = this.portfolio.filter((i) => i.id !== item.id);

        this.saveRaw();
        this.calculateTotals();

        this.cdr.detectChanges();

        this.snackBar.open(`${item.name} deleted`, '', {
          duration: 2000,
          panelClass: ['success-snackbar'],
        });
      }
    });
  }

  // EDIT

  editCoin(item: any): void {
    const dialogRef = this.dialog.open(EditCoinDialog, {
      width: '400px',
      data: { ...item },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const index = this.rawPortfolio.findIndex((p) => p.id === item.id);

        if (index !== -1) {
          const safeAmount = Math.max(1, result.amount);
          const safeTotalUsd = Math.max(0, result.totalUsd);

          this.rawPortfolio[index] = {
            ...this.rawPortfolio[index],
            amount: safeAmount,
            totalUsd: safeTotalUsd,
          };

          this.saveRaw();
          this.loadPortfolio();
          this.cdr.detectChanges();

          this.snackBar.open(`${item.name} updated`, '', {
            duration: 2000,
            panelClass: ['success-snackbar'],
          });
        }
      }
    });
  }
}
