import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

// Pixelarticons
import iconBookOpen from "../../../assets/icons/book-open.svg?url";
import iconCheck from "../../../assets/icons/check.svg?url";
import iconLight from "../../../assets/icons/light.svg?url";
import iconUser from "../../../assets/icons/user.svg?url";
import iconCode from "../../../assets/icons/code.svg?url";

import educations from "../../../content/educations.yml";
import projects from "../../../content/projects.yml";
import * as experienceDe from "../../../content/experience-de.md";

import type { Project, Education } from "../../types/index.js";

export class JLProfileComponent extends Component {
  public static tagName = "jl-profile";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    iconBookOpen,
    iconCheck,
    iconLight,
    iconUser,
    iconCode,
    educations: this.educations,
    projects: this.projects,
    experience: {
      html: experienceDe.html,
      ...experienceDe.attributes,
    },
  };

  get projects() {
    const lang = "de"
    const _projects: Project[] = [];
    for (const project of projects) {
      if (project[lang]) {
        _projects.push({...project, ...project[lang]});
      }
    }
    return _projects
  }

  get educations() {
    const lang = "de"
    const _educations: Education[] = [];
    for (const education of educations) {
      if (education[lang]) {
        _educations.push({...education, ...education[lang]});
      }
    }
    return _educations
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLProfileComponent.observedAttributes);
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
        "./jl-profile.component.pug"
      )
      return template(this.scope);
    }
  }
}
