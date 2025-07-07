import {
  Component,
  Input,
  OnInit,
  OnChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth';
import { ReservationService } from '../../../../services/reservation';
import { IUser } from '../../../../models/iuser';
import { IReservation } from '../../../../models/ireservation';
import Swal from 'sweetalert2';

interface EditableField {
  name: string;
  value: string;
  editing: boolean;
  originalValue: string;
  loading: boolean;
  required: boolean;
  type: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  icon?: string;
  readonly?: boolean;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './my-profile.html',
  styleUrls: ['./my-profile.css'],
})
export class MyProfile implements OnInit, OnChanges {
  @Input() currentUser: IUser | null = null;

  // Stati
  loading: boolean = false;
  error: string | null = null;
  saving: boolean = false;
  loadingStats: boolean = true;

  // Campi modificabili
  editableFields: EditableField[] = [];

  // Statistiche utente
  userStats = {
    totalReservations: 0,
    completedReservations: 0,
    memberSince: '',
    lastLogin: '',
  };

  // Lista prenotazioni per calcolo statistiche
  userReservations: IReservation[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private reservationService: ReservationService,
    private http: HttpClient, // ← NUOVO per invio email
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeProfile();
  }

  ngOnChanges(): void {
    if (this.currentUser) {
      this.initializeProfile();
    }
  }

  // 🏪 INIZIALIZZA PROFILO
  private initializeProfile(): void {
    if (!this.currentUser) {
      this.error = 'Errore: dati utente non disponibili';
      return;
    }

    this.initializeEditableFields();
    this.loadUserStats();
    console.log('✅ Profilo utente inizializzato:', this.currentUser);
  }

  // ✏️ INIZIALIZZA CAMPI MODIFICABILI
  private initializeEditableFields(): void {
    if (!this.currentUser) return;

    this.editableFields = [
      {
        name: 'firstName',
        value: this.currentUser.firstName || '',
        editing: false,
        originalValue: this.currentUser.firstName || '',
        loading: false,
        required: true,
        type: 'text',
        placeholder: 'Il tuo nome',
        icon: 'fas fa-user',
      },
      {
        name: 'lastName',
        value: this.currentUser.lastName || '',
        editing: false,
        originalValue: this.currentUser.lastName || '',
        loading: false,
        required: true,
        type: 'text',
        placeholder: 'Il tuo cognome',
        icon: 'fas fa-user',
      },
      {
        name: 'email',
        value: this.currentUser.email || '',
        editing: false,
        originalValue: this.currentUser.email || '',
        loading: false,
        required: true,
        type: 'email',
        placeholder: 'La tua email',
        icon: 'fas fa-envelope',
        readonly: true,
      },
    ];
  }

  // 📊 CARICA STATISTICHE UTENTE
  private loadUserStats(): void {
    if (!this.currentUser) return;

    this.loadingStats = true;

    this.reservationService
      .getReservationsByCustomer(this.currentUser.userId)
      .subscribe({
        next: (reservations: IReservation[]) => {
          this.userReservations = reservations;
          console.log('📊 Prenotazioni utente caricate:', reservations.length);

          this.calculateUserStats(reservations);

          this.loadingStats = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Errore caricamento prenotazioni:', error);

          this.userStats = {
            totalReservations: 0,
            completedReservations: 0,
            memberSince: this.formatJoinDate(),
            lastLogin: 'Oggi',
          };

          this.loadingStats = false;
          this.cdr.detectChanges();
        },
      });
  }

  // 🧮 CALCOLA STATISTICHE
  private calculateUserStats(reservations: IReservation[]): void {
    const now = new Date();

    const totalReservations = reservations.length;

    const completedReservations = reservations.filter((reservation) => {
      try {
        const reservationDateTime = new Date(
          reservation.reservationDate + ' ' + reservation.reservationTime
        );
        return reservationDateTime < now;
      } catch (error) {
        return false;
      }
    }).length;

    this.userStats = {
      totalReservations,
      completedReservations,
      memberSince: this.formatJoinDate(),
      lastLogin: 'Oggi',
    };

    console.log('📊 Statistiche calcolate:', this.userStats);
  }

