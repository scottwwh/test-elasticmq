import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module';
import API from './../js/API.js';

export class UserCard extends LitElement {
  static styles = css`
  
  p { margin: 0.5rem 0; padding: 0; }

  small { font-size: 50%; }

  button {
    font-size: 70%;
  }
  
  `;

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
    this.name = 'Anonymous';
    this.notifications = 0;
    this.notificationTime = null;
    this.notificationInterval = null;

    this.addEventListener('notification-request', this.handleNotificationRequest);
    this.addEventListener('transitionend', this.resetStyles);
  }

  // Ref: https://lit.dev/docs/components/lifecycle/#firstupdated
  //
  // DOM has been updated the first time; determine whether API needs to be called or not?
  firstUpdated() {
    API.getUser(this.id)
      .then(data => {
        // console.log(data);
        this.name = data.name;
        this.notifications = data.notifications;
        this.weight = data.weight;
      })
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
    // console.log(`Render user card for ${this.id}`);
    const names = this.name.split(' ');
    const firstName = names[0];
    const lastName = names[1] || " ";
    return html`<p><span>${firstName}<br />${lastName}</span></p>
      <p>
        <button @click="${this.handleClear}">Clear</button>
        <button style="color: maroon" @click="${this.handleRemove}">Delete</button>
      </p>`;
  }
}

const NOTIFICATION_TIME_MS = 50;

customElements.define('user-card', UserCard);