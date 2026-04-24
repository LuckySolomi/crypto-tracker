import { Routes } from '@angular/router';
import { Coins } from './pages/coins/coins';
import { CoinDetails } from './pages/coin-details/coin-details';
import { Portfolio } from './pages/portfolio/portfolio';
import { Wishlist } from './pages/wishlist/wishlist';
import { NotFound } from './pages/not-found/not-found';

export const routes: Routes = [
  { path: '', redirectTo: 'coins', pathMatch: 'full' },
  { path: 'coins', component: Coins },
  { path: 'coins/:id', component: CoinDetails },
  { path: 'portfolio', component: Portfolio },
  { path: 'wishlist', component: Wishlist },
  { path: '**', component: NotFound },
];
