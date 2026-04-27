import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CoinService } from '../../services/coin.service';
import type { Coin } from '../../models/coin.interface';

@Component({
  selector: 'app-coin-details',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe, RouterLink],
  templateUrl: './coin-details.html',
  styleUrl: './coin-details.css',
})
export class CoinDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private coinService = inject(CoinService);

  coin: Coin | null = null;
  loading = true;

  // STATE

  coinAmount = 1;
  usdValue = 0;

  errorMessage = '';
  successMessage = '';

  //  DESCRIPTION

  isDescriptionExpanded = false;

  description = `
  is one of the leading cryptocurrencies in the digital asset market.
  It has attracted significant attention from investors, traders, and blockchain enthusiasts worldwide.
  Its market performance, adoption, and innovative technology continue to shape the future of decentralized finance.
  As one of the most recognized digital assets, it plays an important role in the rapidly evolving blockchain industry.
  Investors often monitor its price movements, market capitalization, trading volume, and adoption trends to make informed decisions.
  `;

  // INIT

  ngOnInit(): void {
    const coinId = this.route.snapshot.paramMap.get('id');

    if (!coinId) return;

    this.coinService.getCoinById(coinId).subscribe({
      next: (data) => {
        if (!data) {
          this.loading = false;
          return;
        }

        this.coin = data;

        // старт калькулятора
        this.coinAmount = 1;
        this.onCoinInput();

        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.loading = false;
      },
    });
  }

  // LIVE CALCULATOR

  onCoinInput(): void {
    if (!this.coin) return;

    this.coinAmount = Math.max(0, this.coinAmount);

    this.usdValue = this.coinAmount ? +(this.coinAmount * this.coin.current_price).toFixed(2) : 0;
  }

  onUsdInput(): void {
    if (!this.coin) return;

    this.usdValue = Math.max(0, this.usdValue);

    this.coinAmount = this.usdValue ? +(this.usdValue / this.coin.current_price).toFixed(8) : 0;
  }

  //  PORTFOLIO

  addToPortfolio(): void {
    if (!this.coin) return;

    if (this.coinAmount <= 0 || this.usdValue <= 0) {
      this.errorMessage = 'Enter valid values greater than 0';
      return;
    }

    this.errorMessage = '';

    const STORAGE_KEY = 'crypto-portfolio';

    const portfolio = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    const index = portfolio.findIndex((item: any) => item.id === this.coin!.id);

    if (index !== -1) {
      portfolio[index].amount += this.coinAmount;
      portfolio[index].totalUsd += this.usdValue;
    } else {
      portfolio.push({
        id: this.coin.id,
        name: this.coin.name,
        symbol: this.coin.symbol,
        amount: this.coinAmount,
        totalUsd: this.usdValue,
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));

    this.showSuccess('Added to portfolio');

    // reset (UX-friendly)
    this.coinAmount = 1;
    this.onCoinInput();
  }

  // TOAST

  showSuccess(message: string): void {
    this.successMessage = message;

    setTimeout(() => {
      this.successMessage = '';
    }, 2000);
  }

  // DESCRIPTION LOGIC

  get displayedDescription(): string {
    if (!this.coin) return '';

    const fullText = `${this.coin.name} ${this.description}`;

    return this.isDescriptionExpanded ? fullText : fullText.slice(0, 350) + '...';
  }

  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }
}
