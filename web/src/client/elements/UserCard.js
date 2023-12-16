import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module';

export class UserCard extends LitElement {
  static styles = css`p { margin: 0.5rem; padding: 0; }`;

  static get properties() {
    return {
      name: {type: String},
      id: {type: String},
      notifications: {
        type: String,
        reflect: true,
        converter: {
          toAttribute: value => {
            const max = 9;
            const num = parseInt(value);
            if (num === 0) {
              return '';
            } else if (num > max) {
              return '..';
            } else {
              return value;
            }
          }
        }
      }
    };
  }

  constructor() {
    super();
    this.name = 'Anonymous &nbsp;';
    this.notifications = '';
    this.notificationTime = null;
    this.notificationInterval = null;

    this.addEventListener('notification-request', this.handleNotificationRequest);
    this.addEventListener('transitionend', this.resetStyles);
  }

  resetStyles(e) {
    if (e.propertyName !== 'background-color') {
      return;
    }

    clearInterval(this.notificationInterval);
    this.notificationInterval = null;

    this.classList.remove('active', 'notified');
  }

  checkFade() {
    if (new Date().getTime() - this.notificationTime >= 50) {
        this.classList.add('notified');
      } else {
        this.classList.remove('notified');
    }
  }

  handleNotificationRequest(e) {
    this.notificationTime = new Date().getTime();
    this.classList.add('active');
    this.classList.remove('notified');

    if (this.notificationInterval === null) {
      this.notificationInterval = setInterval(this.checkFade.bind(this), 50)
    }
  }

  handleClear(e) {
    this.notifications = 0;
    this.dispatchEvent(new Event('notification-update'));
  }

  render() {
    const names = this.name.split(' ');
    const firstName = names[0];
    const lastName = names[1] || " ";
    return html`<p><span>${firstName}<br />${lastName}</span></p>
      <p><button @click="${this.handleClear}">Clear</button></p>`;
  }
}

customElements.define('user-card', UserCard);