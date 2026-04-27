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
import type { Coin } from '../../models/coin.interface';

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
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe, RouterLink, BaseChartDirective],
  templateUrl: './coin-details.html',
  styleUrl: './coin-details.css',
})
export class CoinDetails implements OnInit {
  // Дозволяє керувати графіком безпосередньо (для оновлення даних)
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private route = inject(ActivatedRoute);
  private coinService = inject(CoinService);

  coin: Coin | null = null;
  loading = true;

  // STATE
  coinAmount = 1;
  usdValue = 0;
  errorMessage = '';
  successMessage = '';

  // DESCRIPTION
  isDescriptionExpanded = false;
  description = `
  is one of the leading cryptocurrencies in the digital asset market.
  It has attracted significant attention from investors, traders, and blockchain enthusiasts worldwide.
  Its market performance, adoption, and innovative technology continue to shape the future of decentralized finance.
  `;

  public lineChartType: 'line' = 'line';

  // Початкові дані (порожні)
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

  // Оновлені налаштування: адаптивність та взаємодія
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
          maxTicksLimit: 8, // Щоб не захаращувати вісь на мобільних
          maxRotation: 0,
        },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: (value) => '$' + value,
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

  loadChart(coinId: string): void {
    this.coinService.getCoinChart(coinId).subscribe({
      next: (data) => {
        const prices = data.prices;

        // ОПТИМІЗАЦІЯ: беремо кожну 3-тю точку (якщо API дає дані щогодини, це буде 3-год інтервал)
        const filteredData = prices.filter((_: any, index: number) => index % 3 === 0);

        // Оновлюємо дані всередині існуючого об'єкта (важливо для ng2-charts)
        this.lineChartData.labels = filteredData.map((price: number[]) =>
          new Date(price[0]).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        );

        this.lineChartData.datasets[0].data = filteredData.map((price: number[]) => price[1]);

        // Примусово перемальовуємо графік
        this.chart?.update();
      },
      error: (error) => console.error(error),
    });
  }

  // CALCULATOR LOGIC
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

  // PORTFOLIO
  addToPortfolio(): void {
    if (!this.coin || this.coinAmount <= 0) {
      this.errorMessage = 'Enter valid values';
      return;
    }
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
    this.coinAmount = 1;
    this.onCoinInput();
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = ''), 2000);
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
