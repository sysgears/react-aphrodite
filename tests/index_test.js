import asap from 'asap'
import React from 'react'
import ReactDOM from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import TestUtils from 'react-addons-test-utils'
import { assert } from 'chai'
import jsdom from 'jsdom'
import withCss, { CssProvider, createRenderer } from '../src/index'
import { clientInstance } from '../src/wrapper'

const css = (...styles) => {
  const Component = ({css}) =>
      <div className={css(...styles)} />;
  Component.propTypes = {
    css: React.PropTypes.func.isRequired
  };

  return TestUtils.renderIntoDocument(<div>{withCss(Component)}</div>).children[0].className;
};

const cssToDom = (...styles) => {
  const Component = ({css}) =>
      <div className={css(...styles)} />;
  Component.propTypes = {
    css: React.PropTypes.func.isRequired
  };

  ReactDOM.render(
    withCss(Component),
    document.getElementById('root')
  );
};

const serverCss = Component => {
  const renderer = createRenderer();
  const html = ReactDOMServer.renderToString(<CssProvider renderer={renderer}>{withCss(Component)}</CssProvider>);
  return { html, styles: renderer.getCss(), renderedClassNames: renderer.getRenderedClassNames() };
};

describe('withCss', () => {
  beforeEach(() => {
    global.document = jsdom.jsdom('<!doctype html><html><body><div id="root"><div></body></html>');
    global.window = document.defaultView;
    global.navigator = window.navigator;
    clientInstance.reset();
  });

  afterEach(() => {
    global.document.close();
    delete global.document;
  });

  it('generates class names', () => {
    const sheet = withCss({
      red: {
        color: 'red',
      },

      blue: {
        color: 'blue'
      }
    });

    assert.ok(css(sheet.red, sheet.blue));
  });

  it('filters out falsy inputs', () => {
    const sheet = withCss({
      red: {
        color: 'red',
      },
    });

    assert.equal(css(sheet.red), css(sheet.red, false));
    assert.equal(css(sheet.red), css(false, sheet.red));
  });

  it('accepts arrays of styles', () => {
    const sheet = withCss({
      red: {
        color: 'red',
      },

      blue: {
        color: 'blue'
      }
    });

    assert.equal(css(sheet.red, sheet.blue), css([sheet.red, sheet.blue]));
    assert.equal(css(sheet.red, sheet.blue), css(sheet.red, [sheet.blue]));
    assert.equal(css(sheet.red, sheet.blue), css([sheet.red, [sheet.blue]]));
    assert.equal(css(sheet.red), css(false, [null, false, sheet.red]));
  });

  it('succeeds for with empty args', () => {
    assert(css() != null);
    assert(css(false) != null);
  });

  it('adds styles to the DOM', done => {
    const sheet = withCss({
      red: {
        color: 'red',
      },
    });

    cssToDom(sheet.red);

    asap(() => {
      const styleTags = global.document.getElementsByTagName("style");
      const lastTag = styleTags[styleTags.length - 1];

      assert.include(lastTag.textContent, `${sheet.red._name}{`);
      assert.match(lastTag.textContent, /color:red/);
      done();
    });
  });

  it('only ever creates one style tag', done => {
    const sheet = withCss({
      red: {
        color: 'red',
      },
      blue: {
        color: 'blue',
      },
    });

    cssToDom(sheet.red);

    asap(() => {
      const styleTags = global.document.getElementsByTagName("style");
      assert.equal(styleTags.length, 1);

      css(sheet.blue);

      done();
    });
  });

  it('automatically uses a style tag with the data-aphrodite attribute', done => {
    const style = document.createElement("style");
    style.setAttribute("data-aphrodite", "");
    document.head.appendChild(style);

    const sheet = withCss({
      red: {
        color: 'red',
      },
      blue: {
        color: 'blue',
      },
    });

    cssToDom(sheet.red);

    asap(() => {
      const styleTags = global.document.getElementsByTagName("style");
      assert.equal(styleTags.length, 1);
      const styles = styleTags[0].textContent;

      assert.include(styles, `${sheet.red._name}{`);
      assert.include(styles, 'color:red');

      done();
    });
  });

});

