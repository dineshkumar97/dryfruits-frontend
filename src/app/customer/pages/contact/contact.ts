
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class Contact {

  contact = {
    name: '',
    mobile: '',
    email: '',
    subject: '',
    message: ''
  };

  submitMessage(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const messages = JSON.parse(
      localStorage.getItem('nutnest-contact-messages') || '[]'
    );

    messages.push({
      ...this.contact,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem(
      'nutnest-contact-messages',
      JSON.stringify(messages)
    );

    alert('Thank you! Your message has been submitted successfully.');

    form.resetForm();
  }
}
