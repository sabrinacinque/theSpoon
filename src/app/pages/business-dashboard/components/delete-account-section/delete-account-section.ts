import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-delete-account-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-account-section.html',
  styleUrls: ['./delete-account-section.css']
})
export class DeleteAccountSection {

  copyButtonText = 'Copia email';

  constructor(
    private router: Router,
    private location: Location
  ) {}

  // Scarica il modulo PDF
  downloadForm() {
    console.log('📥 Download modulo cancellazione account...');

    try {
      // Crea un link temporaneo per il download
      const link = document.createElement('a');
      link.href = 'assets/Modulo_Cancellazione_Account_TheSpoon.pdf'
      link.download = 'Modulo_Cancellazione_Account_TheSpoon.pdf';
      link.target = '_blank';

      // Aggiungi al DOM, clicca e rimuovi
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Download avviato');

      // Feedback visivo opzionale
      this.showDownloadFeedback();

    } catch (error) {
      console.error('❌ Errore durante il download:', error);

      // Fallback: apri in una nuova tab
      window.open('assets/documents/modulo-cancellazione-account.pdf', '_blank');
    }
  }

  // Copia l'email negli appunti
  copyEmail() {
    const email = 'servizioclienti@thespoon.com';

    try {
      // Usa l'API moderna se disponibile
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(() => {
          console.log('📋 Email copiata negli appunti');
          this.showCopyFeedback();
        }).catch(err => {
          console.error('❌ Errore copia clipboard:', err);
          this.fallbackCopyEmail(email);
        });
      } else {
        // Fallback per browser più vecchi
        this.fallbackCopyEmail(email);
      }
    } catch (error) {
      console.error('❌ Errore durante la copia:', error);
      this.fallbackCopyEmail(email);
    }
  }

  // Metodo fallback per la copia
  private fallbackCopyEmail(email: string) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = email;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      console.log('📋 Email copiata (fallback)');
      this.showCopyFeedback();
    } catch (err) {
      console.error('❌ Fallback copia fallito:', err);
      // Mostra l'email in un alert come ultima risorsa
      alert(`Copia questa email: ${email}`);
    }
  }

  // Feedback visivo per il download
  private showDownloadFeedback() {
    const originalText = 'Scarica Modulo PDF';
    const downloadBtn = document.querySelector('.download-btn');

    if (downloadBtn) {
      downloadBtn.innerHTML = '<span class="me-2">✅</span>Download avviato...';
      downloadBtn.classList.add('btn-success');
      downloadBtn.classList.remove('btn-primary');

      setTimeout(() => {
        downloadBtn.innerHTML = `<span class="me-2">📥</span>${originalText}`;
        downloadBtn.classList.remove('btn-success');
        downloadBtn.classList.add('btn-primary');
      }, 3000);
    }
  }

  // Feedback visivo per la copia
  private showCopyFeedback() {
    this.copyButtonText = 'Copiato!';
    const copyBtn = document.querySelector('.copy-btn');

    if (copyBtn) {
      copyBtn.classList.add('copied');

      setTimeout(() => {
        this.copyButtonText = 'Copia email';
        copyBtn.classList.remove('copied');
      }, 2000);
    }
  }

  // Torna alla pagina precedente
  goBack() {
    console.log('← Tornando indietro...');
    this.location.back();
  }

  // Naviga a una pagina specifica (opzionale)
  navigateToSettings() {
    console.log('⚙️ Navigazione a impostazioni...');
    this.router.navigate(['/business-dashboard/settings']);
  }

  // Naviga alla dashboard (opzionale)
  navigateToDashboard() {
    console.log('🏠 Navigazione a dashboard...');
    this.router.navigate(['/business-dashboard']);
  }
}