  // ✏️ ABILITA MODIFICA CAMPO
  startEdit(field: EditableField): void {
    if (field.readonly) {
      this.showInfoMessage(
        'Campo non modificabile',
        'Questo campo non può essere modificato per motivi di sicurezza.'
      );
      return;
    }

    this.editableFields.forEach((f) => {
      if (f !== field && f.editing) {
        this.cancelEdit(f);
      }
    });

    field.editing = true;
    field.originalValue = field.value;
    this.cdr.detectChanges();
    console.log('✏️ Modifica campo:', field.name);

    setTimeout(() => {
      const input = document.querySelector(
        `[data-field="${field.name}"]`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  // 💾 SALVA MODIFICA CAMPO
  saveField(field: EditableField): void {
    if (field.required && !field.value.trim()) {
      this.showErrorMessage(
        'Campo obbligatorio',
        'Questo campo è obbligatorio e non può essere vuoto.'
      );
      return;
    }

    if (field.type === 'email' && !this.isValidEmail(field.value)) {
      this.showErrorMessage(
        'Email non valida',
        'Inserisci un indirizzo email valido.'
      );
      return;
    }

    field.loading = true;
    this.cdr.detectChanges();

    console.log('💾 Salvando campo:', field.name, '=', field.value);

    if (this.currentUser) {
      this.userService
        .updateProfile(
          this.currentUser.userId,
          this.getFieldValue('firstName'),
          this.getFieldValue('lastName')
        )
        .subscribe({
          next: (updatedUser) => {
            console.log('✅ Profilo aggiornato dal backend:', updatedUser);

            if (this.currentUser) {
              this.currentUser.firstName = updatedUser.firstName;
              this.currentUser.lastName = updatedUser.lastName;
            }

            this.authService.updateUserProfileData(updatedUser);

            field.editing = false;
            field.loading = false;
            field.originalValue = field.value;
            this.cdr.detectChanges();

            this.showSuccessMessage(
              'Profilo aggiornato!',
              'Le tue informazioni sono state salvate con successo.'
            );
          },
          error: (error) => {
            console.error('❌ Errore aggiornamento profilo:', error);

            field.value = field.originalValue;
            field.editing = false;
            field.loading = false;
            this.cdr.detectChanges();

            this.showErrorMessage(
              'Errore di salvataggio',
              'Si è verificato un errore durante il salvataggio. Riprova più tardi.'
            );
          },
        });
    }
  }

  // ❌ ANNULLA MODIFICA CAMPO
  cancelEdit(field: EditableField): void {
    field.value = field.originalValue;
    field.editing = false;
    field.loading = false;
    this.cdr.detectChanges();
    console.log('❌ Modifica annullata:', field.name);
  }

  // 🗑️ CANCELLA ACCOUNT
  async deleteAccount(): Promise<void> {
    const result = await Swal.fire({
      title: 'Elimina Account',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 1rem;"><strong>⚠️ ATTENZIONE: Questa azione è irreversibile!</strong></p>
          <p style="margin-bottom: 1rem;">Eliminando il tuo account:</p>
          <ul style="text-align: left; margin: 1rem 0;">
            <li>Perderai tutte le tue ${this.userStats.totalReservations} prenotazioni</li>
            <li>Non potrai più accedere con questo account</li>
            <li>Tutti i tuoi dati verranno cancellati</li>
          </ul>
          <p style="margin-top: 1rem;"><strong>Sei sicuro di voler procedere?</strong></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fas fa-trash"></i> Sì, elimina tutto',
      cancelButtonText: '<i class="fas fa-times"></i> Annulla',
      reverseButtons: true,
      customClass: {
        container: 'swal-container',
        popup: 'swal-popup',
      },
    });

    if (result.isConfirmed) {
      const finalConfirm = await Swal.fire({
        title: 'Ultima conferma',
        text: "Inserisci la tua password per confermare l'eliminazione dell'account",
        input: 'password',
        inputPlaceholder: 'Password attuale',
        inputAttributes: {
          autocapitalize: 'off',
          autocorrect: 'off',
        },
        showCancelButton: true,
        confirmButtonText: 'Elimina definitivamente',
        cancelButtonText: 'Annulla',
        confirmButtonColor: '#dc3545',
        preConfirm: (password) => {
          if (!password) {
            Swal.showValidationMessage('La password è obbligatoria');
            return false;
          }
          return password;
        },
      });

      if (finalConfirm.isConfirmed) {
        console.log('🗑️ Eliminazione account confermata');

        this.showSuccessMessage(
          'Account eliminato',
          'Il tuo account è stato eliminato con successo. Verrai reindirizzato alla homepage.'
        );

        setTimeout(() => {
          this.authService.logout();
          window.location.href = '/';
        }, 3000);
      }
    }
  }

  // 🔑 CAMBIA PASSWORD
  // 🔑 CAMBIA PASSWORD - AGGIORNATO CON VERIFICA REALE
  async changePassword(): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: 'Cambia Password',
      html: `
  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <div>
      <label style="display: block; text-align: left; margin-bottom: 0.5rem; font-weight: 600;">Password attuale:</label>
      <input
        id="current-password"
        type="password"
        class="swal2-input"
        placeholder="Inserisci la password attuale"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        style="margin: 0;"
        value="">
    </div>
    <div>
      <label style="display: block; text-align: left; margin-bottom: 0.5rem; font-weight: 600;">Nuova password:</label>
      <input
        id="new-password"
        type="password"
        class="swal2-input"
        placeholder="Inserisci la nuova password"
        autocomplete="new-password"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        style="margin: 0;"
        value="">
    </div>
    <div>
      <label style="display: block; text-align: left; margin-bottom: 0.5rem; font-weight: 600;">Conferma nuova password:</label>
      <input
        id="confirm-password"
        type="password"
        class="swal2-input"
        placeholder="Conferma la nuova password"
        autocomplete="new-password"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        style="margin: 0;"
        value="">
    </div>
  </div>
`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-key"></i> Cambia Password',
      cancelButtonText: 'Annulla',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const currentPassword = (
          document.getElementById('current-password') as HTMLInputElement
        ).value;
        const newPassword = (
          document.getElementById('new-password') as HTMLInputElement
        ).value;
        const confirmPassword = (
          document.getElementById('confirm-password') as HTMLInputElement
        ).value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('Tutti i campi sono obbligatori');
          return false;
        }

        if (newPassword.length < 6) {
          Swal.showValidationMessage(
            'La nuova password deve essere di almeno 6 caratteri'
          );
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Le nuove password non corrispondono');
          return false;
        }

        return { currentPassword, newPassword };
      },
    });

