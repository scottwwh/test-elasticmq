import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module';

export class HealthStatus extends LitElement {
  static styles = css`

/* Status */

:host {
    display: block;
    padding-right: 1rem;
    width: 5rem;
}

:host:after {
    position: absolute;
    top: 4px;
    right: 0;
    display: block;
    content: '';
    height: 10px;
    width: 10px;
    border-radius: 5px;
    background-color: maroon;
}

ul {
    margin: 0 0 0 2rem;
    padding: 0;
    color: maroon;
    font-size: 0.75rem;
}

li[active] {
    color: green;
}

  `;

  static get properties() {
    return {
      data: {
        type: Object,
      },
    };
  }

  constructor() {
    super();
  }

  render() {
    return html`<details>
            <summary>Status</summary>
            <ul>${this.data.systems.map(system => {
                return html`<li ?active=${system.active}>${system.id}</li>`;
            })}
        </details>`;
  }
}

customElements.define('health-status', HealthStatus);