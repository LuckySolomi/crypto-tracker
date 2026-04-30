export interface PortfolioItem {
  id: string;
  name: string;
  image?: string;
  symbol: string;
  amount: number;
  totalUsd: number;
  currentPrice?: number;
}
