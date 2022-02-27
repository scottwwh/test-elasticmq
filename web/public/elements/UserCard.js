import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module';

export class UserCard extends LitElement {
  static styles = css`p { color: blue }`;

  static get properties() {
    return {
      name: {type: String},
      id: {type: String},
      notifications: {
        type: String,
        reflect: true,
        converter: {
          toAttribute: value => {
            const max = 99;
            const num = parseInt(value);
            if (num === 0) {
              console.log('Return blank..');
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
    this.name = 'Anonymous';
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

    this.classList.remove('active', 'notified');
  }

  checkFade() {
    if (new Date().getTime() - this.notificationTime >= 50) {
        this.classList.add('notified');

        clearInterval(this.notificationInterval);
        this.notificationInterval = null;
      } else {
        this.classList.remove('notified');
    }
  }

  handleNotificationRequest(e) {
    this.notificationTime = new Date().getTime();
    this.classList.add('active');

    if (this.notificationInterval === null) {
      this.notificationInterval = setInterval(this.checkFade.bind(this), 50)
    }
  }

  render() {
    const names = this.name.split(' ');
    return html`<span>${names[0]}<br />${names[1]}</span>`;
  }
}

customElements.define('user-card', UserCard);