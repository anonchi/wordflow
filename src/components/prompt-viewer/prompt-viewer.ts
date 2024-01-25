import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { getEmptyPromptDataRemote } from '../panel-community/panel-community';
import d3 from '../../utils/d3-import';

// Types
import type { PromptDataRemote } from '../../types/wordflow';

import crossIcon from '../../images/icon-cross.svg?raw';

import componentCSS from './prompt-viewer.css?inline';

interface InfoPair {
  key: string;
  value: string;
}

/**
 * Prompt viewer element.
 *
 */
@customElement('wordflow-prompt-viewer')
export class WordflowPromptViewer extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  promptData: PromptDataRemote;

  @property({ type: String })
  curSelectedTag: string = '';

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
    this.promptData = getEmptyPromptDataRemote();
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||
  /**
   * Tag clicked event handler
   * @param tag Clicked tag name
   */
  tagClicked(e: MouseEvent, tag: string) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Event handler for clicking the close button
   */
  closeButtonClicked() {
    if (this.shadowRoot === null) {
      throw Error('shadowRoot is null');
    }

    // Notify the parent
    const event = new Event('close-clicked', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  /**
   * Close the modal if the user clicks the background
   * @param e Mouse event
   */
  promptEditorBackgroundClicked(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('prompt-viewer')) {
      this.closeButtonClicked();
    }
  }

  addButtonClicked() {
    const event = new CustomEvent<PromptDataRemote>('add-clicked', {
      bubbles: true,
      composed: true,
      detail: this.promptData
    });
    this.dispatchEvent(event);
    this.closeButtonClicked();
  }

  /**
   * Use web share api to share this prompt
   */
  shareButtonClicked() {
    const promptID = this.promptData.forkFrom.replace('prompt#', '');
    const shareData: ShareData = {
      title: 'Wordflow',
      text: this.promptData.title,
      url: `https://anonchi.github.io/wordflow?prompt=${promptID}`
    };
    navigator.share(shareData);
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  /**
   * Create info as key-value pairs
   */
  getInfoPairs() {
    const infos: InfoPair[] = [];
    infos.push({ key: 'Injection mode', value: this.promptData.injectionMode });

    if (this.promptData.recommendedModels.length > 0) {
      const models = this.promptData.recommendedModels.join(', ');
      infos.push({ key: 'Models', value: models });
    }

    if (this.promptData.outputParsingPattern !== '') {
      infos.push({
        key: 'Output pattern',
        value: this.promptData.outputParsingPattern
      });
    }

    if (this.promptData.outputParsingReplacement !== '') {
      infos.push({
        key: 'Output replacement',
        value: this.promptData.outputParsingReplacement
      });
    }
    return infos;
  }

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compose the share info
    const numFormatter = d3.format(',');
    // d3.timeFormat('%m/%d/%Y');
    let dateFormatter = d3.timeFormat('%b %d, %Y');
    const fullTimeFormatter = d3.timeFormat('%b %d, %Y %H:%M');
    const date = d3.isoParse(this.promptData.created)!;
    const curDate = new Date();

    // Ignore the year if it is the same year as today
    if (date.getFullYear == curDate.getFullYear) {
      dateFormatter = d3.timeFormat('%b %d');
    }
    const user =
      this.promptData.userName === '' ? 'Anonymous' : this.promptData.userName;

    // Compose the tag list
    let tagList = html``;
    for (const tag of this.promptData.tags) {
      tagList = html`${tagList}
        <span
          class="tag"
          ?is-selected=${this.curSelectedTag === tag}
          @click=${(e: MouseEvent) => this.tagClicked(e, tag)}
          >${tag}</span
        >`;
    }

    // Compose the info table
    const infoPairs = this.getInfoPairs();
    let infoContent = html``;
    for (const pair of infoPairs) {
      infoContent = html`${infoContent}
        <span class="key">${pair.key}</span>
        <span></span>
        <span class="value">${pair.value}</span> `;
    }

    // Add a report row
    infoContent = html`${infoContent}
      <span class="key">Report</span>
      <span></span>
      <span class="value"
        ><a href="mailto:anon@anon.anon">Report a concern</a></span
      > `;

    // Add a sharing row
    infoContent = html`${infoContent}
      <span class="key">Share</span>
      <span></span>
      <span class="value"
        ><span class="text-button" @click=${() => this.shareButtonClicked()}
          >Share with a friend</span
        ></span
      > `;

    return html`
      <div
        class="prompt-viewer"
        @click=${(e: MouseEvent) => this.promptEditorBackgroundClicked(e)}
      >
        <div class="prompt-window">
          <div class="header">
            <div class="title-bar">
              <span class="icon"><span>${this.promptData.icon}</span></span>
              <span class="name">${this.promptData.title}</span>
              <button
                class="svg-icon"
                @click=${() => this.closeButtonClicked()}
              >
                ${unsafeHTML(crossIcon)}
              </button>
            </div>

            <div class="info-bar">
              <span class="user-name-wrapper">
                <span class="user-name" title=${user}>${user}</span>
              </span>
              <div class="separator"></div>

              <span class="date" title=${fullTimeFormatter(date)}
                >${dateFormatter(date)}</span
              >
              <div class="separator"></div>

              <span class="run-info"
                >${numFormatter(this.promptData.promptRunCount)} runs</span
              >

              <button
                class="add-button"
                @click=${() => {
                  this.addButtonClicked();
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div class="content">
            <section class="content-block">
              <div class="name">Description</div>
              <div class="content-text">${this.promptData.description}</div>
            </section>

            <section class="content-block">
              <div class="name">Prompt</div>
              <div class="content-text">${this.promptData.prompt}</div>
            </section>

            <section class="content-block">
              <div class="name">Tags</div>
              <div class="tag-list">${tagList}</div>
            </section>

            <section class="content-block">
              <div class="name">More Info</div>
              <div class="info-table">${infoContent}</div>
            </section>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    css`
      ${unsafeCSS(componentCSS)}
    `
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'wordflow-prompt-viewer': WordflowPromptViewer;
  }
}
