import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";
import { Bs5ModalComponent } from "../bs5-modal/bs5-modal.component.js"

import iconClose from "../../../assets/icons/close.svg?url";
import iconPrint from "../../../assets/icons/print.svg?url";
import { set } from "yaml/dist/schema/yaml-1.1/set.js";

export class JLPrintModalComponent extends Component {
  public static tagName = "jl-print-modal";

  protected autobind = true;

  protected modal: Bs5ModalComponent | null = null;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    print: this.print.bind(this),
    show: this.show.bind(this),
    hide: this.hide.bind(this),
    iconClose,
    iconPrint,
  };

  public show() {
    this.modal?.show();
  }

  public hide() {
    this.modal?.hide();
  }

  public print() {
    this.hide();
    console.debug("print")
    setTimeout(() => {
      window.print();
    }, 300);
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLPrintModalComponent.observedAttributes);
    console.debug("connectedCallback", this.scope);
  }

  protected afterBind(): Promise<any> {
    this.modal = this.querySelector<Bs5ModalComponent>(Bs5ModalComponent.tagName.toLowerCase());
    return super.afterBind();
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
        "./jl-print-modal.component.pug"
      )
      return template(this.scope);
    }
  }
}
