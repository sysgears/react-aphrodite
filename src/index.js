import { createInstance, clientInstance } from './wrapper';
import { mapObj, hashObject } from 'aphrodite/lib/util';
import { defaultSelectorHandlers } from 'aphrodite/lib/generate';
import React, { Component, PropTypes, Children } from 'react';

/**
 * Css renderer that wraps one instance of Aphrodite and does main work of CSS styles application.
 */
class CssRenderer {
  constructor() {
    this.instance = createInstance();
    this.instance.startBuffering();
    this.handlers = defaultSelectorHandlers;
  }

  _css(...styles) {
    return this.instance.injectAndGetClassName(this.useImportant, styles, this.handlers);
  }

  _addRenderedClassNames(classNames) {
    this.instance.addRenderedClassNames(classNames);
  }

  _setOptions(useImportant, handlers) {
    this.useImportant = useImportant;
    this.handlers = handlers;
  }

  /**
   * Returns generated CSS stylesheet as plain text.
   *
   * @returns {String} Generated CSS stylesheet as plain text.
   */
  getCss() {
    return this.instance.getCss();
  }

  /**
   * Returns generated CSS class names.
   *
   * @returns {[String]} Generated CSS class names.
   */
  getRenderedClassNames() {
    return this.instance.getRenderedClassNames();
  }
}

/**
 * Creates new instance of Aphrodite CSS styles renderer.
 *
 * @returns {CssRenderer} New instance of Aphrodite CSS styles renderer.
 */
export function createRenderer() {
  return new CssRenderer();
}

/**
 * Injects `css` property into React Component.
 *
 * Usage example:
 * const sheet = withCss({
 *   red: {
 *      color: 'red',
 *   }
 * });
 *
 * const Component = withCss(({css}) => <div className=css(sheet.red)>...</div>))
 *
 * @param arg React Component or Stylesheet definition
 *
 * @returns {Object} React Component with `css` property injected or ready to use Stylesheet definition
 */
export default function withCss(arg) {
  if (typeof arg === "object") {
    return mapObj(arg, ([key, val]) => {
      return [key, {
        _name: `${key}_${hashObject(val)}`,
        _definition: val
      }];
    });
  } else {
    const Component = arg;

    const fallbackCss = (...styles) =>
      clientInstance.injectAndGetClassName(true, styles, defaultSelectorHandlers);

    const CssComponent = (props, {css}) => <Component css={css || fallbackCss} />;

    CssComponent.contextTypes = {
      css: PropTypes.func
    };

    return <CssComponent />;
  }
}

/**
 * CssProvider is a Provider React Component that should wrap all the React Tree of components that are going
 * to use inline Aphrodite CSS styles.
 */
export class CssProvider extends Component {
  constructor(props) {
    super(props);

    let handlers = defaultSelectorHandlers;
    if (props.extensions) {
      handlers = handlers.concat(
        props.extensions
          .map(extension => extension.selectorHandler)
          .filter(handler => handler)
      );
    }

    const fallbackCss = (...styles) => {
      return clientInstance.injectAndGetClassName(!props.noImportant, styles, handlers);
    };

    if (props.renderer) {
      this.state = { css: props.renderer._css.bind(props.renderer) };
      if (props.ids) {
        props.renderer._addRenderedClassNames(props.ids);
      }
      props.renderer._setOptions(!props.noImportant, handlers);
    } else {
      this.state = { css: fallbackCss };
      if (props.ids) {
        clientInstance.addRenderedClassNames(props.ids);
      }
    }
  }

  getChildContext() {
    return { css: this.state.css };
  }

  render() {
    return Children.only(this.props.children)
  }
}

CssProvider.childContextTypes = {
  css: PropTypes.func.isRequired
};

CssProvider.propTypes = {
  renderer:    PropTypes.object,
  extensions:  PropTypes.array,
  noImportant: PropTypes.bool,
  ids:         PropTypes.array,
  children:    PropTypes.element.isRequired
};
