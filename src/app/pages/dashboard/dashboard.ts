import { Component } from '@angular/core';
import { NotificationsWidget } from './components/notificationswidget';
import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';
import { ReviewsHotelCardsComponent } from '../reviews/reviews-hotel-cards/reviews-hotel-cards';
import { ReviewsPlatillosListComponent } from '../reviews/reviews-platillo-list/reviews-platillo-list';

@Component({
    selector: 'app-dashboard',
    imports: [ReviewsHotelCardsComponent, ReviewsPlatillosListComponent],
    template: `
        <div class="max-w-6xl mx-auto px-4">
            <div class="grid grid-cols-1 gap-6">
                <div class="col-span-1">
                    <app-reviews-hotel-cards></app-reviews-hotel-cards>
                </div>

                <div class="col-span-1">
                    <app-reviews-platillos-list></app-reviews-platillos-list>
                </div>
            </div>
        </div>
    `
})
export class Dashboard {}
