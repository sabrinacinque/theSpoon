import { Injectable, signal, effect, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;

  // 🎯 SIGNAL per il tema
  isDarkTheme = signal<boolean>(true);

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    // Leggi tema salvato
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkTheme.set(savedTheme === 'dark');
    }

    // 🔥 EFFECT - Ora cambia SOLO gli attributi data-*
    // Le variabili CSS fanno tutto il resto automaticamente!
    effect(() => {
      const isDark = this.isDarkTheme();
      const theme = isDark ? 'dark' : 'light';

      console.log('🎨 Tema applicato:', theme);

      // ✅ SOLO QUESTI 2 attributi - il CSS fa tutto il resto!
      this.renderer.setAttribute(this.document.documentElement, 'data-bs-theme', theme);
      this.renderer.setAttribute(this.document.body, 'data-theme', theme);

      // 💾 Salva automaticamente
      localStorage.setItem('theme', theme);
    });
  }

  toggleTheme() {
    this.isDarkTheme.update(current => !current);
  }
}
