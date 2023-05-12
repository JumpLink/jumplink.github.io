import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils";
import { I18nService, LocalesService } from "@ribajs/i18n";

import type { SourceCode } from '../../types/index.js'

import sourceCode from "../../../content/source-code.yml"

export class JLSourceCodeComponent extends Component {
  public static tagName = "jl-source-code";

  protected autobind = true;

  protected localesService?: LocalesService;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    sourceCode: this.sourceCode,
  };

  get sourceCode(): SourceCode {
    const lang = (this.localesService?.getLangcode() || "en") as "en" | "de";
    const _sourceCode: SourceCode = {...sourceCode, ...sourceCode[lang]};
    return _sourceCode
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLSourceCodeComponent.observedAttributes);
  }

  protected requiredAttributes(): string[] {
    return [];
  }

  protected async beforeBind() {
    await super.beforeBind();
    this.initLanguage();
  }

  protected initLanguage() {
    this.localesService = I18nService.options.localesService;
    this.localesService?.event.on(
      "changed",
      this.onLanguageChange,
      this
    );
    const langcode = this.localesService?.getLangcode();
    if (this.localesService.ready && langcode) {
      this.onLanguageChange(langcode)
    }
  }

  protected onLanguageChange(langcode: string) {
    this.scope.sourceCode = this.sourceCode;
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
