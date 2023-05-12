import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils";
import { I18nService, LocalesService } from "@ribajs/i18n";

import type { Skills } from "../../types/index.js";

import skills from "../../../content/skills.yml";

export class JLSkillsComponent extends Component {
  public static tagName = "jl-skills";

  protected autobind = true;

  protected localesService?: LocalesService;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    skills: this.skills,
  };

  get skills(): Skills {
    const lang = (this.localesService?.getLangcode() || "en") as "en" | "de";
    const _skills: Skills = {...skills, ...skills[lang]};
    return _skills
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLSkillsComponent.observedAttributes);
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
    if (this.localesService.ready) {
      this.onLanguageChange()
    }
  }

  protected onLanguageChange() {
    this.scope.skills = this.skills;
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
        "./jl-skills.component.pug"
      )
      return template(this.scope);
    }
  }
}
