import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module';

export class UserCard extends LitElement {
  static styles = css`

  /*
  :host:after {
    position: absolute;
    top: 0;
    left: 0;
    content: attr(notifications);
  }

  /*
  :host([client]) div {
    background: red;
  }
  */

  div { background: orange }

  div[client="true"] {
    background: red;
  }

  :host div:after {
    position: absolute;
    top: 0;
    left: 0;
    content: attr(notifications);
  }
    
  p { margin: 0.5rem 0; padding: 0; }

  small { font-size: 50%; }

  button {
    font-size: 70%;
  }
  
  `;

  static get properties() {
    return {
      data: { type: Object },

      // Move to new component (UserCardBadge?)
      notifications: {
        type: String,
        reflect: true,
        converter: {
          toAttribute: value => {
            const max = 9;
            const num = parseInt(value);
            if (num === 0) {
              return 0;
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
    this.data = {
      notifications: 0,
    };
    this.notificationTime = null;
    this.notificationInterval = null;

    this.addEventListener('notification-request', this.handleNotificationRequest);
    this.addEventListener('transitionend', this.resetStyles);
  }

  disconnectedCallback() {
    console.log(`Remove ${this.id}?`)
  }

  resetStyles(e) {
    if (e.propertyName !== 'background-color') {
      return;
    }

    clearInterval(this.notificationInterval);
    this.notificationInterval = null;

    this.classList.remove('sending', 'receiving', 'completed');
  }

  checkFade() {
    if (new Date().getTime() - this.notificationTime >= NOTIFICATION_TIME_MS) {
        this.classList.add('completed');
      } else {
        this.classList.remove('completed');
    }
  }

  handleNotificationRequest(e) {
    this.notificationTime = new Date().getTime();
    this.classList.add('sending');
    this.classList.remove('completed');

    if (this.notificationInterval === null) {
      this.notificationInterval = setInterval(this.checkFade.bind(this), NOTIFICATION_TIME_MS)
    }
  }

  dispatchCustomEvent(type, detail = null) {
    const customEvent = new CustomEvent(type, {
      detail,
      bubbles: true, 
      composed: true
    });

    this.dispatchEvent(customEvent);
  }

  handleClear(e) {
    this.notifications = 0;
    this.dispatchCustomEvent('notification-clear');
  }

  handleRemove(e) {
    this.dispatchCustomEvent('user-remove');
  }

  render() {
    let firstName = "Loading...";
    let lastName = " ";
    if (this?.data?.name) {
      const names = this.data.name.split(' ');
      firstName = names[0];
      lastName = names[1];
    }
    return html`<div
        client="${this.data.client}"
        notifications="${this.data.notifications}">${this.data.notifications}</div>
      <p><span>${firstName}<br />${lastName}</span></p>
      <p>
        <button @click="${this.handleClear}">Clear</button>
        <button style="color: maroon" @click="${this.handleRemove}">Delete</button>
      </p>`;
  }
}

const NOTIFICATION_TIME_MS = 50;

customElements.define('user-card', UserCard);