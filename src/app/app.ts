import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router'; // ← AGGIUNGI Router
import { NavbarComponent } from "./mainComponent/navbar/navbar";
import { FooterComponent } from "./mainComponent/footer/footer";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'theSpoon';

  // ← AGGIUNGI IL CONSTRUCTOR
  constructor(private router: Router) {}

  // ← AGGIUNGI QUESTA FUNZIONE
  navigateToHome() {
    console.log('🏠 Navigazione alla homepage dal logo');
    this.router.navigate(['/']).then(() => {
      console.log('✅ Navigazione alla home completata');
    });
  }

  // ← AGGIUNGI QUESTA FUNZIONE (per dopo)
  navigateToLogin() {
    console.log('🔑 Navigazione al login');
    // TODO: Implementare quando avremo la pagina login
    alert('Login page non ancora implementata');
  }
}
