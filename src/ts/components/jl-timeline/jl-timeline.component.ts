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
    getTimeRange: this.getTimeRange,
    urlToName: this.urlToName,
  };

  public getTimeRange(start: number | string, end?: number | string) {
    if (end === 'present' || end === 'today') {
      end = new Date().getFullYear();
    }
    if(!end) {
      return start.toString();
    }
    return `${start} - ${end}`;
  }

  /**
   * Transform a URL to a for human better readable name,
   * e.g. https://jumplink.github.io/ -> jumplink.github.io
   * @param src The url source to transform to name
   * @returns The transformed name
   */
  public urlToName(src: string) {
    const url = new URL(src, window.location.origin);
    let name = `${url.hostname}${url.pathname !== '/' ? url.pathname : ''}` ;
    if(name.endsWith('/')) {
      name = name.substring(0, name.length - 1); 
    }
    return name;
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLTimelineComponent.observedAttributes);
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
