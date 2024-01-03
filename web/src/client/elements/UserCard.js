import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module';
import { UserCardBadge } from './../elements/UserCardBadge.js';

export class UserCard extends LitElement {
  static styles = css`

  p { margin: 0.5rem 0; padding: 0; }

  small { font-size: 50%; }

  button {
    font-size: 70%;
  }


  /* SVGs badges */

  user-card-badge {
    background: yellow
  }

  user-card-badge[client] {
    background: gold;
  }

  /* SVG */
  user-card-badge:after {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    content: " ";
    background-repeat: no-repeat;
    background-image: var(--url);
    background-size: auto auto;
    width: 25px;
    height: 25px;
    transition: all 0.5s, background-color 0.25s;

    border-radius: 12.5px;
  }

  /* CSS */
  user-card-badge[client]:after {
    content: attr(notifications);
    background-color: maroon;
    background-image: none;

    color: #fff;
    font-family: Arial;
    font-size: 0.95rem;
    font-weight: bold;
    line-height: 1.6rem; /* Approximating the SVG */
    text-align: center;
    vertical-align: baseline;
  }

  :host(.updated) user-card-badge:after {
    transform: rotateY(359deg);
  }

  :host(.receiving) user-card-badge:after {
    background-color: red;
  }

  
  `;

  static get properties() {
    return {
      data: { type: Object }
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
    this.dispatchCustomEvent('notification-clear');
  }

  handleRemove(e) {
    this.dispatchCustomEvent('user-remove');
  }

  toggleStyle() {
    const data = this.data;
    data.client = !this.data.client;
    this.data = Object.assign({}, data);
  }

  render() {
    let firstName = "Loading...";
    let lastName = " ";
    if (this?.data?.name) {
      const names = this.data.name.split(' ');
      firstName = names[0];
      lastName = names[1];
    }
    return html`<user-card-badge
        .client="${this.data.client}"
        .notifications="${this.data.notifications}"
        @transitionend="${this.resetStyles}"
        ></user-card-badge>
      <p><span>${firstName}<br />${lastName}</span></p>
      <p>
        <button @click="${this.handleClear}">Clear</button>
        <button style="color: maroon" @click="${this.handleRemove}">Delete</button>
      </p>`;
  }
}

const NOTIFICATION_TIME_MS = 50;

customElements.define('user-card', UserCard);