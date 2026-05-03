import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';
import { Coin } from '../models/coin.interface';

@Injectable({
  providedIn: 'root',
})
export class CoinService {
  private http = inject(HttpClient);

  private apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';

  private cache: Coin[] | null = null;
  private chartCache: Record<string, any> = {};

  private readonly STORAGE_KEY = 'crypto-coins-cache';
  private readonly STORAGE_TIME_KEY = 'crypto-coins-cache-time';
  private readonly CACHE_DURATION = 12 * 60 * 60 * 1000;

  // COINS LIST
  getCoins(): Observable<Coin[]> {
    const cached = this.getValidCache();

    if (cached) {
      return of(cached);
    }

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
      .pipe(tap((coins) => this.saveCache(coins)));
  }

  //  SINGLE COIN
  getCoinById(id: string): Observable<Coin | undefined> {
    return this.getCoins().pipe(map((coins) => coins.find((coin) => coin.id === id)));
  }

  // CACHE
  private getValidCache(): Coin[] | null {
    const now = Date.now();

    if (this.cache) return this.cache;

    const storedData = localStorage.getItem(this.STORAGE_KEY);
    const storedTime = localStorage.getItem(this.STORAGE_TIME_KEY);

    if (!storedData || !storedTime) return null;

    const age = now - Number(storedTime);

    if (age > this.CACHE_DURATION) {
      this.clearCache();
      return null;
    }

    const parsed = JSON.parse(storedData);
    this.cache = parsed;

    return parsed;
  }

  private saveCache(coins: Coin[]): void {
    this.cache = coins;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(coins));
    localStorage.setItem(this.STORAGE_TIME_KEY, Date.now().toString());
  }

  clearCache(): void {
    this.cache = null;

    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_TIME_KEY);
  }

  // Chart data with caching
  getCoinChart(id: string, days: string): Observable<any> {
    const cacheKey = `${id}-${days}`;

    const storageKey = `crypto-chart-${cacheKey}`;
    const storageTimeKey = `crypto-chart-time-${cacheKey}`;

    // memory cache
    if (this.chartCache[cacheKey]) {
      return of(this.chartCache[cacheKey]);
    }

    // localStorage cache
    const storedData = localStorage.getItem(storageKey);
    const storedTime = localStorage.getItem(storageTimeKey);

    if (storedData && storedTime) {
      const age = Date.now() - Number(storedTime);

      if (age < this.CACHE_DURATION) {
        const parsed = JSON.parse(storedData);
        this.chartCache[cacheKey] = parsed;
        return of(parsed);
      }
    }

    return this.http
      .get<any>(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days,
        },
      })
      .pipe(
        tap((data) => {
          this.chartCache[cacheKey] = data;

          localStorage.setItem(storageKey, JSON.stringify(data));
          localStorage.setItem(storageTimeKey, Date.now().toString());
        }),
      );
  }
}
