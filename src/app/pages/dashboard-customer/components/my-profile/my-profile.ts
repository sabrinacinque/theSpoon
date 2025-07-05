// my-profile.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IUser } from '../../../../models/iuser';
// import { UserService } from '../../../../services/user'; // Se esiste

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './my-profile.html',
  styleUrls: ['./my-profile.css']
})
export class MyProfile implements OnInit {
  @Input() currentUser: IUser | null = null;

  userForm: FormGroup;
  loading: boolean = false;
  success: boolean = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder
    // private userService: UserService // Se esiste
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}], // Email non modificabile
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[+]?[0-9\s\-\(\)]+$/)]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    if (this.currentUser) {
      this.userForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email
      });
    }
  }

  onSubmit(): void {
    if (this.userForm.valid && this.currentUser) {
      this.loading = true;
      this.error = null;
      this.success = false;

      const updateData = {
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        phoneNumber: this.userForm.value.phoneNumber
      };

      // TODO: Implementare aggiornamento profilo
      console.log('Aggiornamento profilo:', updateData);

      // Simulazione successo
      setTimeout(() => {
        this.success = true;
        this.loading = false;

        // Nascondi messaggio dopo 3 secondi
        setTimeout(() => {
          this.success = false;
        }, 3000);
      }, 1000);

      /*
      this.userService.updateProfile(this.currentUser.id, updateData).subscribe({
        next: (updatedUser) => {
          this.success = true;
          this.loading = false;

          // Aggiorna i dati dell'utente corrente
          if (this.currentUser) {
            this.currentUser.firstName = updatedUser.firstName;
            this.currentUser.lastName = updatedUser.lastName;
            this.currentUser.phoneNumber = updatedUser.phoneNumber;
          }

          setTimeout(() => {
            this.success = false;
          }, 3000);
        },
        error: (error) => {
          console.error('Errore aggiornamento profilo:', error);
          this.error = 'Errore aggiornamento profilo. Riprova.';
          this.loading = false;
        }
      });
      */
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'Campo obbligatorio';
      }
      if (field.errors['minlength']) {
        return 'Minimo 2 caratteri richiesti';
      }
      if (field.errors['pattern']) {
        return 'Formato non valido';
      }
    }
    return '';
  }

  resetForm(): void {
    this.loadUserData();
    this.error = null;
    this.success = false;
  }
}