    if (formValues && this.currentUser) {
      // Mostra loading
      Swal.fire({
        title: 'Cambio in corso...',
        html: 'Verifica della password attuale e aggiornamento...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      console.log(
        '🔑 Cambio password richiesto per utente:',
        this.currentUser.userId
      );

      // 🔥 CHIAMATA API REALE per cambiare password
      this.userService
        .changePassword(
          this.currentUser.userId,
          formValues.currentPassword,
          formValues.newPassword
        )
        .subscribe({
          next: (response) => {
            console.log('✅ Password cambiata con successo:', response);

            Swal.fire({
              title: '🔑 Password Cambiata!',
              html: `
            <div style="text-align: center;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
              <p style="margin-bottom: 1rem;">La tua password è stata aggiornata con successo!</p>
              <div style="background: #d4edda; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <p style="margin: 0; color: #155724;"><strong>Per sicurezza, effettua il login con la nuova password</strong></p>
              </div>
            </div>
          `,
              icon: 'success',
              confirmButtonText: 'Perfetto!',
              confirmButtonColor: '#28a745',
              timer: 5000,
              timerProgressBar: true,
            });
          },
          error: (error) => {
            console.error('❌ Errore cambio password:', error);

            let errorMessage =
              'Si è verificato un errore durante il cambio password.';

            // Gestisci errori specifici dal backend
            if (error.status === 400) {
              errorMessage = 'Password attuale non corretta. Riprova.';
            } else if (error.status === 404) {
              errorMessage = 'Utente non trovato.';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }

            Swal.fire({
              title: '❌ Errore Cambio Password',
              html: `
            <div style="text-align: center;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🚫</div>
              <p style="margin-bottom: 1rem;">${errorMessage}</p>
              <div style="background: #f8d7da; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <p style="margin: 0; color: #721c24;"><strong>Verifica di aver inserito correttamente la password attuale</strong></p>
              </div>
            </div>
          `,
              icon: 'error',
              confirmButtonText: 'Riprova',
              confirmButtonColor: '#dc3545',
            });
          },
        });
    }
  }

