import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  constructor(public themeService: ThemeService) {}

  // Social links - puoi personalizzare
  socialLinks = [
    { name: 'Facebook', icon: 'fab fa-facebook-f', url: '#' },
    { name: 'Instagram', icon: 'fab fa-instagram', url: '#' },
    { name: 'Twitter', icon: 'fab fa-twitter', url: '#' },
    { name: 'LinkedIn', icon: 'fab fa-linkedin-in', url: '#' }
  ];

  // Link utili
  footerLinks = {
    company: [
      { name: 'Chi siamo', url: '#' },
      { name: 'Come funziona', url: '#' },
      { name: 'Carriere', url: '#' },
      { name: 'Press', url: '#' }
    ],
    restaurants: [
      { name: 'Aggiungi ristorante', url: '#' },
      { name: 'Partner con noi', url: '#' },
      { name: 'Business login', url: '#' },
      { name: 'Manager', url: '#' }
    ],
    support: [
      { name: 'Centro assistenza', url: '#' },
      { name: 'Contattaci', url: '#' },
      { name: 'FAQ', url: '#' },
      { name: 'Feedback', url: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', url: '#' },
      { name: 'Termini di servizio', url: '#' },
      { name: 'Cookie Policy', url: '#' },
      { name: 'GDPR', url: '#' }
    ]
  };
}