describe('withCss on stylesheets', () => {
  it('assigns a name to stylesheet properties', () => {
    const sheet = withCss({
      red: {
        color: 'red',
      },
      blue: {
        color: 'blue'
      }
    });

    assert.ok(sheet.red._name);
    assert.ok(sheet.blue._name);
    assert.notEqual(sheet.red._name, sheet.blue._name);
  });

  it('assign different names to two different create calls', () => {
    const sheet1 = withCss({
      red: {
        color: 'blue',
      },
    });

    const sheet2 = withCss({
      red: {
        color: 'red',
      },
    });

    assert.notEqual(sheet1.red._name, sheet2.red._name);
  });

  it('assigns the same name to identical styles from different create calls', () => {
    const sheet1 = withCss({
      red: {
        color: 'red',
        height: 20,

        ':hover': {
          color: 'blue',
          width: 40,
        },
      },
    });

    const sheet2 = withCss({
      red: {
        color: 'red',
        height: 20,

        ':hover': {
          color: 'blue',
          width: 40,
        },
      },
    });

    assert.equal(sheet1.red._name, sheet2.red._name);
  });

  it('works for empty stylesheets and styles', () => {
    const emptySheet = withCss({});

    assert.ok(emptySheet);

    const sheet = withCss({
      empty: {}
    });

    assert.ok(sheet.empty._name);
  });
});

describe('Client-side Provider', () => {
  beforeEach(() => {
    global.document = jsdom.jsdom('<!doctype html><html><body><div id="root"><div></body></html>');
    global.window = document.defaultView;
    global.navigator = window.navigator;

    clientInstance.reset();
  });

  afterEach(() => {
    global.document.close();
    global.document = undefined;
  });

  const sheet = withCss({
    red: {
      color: 'red',
    },

    blue: {
      color: 'blue',
    },

    green: {
      color: 'green',
    },
  });

  it('doesn\'t render styles in the renderedClassNames arg', done => {
    ReactDOM.render(
        <CssProvider ids={[sheet.red._name, sheet.blue._name]}>
            {withCss(({css}) =>
                <div>
                    <div className={css(sheet.red)} />
                    <div className={css(sheet.green)} />
                    <div className={css(sheet.blue)} />
                </div>
        )}
        </CssProvider>,
      document.getElementById('root')
    );

    asap(() => {
      const styleTags = global.document.getElementsByTagName("style");
      assert.equal(styleTags.length, 1);
      const styles = styleTags[0].textContent;

      assert.notInclude(styles, `.${sheet.red._name}{`);
      assert.notInclude(styles, `.${sheet.blue._name}{`);
      assert.include(styles, `.${sheet.green._name}{`);
      assert.notMatch(styles, /color:blue/);
      assert.notMatch(styles, /color:red/);
      assert.match(styles, /color:green/);
      assert.match(styles, /!important/);

      done();
    });
  });

  it('doesn\'t include !important if noImportant specified', done => {
    ReactDOM.render(
        <CssProvider noImportant>
            {withCss(({css}) =>
                <div>
                    <div className={css(sheet.red)} />
                </div>
        )}
        </CssProvider>,
      document.getElementById('root')
    );

    asap(() => {
      const styleTags = global.document.getElementsByTagName("style");
      assert.equal(styleTags.length, 1);
      const styles = styleTags[0].textContent;

      assert.match(styles, /color:red/);
      assert.notMatch(styles, /!important/);

      done();
    });
  });
});

describe('Extensions', () => {
  beforeEach(() => {
    global.document = jsdom.jsdom('<!doctype html><html><body><div id="root"><div></body></html>');
    global.window = document.defaultView;
    global.navigator = window.navigator;

    clientInstance.reset();
  });

  afterEach(() => {
    global.document.close();
    global.document = undefined;
  });

  it('accepts empty extensions', done => {
    const sheet = withCss({
      red: {
        color: 'red',
      }
    });

    ReactDOM.render(
        <CssProvider extensions={[]}>
            {withCss(({css}) =>
                <div>
                    <div className={css(sheet.red)} />
                </div>
        )}
        </CssProvider>,
      document.getElementById('root')
    );

    asap(() => {
      const styleTags = global.document.getElementsByTagName("style");
      assert.equal(styleTags.length, 1);

      done();
    });
  });

  it('uses a new selector handler', done => {
    const descendantHandler = (selector, baseSelector,
                               generateSubtreeStyles) => {
      if (selector[0] !== '^') {
        return null;
      }
      return generateSubtreeStyles(
        `.${selector.slice(1)} ${baseSelector}`);
    };

    const descendantHandlerExtension = {
      selectorHandler: descendantHandler,
    };

    const sheet = withCss({
      foo: {
        '^bar': {
          '^baz': {
            color: 'orange',
          },
          color: 'red',
        },
        color: 'blue',
      },
    });

    ReactDOM.render(
        <CssProvider extensions={[descendantHandlerExtension]}>
            {withCss(({css}) =>
                <div>
                    <div className={css(sheet.foo)} />
                </div>
        )}
        </CssProvider>,
      document.getElementById('root')
    );

    asap(() => {
      const styleTags = global.document.getElementsByTagName("style");
      assert.equal(styleTags.length, 1);
      const styles = styleTags[0].textContent;

      assert.notInclude(styles, '^bar');
      assert.include(styles, '.bar .foo');
      assert.include(styles, '.baz .bar .foo');
      assert.include(styles, 'color:red');
      assert.include(styles, 'color:blue');
      assert.include(styles, 'color:orange');

      done();
    });
  });
});

