import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module';

export class UserCardBadge extends LitElement {
  static styles = css`

:host p {
  display: none;
  border: 1px solid red;
  background: #eee;
}

  `;

  static get properties() {
    return {
      client: {
        type: Boolean,
        reflect: true,
      },

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
    this.client = false;
    this.notifications = 0;
  }

  render() {
    // This element is relying on CSS and properties being reflected as attributes
    return html`<div><p>client: ${this.client}<br />notifications: ${this.notifications}</p></div>`;
  }
}

customElements.define('user-card-badge', UserCardBadge);