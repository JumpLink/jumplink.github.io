import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

import type { SourceCode } from '../../types/index.js'

import sourceCode from "../../../content/source-code.yml"

export class JLSourceCodeComponent extends Component {
  public static tagName = "jl-source-code";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    ...this.sourceCode,
  };

  get sourceCode(): SourceCode {
    const lang = "de"
    const _sourceCode: SourceCode = {...sourceCode, ...sourceCode[lang]};
    return _sourceCode
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLSourceCodeComponent.observedAttributes);
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
        "./jl-source-code.component.pug"
      )
      return template(this.scope);
    }
  }
}
