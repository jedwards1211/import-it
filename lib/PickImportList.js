'use babel'

const { SelectListView, TextEditorView } = require('atom-space-pen-views')

function getSource(ast) {
  if (ast.source) return ast.source.value
  if (ast.declarations) {
    const declaration = ast.declarations[0]
    if (declaration && declaration.init.type === 'CallExpression') {
      return declaration.init.arguments[0].value
    }
  }
  return '?'
}

module.exports = class PickImportList extends SelectListView {
  static content() {
    return this.div(
      {
        class: 'select-list',
      },
      () => {
        this.div({
          class: 'identifier',
          outlet: 'identifierArea',
        })
        this.div({
          class: 'context',
          outlet: 'contextArea',
        })
        this.subview(
          'filterEditorView',
          new TextEditorView({
            mini: true,
          })
        )
        this.div({
          class: 'error-message',
          outlet: 'error',
        })
        this.div(
          {
            class: 'loading',
            outlet: 'loadingArea',
          },
          () => {
            this.span({
              class: 'loading-message',
              outlet: 'loading',
            })
            return this.span({
              class: 'badge',
              outlet: 'loadingBadge',
            })
          }
        )
        return this.ol({
          class: 'list-group',
          outlet: 'list',
        })
      }
    )
  }

  viewForItem({ code, ast }) {
    return `
      <li class="two-lines">
        <div class="primary-line">${getSource(ast)}</div>
        <div class="secondary-line">${code}</div>
      </li>
    `
  }

  setContext({ identifier, line, context }) {
    this.identifierArea.text(identifier)
    this.contextArea.text(`${line} | ${context}`)
  }

  clearContext() {
    this.identifierArea.text('')
    this.contentArea.text('')
  }

  setProgress(progress) {
    if (!progress) {
      this.loadingArea.text('')
      return
    }
    const { completed, total } = progress
    this.loadingArea.text(
      `Server is starting... ${completed}/${total} (${Math.floor(
        (completed * 100) / total
      )}%)`
    )
  }

  setImports(imports) {
    this.loadingArea.text('')
    this.setItems(
      imports.map(imp =>
        Object.assign({}, imp, {
          filterKey: `${getSource(imp.ast)}`,
        })
      )
    )
  }

  getFilterKey() {
    return 'filterKey'
  }

  setOnSelected(onSelected) {
    this.onSelected = onSelected
  }

  async confirmed(imp) {
    if (this.onSelected) this.onSelected(imp)
    this.hide()
  }

  cancelled() {
    if (this.onSelected) this.onSelected(null)
    this.hide()
  }

  open() {
    if (this.isOpen) return
    this.isOpen = true

    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({ item: this })
    }

    this.storeFocusedElement()
    this.panel.show()
    this.focusFilterEditor()
  }

  hide() {
    if (!this.isOpen) return
    this.isOpen = false

    if (this.panel) {
      this.panel.hide()
    }
    this.restoreFocus()
  }
}
