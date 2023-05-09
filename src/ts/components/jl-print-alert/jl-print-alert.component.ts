import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

import icon from "../../../assets/tree-2.png?url";
import iconHover from "../../../assets/tree-2-colored.png?url";
import template from "./jl-print-alert.component.pug"

export class JLPrintAlertComponent extends Component {
  public static tagName = "jl-print-alert";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return ['want-to-print'];
  }

  public scope = {
    icon,
    iconHover,
    wantToPrint: false,
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLPrintAlertComponent.observedAttributes);
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
      return template(this.scope);
    }
  }
}
