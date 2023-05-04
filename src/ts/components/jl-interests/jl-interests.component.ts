import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";
import { JLNavbarComponent } from '../jl-navbar/jl-navbar.component.js'

import type { Interests } from '../../types/index.js'

import interests from "../../../content/interests.yml"

export class JLInterestsComponent extends Component {
  public static tagName = "jl-interests";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  protected navbar: JLNavbarComponent | null = null;

  public scope = {
    interests: (interests as Interests).de.list,
    title: (interests as Interests).de.title,
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLInterestsComponent.observedAttributes);
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
        "./jl-interests.component.pug"
      )
      return template(this.scope);
    }
  }
}
