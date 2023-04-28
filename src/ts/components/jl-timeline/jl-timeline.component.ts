import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

import type { TimelineItem } from "../../types/timeline-item.js";


export class JLTimelineComponent extends Component {
  public static tagName = "jl-timeline";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return ['items', 'title'];
  }

  public scope = {
    items: [] as TimelineItem[],
    title: '',
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLTimelineComponent.observedAttributes);
    console.debug("connectedCallback", this.scope);
  }

  protected async afterBind() {
    await super.afterBind();
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
        "./jl-timeline.component.pug"
      )
      return template(this.scope);
    }
  }
}
