import { Injectable } from '@angular/core';
import { PortfolioItem } from '../models/portfolio-item.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  private readonly STORAGE_KEY = 'crypto-portfolio';

  private portfolio$ = new BehaviorSubject<PortfolioItem[]>(this.getPortfolio());

  getPortfolio$(): Observable<PortfolioItem[]> {
    return this.portfolio$.asObservable();
  }

  private getPortfolio(): PortfolioItem[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  }

  private save(data: PortfolioItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  addCoin(item: PortfolioItem): void {
    const portfolio = this.getPortfolio();

    const index = portfolio.findIndex((i) => i.id === item.id);

    if (index !== -1) {
      portfolio[index].amount += item.amount;
      portfolio[index].totalUsd += item.totalUsd;
    } else {
      portfolio.push(item);
    }

    this.save(portfolio);
    this.portfolio$.next(portfolio);
  }

  updateCoin(id: string, amount: number, totalUsd: number): void {
    const portfolio = this.getPortfolio();

    const index = portfolio.findIndex((i) => i.id === id);

    if (index !== -1) {
      portfolio[index] = {
        ...portfolio[index],
        amount: Math.max(1, amount),
        totalUsd: Math.max(0, totalUsd),
      };
    }

    this.save(portfolio);
    this.portfolio$.next(portfolio);
  }

  deleteCoin(id: string): void {
    const portfolio = this.getPortfolio().filter((i) => i.id !== id);

    this.save(portfolio);
    this.portfolio$.next(portfolio);
  }
}
