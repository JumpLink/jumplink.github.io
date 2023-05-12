import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils";
import { I18nService, LocalesService } from "@ribajs/i18n";

// Pixelarticons
import iconBookOpen from "../../../assets/icons/book-open.svg?url";
import iconCheck from "../../../assets/icons/check.svg?url";
import iconLight from "../../../assets/icons/light.svg?url";
import iconUser from "../../../assets/icons/user.svg?url";
import iconCode from "../../../assets/icons/code.svg?url";

import _educations from "../../../content/educations.yml";
import _projects from "../../../content/projects.yml";
import * as experienceDE from "../../../content/experience-de.md";
import * as experienceEN from "../../../content/experience-en.md";

import type { Project, Education } from "../../types/index.js";

const projects = _projects as Project;
const educations = _educations as Education;

export class JLProfileComponent extends Component {
  public static tagName = "jl-profile";

  protected autobind = true;

  protected localesService?: LocalesService;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    iconBookOpen,
    iconCheck,
    iconLight,
    iconUser,
    iconCode,
    education: this.education,
    project: this.project,
    experience: this.experience,
  };

  get project() {
    const lang = (this.localesService?.getLangcode() || "en") as "en" | "de";
    const result: Project = {
      list: [],
      title: projects[lang]?.title || projects.title || "",
    }

    for (let item of projects.list) {
      if (item[lang]) {
        item = {...item, ...item[lang]};
      }
      result.list.push(item);
    }
    return result
  }

  get education() {
    const lang = (this.localesService?.getLangcode() || "en") as "en" | "de";
    const result: Education = {
      list: [],
      title: educations[lang]?.title || educations.title || "",
    }

    for (let item of educations.list) {
      if (item[lang]) {
        item = {...item, ...item[lang]};
      }
      result.list.push(item);
    }
    return result
  }

  get experience() {
    const lang = this.localesService?.getLangcode() || "en"
    if (lang === "de") {
      return {
        html: experienceDE.html,
        ...experienceDE.attributes,
      };
    }
    if (lang === "en") {
      return {
        html: experienceEN.html,
        ...experienceEN.attributes,
      };
    }
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLProfileComponent.observedAttributes);
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
    this.scope.project = this.project;
    this.scope.education = this.education;
    this.scope.experience = this.experience;
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
        "./jl-profile.component.pug"
      )
      return template(this.scope);
    }
  }
}
