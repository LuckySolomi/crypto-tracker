import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Coin } from '../models/coin.interface';

@Injectable({
  providedIn: 'root',
})
export class CoinService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';

  private cache: Coin[] | null = null;

  private readonly STORAGE_KEY = 'crypto-coins-cache';
  private readonly STORAGE_TIME_KEY = 'crypto-coins-cache-time';
  private readonly CACHE_DURATION = 12 * 60 * 60 * 1000;

  getCoins(): Observable<Coin[]> {
    const cached = this.getValidCache();

    if (cached) {
      console.log('Returning cached data');
      return of(cached);
    }

    console.log('Fetching fresh data from API');

    return this.http
      .get<Coin[]>(this.apiUrl, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: '20',
          page: '1',
          sparkline: 'false',
        },
      })
      .pipe(
        tap((coins) => {
          this.saveCache(coins);
        }),
      );
  }

  private getValidCache(): Coin[] | null {
    const now = Date.now();

    // перевірка памʼяті
    if (this.cache) {
      return this.cache;
    }

    // перевірка localStorage
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    const storedTime = localStorage.getItem(this.STORAGE_TIME_KEY);

    if (!storedData || !storedTime) return null;

    const time = Number(storedTime);

    if (now - time > this.CACHE_DURATION) {
      this.clearCache();
      return null;
    }

    const parsed = JSON.parse(storedData);
    this.cache = parsed;

    return parsed;
  }

  private saveCache(coins: Coin[]): void {
    this.cache = coins;
    const now = Date.now();

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(coins));
    localStorage.setItem(this.STORAGE_TIME_KEY, now.toString());
  }

  clearCache(): void {
    this.cache = null;

    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_TIME_KEY);
  }
}
