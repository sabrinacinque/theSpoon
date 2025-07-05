// my-reviews.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IUser } from '../../../../models/iuser';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-reviews.html',
  styleUrls: ['./my-reviews.css']
})
export class MyReviews {
  @Input() currentUser: IUser | null = null;

  constructor() {}

  // Placeholder per future funzionalità
  get totalReviews(): number {
    return 0; // Sarà implementato in futuro
  }

  get averageRating(): number {
    return 0; // Sarà implementato in futuro
  }
}