  // 🆘 NUOVO - CENTRO ASSISTENZA
  async openSupportCenter(): Promise<void> {
    const { value: supportData } = await Swal.fire({
      title: '🆘 Centro Assistenza',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
  <p style="margin-bottom: 1rem;">Descrivi il tuo problema e ti risponderemo al più presto!</p>

  <div style="margin-bottom: 1rem;">
    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Tipo di problema:</label>
    <select id="issue-type" class="swal2-select" style="width: 100%; margin: 0 auto; display: block;">
      <option value="">Seleziona una categoria</option>
      <option value="reservation">Problemi con prenotazioni</option>
      <option value="account">Problemi con l'account</option>
      <option value="payment">Problemi di pagamento</option>
      <option value="restaurant">Problemi con un ristorante</option>
      <option value="technical">Problemi tecnici</option>
      <option value="other">Altro</option>
    </select>
  </div>

  <div style="margin-bottom: 1rem;">
    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Descrizione del problema:</label>
    <textarea id="issue-description" class="swal2-textarea" placeholder="Descrivi dettagliatamente il tuo problema..." style="min-height: 120px; resize: vertical; width: 100%; margin: 0 auto; display: block;"></textarea>
  </div>

  <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; font-size: 0.9em; color: #6c757d;">
    <p style="margin: 0;"><strong>📧 Ti risponderemo via email entro 24 ore!</strong></p>
    <p style="margin: 0.5rem 0 0 0;">Email di contatto: ${this.currentUser?.email}</p>
  </div>
</div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText:
        '<i class="fas fa-paper-plane"></i> Invia Segnalazione',
      cancelButtonText: '<i class="fas fa-times"></i> Annulla',
      confirmButtonColor: '#28a745',
      focusConfirm: false,
      preConfirm: () => {
        const issueType = (
          document.getElementById('issue-type') as HTMLSelectElement
        ).value;
        const description = (
          document.getElementById('issue-description') as HTMLTextAreaElement
        ).value;

        if (!issueType) {
          Swal.showValidationMessage('Seleziona il tipo di problema');
          return false;
        }

        if (!description || description.trim().length < 10) {
          Swal.showValidationMessage(
            'Descrivi il problema (almeno 10 caratteri)'
          );
          return false;
        }

        return { issueType, description: description.trim() };
      },
    });

    if (supportData) {
      await this.sendSupportEmail(
        supportData.issueType,
        supportData.description
      );
    }
  }

