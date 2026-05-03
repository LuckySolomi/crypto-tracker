import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { PortfolioItem } from '../../models/portfolio-item.interface';
import { CoinService } from '../../services/coin.service';
import { PortfolioService } from '../../services/portfolio.service';
import { RouterLink } from '@angular/router';
import { Coin } from '../../models/coin.interface';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EditCoinDialog } from '../../components/edit-coin-dialog/edit-coin-dialog';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';
import { combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, MatDialogModule, MatSnackBarModule],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio implements OnInit {
  private coinService = inject(CoinService);
  private portfolioService = inject(PortfolioService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef); // ✅ додаємо

  portfolio: PortfolioItem[] = [];
  totalBalance = 0;
  totalProfit = 0;
  coins: Coin[] = [];

  ngOnInit(): void {
    const portfolioSub = combineLatest([
      this.coinService.getCoins(),
      this.portfolioService.getPortfolio$(),
    ]).subscribe(([coins, rawPortfolio]) => {
      this.mapPortfolio(rawPortfolio, coins);
    });

    this.subscription.add(portfolioSub);
  }

  private subscription = new Subscription();
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private mapPortfolio(rawPortfolio: PortfolioItem[], coins: Coin[]): void {
    this.portfolio = rawPortfolio.map((item) => {
      const coin = coins.find((c) => c.id === item.id);

      return {
        ...item,
        name: coin?.name ?? item.name,
        symbol: coin?.symbol ?? item.symbol,
        image: coin?.image ?? '',
        currentPrice: coin?.current_price ?? 0,
      };
    });

    this.calculateTotals();
    this.cdr.detectChanges();
  }

  // 🔹 CALCULATIONS

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

  deleteCoin(item: PortfolioItem): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '350px',
      data: { name: item.name },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.portfolioService.deleteCoin(item.id);
        this.showSnackBar(`${item.name} deleted`);
      }
    });
  }

  editCoin(item: PortfolioItem): void {
    const dialogRef = this.dialog.open(EditCoinDialog, {
      width: '400px',
      data: { ...item },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.portfolioService.updateCoin(item.id, result.amount, result.totalUsd);
        this.showSnackBar(`${item.name} updated`);
      }
    });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, '', {
      duration: 2000,
      panelClass: ['success-snackbar'],
    });
  }
}
