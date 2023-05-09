import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

import * as aboutMeDE from "../../../content/about-me-de.md";
// import * as aboutMeEN from "../../../content/about-me-en.md";

export class JLAboutComponent extends Component {
  public static tagName = "jl-about";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    html: aboutMeDE.html,
    ...aboutMeDE.attributes,
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLAboutComponent.observedAttributes);
    console.debug("connectedCallback", this.scope);
  }

  protected requiredAttributes(): string[] {
    return [];
  }

  protected async template() {
    // Only set the component template if there no childs already
    if (hasChildNodesTrim(this)) {
      return null;
    } else {
      const { default: template } = await import(
        "./jl-about.component.pug"
      )
      return template(this.scope);
    }
  }
}