  // 📧 INVIA EMAIL ASSISTENZA
  private async sendSupportEmail(
    issueType: string,
    description: string
  ): Promise<void> {
    // Mostra loading
    Swal.fire({
      title: 'Invio in corso...',
      html: 'Stiamo inviando la tua segnalazione...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const emailData = {
      to: 'cinque.sabrina@gmail.com',
      subject: `[TheSpoon] Segnalazione: ${this.getIssueTypeLabel(issueType)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            🆘 Nuova Segnalazione da TheSpoon
          </h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">Informazioni Cliente</h3>
            <p><strong>Nome:</strong> ${this.fullName}</p>
            <p><strong>Email:</strong> ${this.currentUser?.email}</p>
            <p><strong>ID Utente:</strong> ${this.currentUser?.userId}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('it-IT')}</p>
          </div>

          <div style="background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #dc3545;">Dettagli Problema</h3>
            <p><strong>Categoria:</strong> ${this.getIssueTypeLabel(
              issueType
            )}</p>
            <p><strong>Descrizione:</strong></p>
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
              ${description.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 8px; color: #155724;">
            <p style="margin: 0;"><strong>Ricorda:</strong> Rispondi a questa email per contattare direttamente il cliente.</p>
          </div>
        </div>
      `,
    };

    try {
      // Simula invio email (sostituisci con la tua API di invio email)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('📧 Email di supporto inviata:', emailData);

      // Successo
      Swal.fire({
        title: '✅ Segnalazione Inviata!',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📧</div>
            <p style="margin-bottom: 1rem;">La tua segnalazione è stata inviata con successo!</p>
            <div style="background: #d4edda; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p style="margin: 0; color: #155724;"><strong>Ti risponderemo entro 24 ore</strong></p>
              <p style="margin: 0.5rem 0 0 0; color: #155724;">Controlla la tua email: ${this.currentUser?.email}</p>
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Perfetto!',
        confirmButtonColor: '#28a745',
        timer: 5000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error('❌ Errore invio email supporto:', error);

      Swal.fire({
        title: 'Errore Invio',
        text: "Si è verificato un errore durante l'invio. Riprova più tardi o contattaci direttamente.",
        icon: 'error',
        confirmButtonText: 'Ho capito',
        confirmButtonColor: '#dc3545',
      });
    }
  }

  // 🏷️ ETICHETTE TIPO PROBLEMA
  private getIssueTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      reservation: 'Problemi con prenotazioni',
      account: "Problemi con l'account",
      payment: 'Problemi di pagamento',
      restaurant: 'Problemi con un ristorante',
      technical: 'Problemi tecnici',
      other: 'Altro',
    };
    return labels[type] || 'Non specificato';
  }

  // 📋 NUOVO - PRIVACY POLICY
  showPrivacyPolicy(): void {
    Swal.fire({
      title: '🔒 Privacy Policy',
      html: `
        <div style="text-align: left; max-height: 400px; overflow-y: auto; padding: 1rem;">
          <h4>Informativa sulla Privacy</h4>
          <p><strong>Ultima modifica:</strong> Luglio 2025</p>

          <h5>1. Raccolta Dati</h5>
          <p>Raccogliamo i seguenti dati personali:</p>
          <ul>
            <li>Nome e cognome</li>
            <li>Indirizzo email</li>
            <li>Storico prenotazioni</li>
            <li>Recensioni e valutazioni</li>
          </ul>

          <h5>2. Utilizzo Dati</h5>
          <p>I tuoi dati vengono utilizzati per:</p>
          <ul>
            <li>Gestire le prenotazioni</li>
            <li>Migliorare il servizio</li>
            <li>Comunicazioni relative al servizio</li>
          </ul>

          <h5>3. Sicurezza</h5>
          <p>Proteggiamo i tuoi dati con tecnologie di sicurezza avanzate e non li condividiamo con terze parti senza il tuo consenso.</p>

          <h5>4. I Tuoi Diritti</h5>
          <p>Hai il diritto di accedere, modificare o eliminare i tuoi dati in qualsiasi momento.</p>

          <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
            <p style="margin: 0;"><strong>📧 Contatti:</strong> Per domande sulla privacy, scrivi a cinque.sabrina@gmail.com</p>
          </div>
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Ho capito',
      confirmButtonColor: '#007bff',
    });
  }

  // 📄 NUOVO - TERMINI DI SERVIZIO
  showTermsOfService(): void {
    Swal.fire({
      title: '📄 Termini di Servizio',
      html: `
        <div style="text-align: left; max-height: 400px; overflow-y: auto; padding: 1rem;">
          <h4>Termini e Condizioni</h4>
          <p><strong>Ultima modifica:</strong> Luglio 2025</p>

          <h5>1. Accettazione dei Termini</h5>
          <p>Utilizzando TheSpoon, accetti questi termini di servizio.</p>

          <h5>2. Utilizzo del Servizio</h5>
          <p>TheSpoon è una piattaforma per:</p>
          <ul>
            <li>Prenotare tavoli nei ristoranti</li>
            <li>Lasciare recensioni</li>
            <li>Gestire il proprio profilo</li>
          </ul>

          <h5>3. Comportamento Utente</h5>
          <p>È vietato:</p>
          <ul>
            <li>Lasciare recensioni false o offensive</li>
            <li>Prenotare tavoli senza presentarsi</li>
            <li>Utilizzare il servizio per scopi illeciti</li>
          </ul>

          <h5>4. Responsabilità</h5>
          <p>TheSpoon funge da intermediario tra utenti e ristoranti. Non siamo responsabili per la qualità del servizio nei ristoranti.</p>

          <h5>5. Modifiche</h5>
          <p>Ci riserviamo il diritto di modificare questi termini in qualsiasi momento.</p>

          <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
            <p style="margin: 0;"><strong>📧 Domande:</strong> Per chiarimenti, contatta cinque.sabrina@gmail.com</p>
          </div>
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Accetto',
      confirmButtonColor: '#28a745',
    });
  }

  // 🔄 REFRESH STATISTICHE
  refreshStats(): void {
    this.loadUserStats();
  }

  // 🔧 UTILITY METHODS

  getField(fieldName: string): EditableField | undefined {
    return this.editableFields.find((f) => f.name === fieldName);
  }

  getFieldValue(fieldName: string): string {
    const field = this.getField(fieldName);
    return field ? field.value : '';
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 📅 FORMATTA DATA REGISTRAZIONE
  private formatJoinDate(): string {
    const today = new Date();
    const registrationDate = new Date(
      today.getTime() - 2 * 24 * 60 * 60 * 1000
    );

    return registrationDate.toLocaleDateString('it-IT', {
      month: 'long',
      year: 'numeric',
    });
  }

  // 🍬 SWEETALERT2 MESSAGES

  private showSuccessMessage(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonText: '<i class="fas fa-check"></i> Perfetto!',
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true,
    });
  }

  private showErrorMessage(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonText: '<i class="fas fa-times"></i> Ho capito',
      confirmButtonColor: '#dc3545',
    });
  }

  private showInfoMessage(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonText: '<i class="fas fa-check"></i> OK',
      confirmButtonColor: '#17a2b8',
    });
  }

  // 📊 GETTERS

  get fullName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`.trim();
  }

  get userInitials(): string {
    if (!this.currentUser) return '??';
    const first = this.currentUser.firstName?.charAt(0) || '';
    const last = this.currentUser.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  // 🔧 EVENT HANDLERS

  onKeydown(event: KeyboardEvent, field: EditableField): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveField(field);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit(field);
    }
  }

  onBlur(field: EditableField): void {
    if (field.value !== field.originalValue && field.value.trim() !== '') {
      this.saveField(field);
    } else if (field.value.trim() === '' && field.required) {
      this.cancelEdit(field);
    }
  }
}
