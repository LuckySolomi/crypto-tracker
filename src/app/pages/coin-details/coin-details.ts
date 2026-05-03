import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import {
  ChartConfiguration,
  ChartOptions,
  Chart,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

import { CoinService } from '../../services/coin.service';
import { PortfolioService } from '../../services/portfolio.service';
import type { Coin } from '../../models/coin.interface';
import { ShortNumberPipe } from '../../pipes/short-number.pipe';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

Chart.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

@Component({
  selector: 'app-coin-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    MatSnackBarModule,
    BaseChartDirective,
    ShortNumberPipe,
  ],
  templateUrl: './coin-details.html',
  styleUrl: './coin-details.css',
})
export class CoinDetails implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private route = inject(ActivatedRoute);
  private coinService = inject(CoinService);
  private portfolioService = inject(PortfolioService);
  private snackBar = inject(MatSnackBar);

  coin: Coin | null = null;
  loading = true;

  coinAmount = 1;
  usdValue = 0;
  errorMessage = '';
  successMessage = '';

  isDescriptionExpanded = false;
  description = `
    is one of the leading cryptocurrencies in the digital asset market.
    It has attracted significant attention from investors, traders, and blockchain enthusiasts worldwide.
    Its market performance, adoption, and innovative technology continue to shape the future of decentralized finance.
    As one of the most recognized digital assets, it plays an important role in the rapidly evolving blockchain industry.
    Investors often monitor its price movements, market capitalization, trading volume, and adoption trends to make informed decisions.
  `;

  public lineChartType: 'line' = 'line';

  // Початкові дані
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
      },
    ],
  };

  //  адаптивність та взаємодія
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index', // Лінія X слідує за курсором
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxTicksLimit: 8,
          maxRotation: 0,
        },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: function (value) {
            const numValue = Number(value);
            return (
              '$' +
              numValue.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: numValue < 10 ? 3 : 2,
              })
            );
          },
        },
      },
    },
  };

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
        this.loadChart(coinId);
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

  periods = [
    { label: '24H', value: '1' },
    { label: '7D', value: '7' },
    { label: '30D', value: '30' },
    { label: '1Y', value: '365' },
  ];
  activePeriod = '1';

  changePeriod(days: string): void {
    this.activePeriod = days;
    const coinId = this.route.snapshot.paramMap.get('id');
    if (coinId) {
      this.loadChart(coinId, days);
    }
  }

  loadChart(coinId: string, days: string = '1'): void {
    this.coinService.getCoinChart(coinId, days).subscribe({
      next: (data) => {
        const prices = data.prices;

        const step = days === '1' ? 3 : days === '7' ? 12 : 24;
        const filteredData = prices.filter((_: any, index: number) => index % step === 0);

        this.lineChartData.labels = filteredData.map((price: number[]) => {
          const date = new Date(price[0]);
          // Якщо вибрано більше 1 дня, показуємо дату, а не час
          return days === '1'
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        });

        this.lineChartData.datasets[0].data = filteredData.map((price: number[]) => price[1]);
        this.chart?.update();
      },
      error: (error) => console.error(error),
    });
  }

  // CALCULATOR LOGIC
  onCoinInput(): void {
    if (!this.coin) return;
    this.coinAmount = Math.max(1, this.coinAmount);
    this.usdValue = +(this.coinAmount * this.coin.current_price).toFixed(2);
  }

  onUsdInput(): void {
    if (!this.coin) return;
    this.usdValue = Math.max(0, this.usdValue);
    this.coinAmount = +(this.usdValue / this.coin.current_price).toFixed(8);
  }

  addToPortfolio(): void {
    if (!this.coin || this.coinAmount <= 0) return;

    this.portfolioService.addCoin({
      id: this.coin.id,
      name: this.coin.name,
      symbol: this.coin.symbol,
      amount: this.coinAmount,
      totalUsd: this.usdValue,
    });

    // reset
    this.coinAmount = 1;
    this.onCoinInput();

    // snackbar
    this.snackBar.open('Added to portfolio', '', {
      duration: 2000,
      panelClass: ['success-snackbar'],
    });
  }

  get displayedDescription(): string {
    if (!this.coin) return '';

    const fullText = `${this.coin.name} ${this.description}`;

    return this.isDescriptionExpanded ? fullText : fullText.slice(0, 350) + '...';
  }

  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }
}