describe('Server-side Provider', () => {
  const sheet = withCss({
    red: {
      color: 'red',
    },

    blue: {
      color: 'blue',
    },

    green: {
      color: 'green',
    },
  });

  it('returns the correct data', () => {
    const { html, styles, renderedClassNames } = serverCss(({css}) =>
        <div className={css(sheet.red)}><div className={css(sheet.blue)} /></div>);

    assert.match(html, /^<div/);

    assert.include(styles, `.${sheet.red._name}{`);
    assert.include(styles, `.${sheet.blue._name}{`);
    assert.match(styles, /color:red/);
    assert.match(styles, /color:blue/);

    assert.include(renderedClassNames, sheet.red._name);
    assert.include(renderedClassNames, sheet.blue._name);
  });

  it('succeeds even if a previous renderer crashed', () => {
    assert.throws(() => {
      serverCss(() => { throw new Error("boo!"); });
    }, "boo!");

    const { html, styles, renderedClassNames } = serverCss(({css}) =>
        <div className={css(sheet.blue)} />);

    assert.match(html, /^<div/);

    assert.include(styles, `.${sheet.blue._name}{`);
    assert.notInclude(styles, `.${sheet.red._name}{`);
    assert.include(styles, 'color:blue');
    assert.notInclude(styles, 'color:red');

    assert.include(renderedClassNames, sheet.blue._name);
    assert.notInclude(renderedClassNames, sheet.red._name);
  });

  it('should inject unique font-faces by src', () => {
    const fontSheet = withCss({
      test: {
        fontFamily: [{
          fontStyle: "normal",
          fontWeight: "normal",
          fontFamily: "My Font",
          src: 'url(blah) format("woff"), url(blah) format("truetype")'
        }, {
          fontStyle: "italic",
          fontWeight: "normal",
          fontFamily: "My Font",
          src: 'url(blahitalic) format("woff"), url(blahitalic) format("truetype")'
        }],
      },

      anotherTest: {
        fontFamily: [{
          fontStyle: "normal",
          fontWeight: "normal",
          fontFamily: "My Font",
          src: 'url(blah) format("woff"), url(blah) format("truetype")'
        }, {
          fontStyle: "normal",
          fontWeight: "normal",
          fontFamily: "My Other Font",
          src: 'url(other-font) format("woff"), url(other-font) format("truetype")',
        }],
      },
    });

    const { styles } = serverCss(({css}) =>
        <div className={css(fontSheet.test)}><div className={css(fontSheet.anotherTest)} /></div>);

    // 3 unique @font-faces should be added
    assert.equal(3, styles.match(/@font\-face/g).length);

    assert.include(styles, "font-style:normal");
    assert.include(styles, "font-style:italic");

    assert.include(styles, 'font-family:"My Font"');
    assert.include(styles, 'font-family:"My Font","My Other Font"');
  });

  it('doesn\'t render styles in the renderedClassNames arg', () => {
    const renderer = createRenderer();
    ReactDOMServer.renderToString(
        <CssProvider renderer={renderer} ids={[sheet.red._name, sheet.blue._name]}>
            {withCss(({css}) =>
                <div>
                    <div className={css(sheet.red)} />
                    <div className={css(sheet.green)} />
                    <div className={css(sheet.blue)} />
                </div>
        )}
        </CssProvider>
    );

    const styles = renderer.getCss();

    assert.notInclude(styles, `.${sheet.red._name}{`);
    assert.notInclude(styles, `.${sheet.blue._name}{`);
    assert.include(styles, `.${sheet.green._name}{`);
    assert.notMatch(styles, /color:blue/);
    assert.notMatch(styles, /color:red/);
    assert.match(styles, /color:green/);
    assert.match(styles, /!important/);
  });
});
