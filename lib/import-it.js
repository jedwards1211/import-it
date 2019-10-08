'use babel'
import { CompositeDisposable } from 'atom'
import fs from 'fs-extra'
import jscodeshift from 'jscodeshift'
import addImports from 'jscodeshift-add-imports'
import Client from 'dude-wheres-my-module/Client'
import findRoot from 'find-root'
import PickImportList from './PickImportList'

const j = jscodeshift.withParser('babylon')

export default {
  subscriptions: null,
  pickImportList: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()
    this.pickImportList = new PickImportList()

    // Register command that toggles this view
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'import-it:add-imports': () => this.addImports(),
      })
    )
  },

  deactivate() {
    this.subscriptions.dispose()
    this.pickImportList.dispose()
  },

  serialize() {
    return {}
  },

  async addImports() {
    const editor = atom.workspace.getActiveTextEditor()
    if (!editor)
      throw new Error("There's no active editor to perform a transform on")
    const buffer = editor.getBuffer()
    const file = buffer.getPath()
    const text = buffer.getText()

    const client = new Client(findRoot(file))
    client.on('progress', ({ completed, total }) =>
      this.pickImportList.setProgress({
        completed,
        total,
      })
    )
    this.pickImportList.open()

    let first = true
    const root = j(text)
    const suggestions = await client.suggest({ code: text, file })
    for (let key in suggestions) {
      const { identifier, start, context, suggested } = suggestions[key]
      try {
        if (!suggested.length) {
          continue
        } else if (suggested.length === 1) {
          addImports(root, suggested[0].ast, { commonjs: true })
        } else {
          const selected = await new Promise((resolve, reject) => {
            try {
              this.pickImportList.setContext({
                identifier,
                line: start.line,
                context,
              })
              this.pickImportList.setImports(suggested)
              this.pickImportList.setOnSelected(resolve)
              this.pickImportList.open()
            } catch (error) {
              reject(error)
            }
          })
          if (selected) {
            addImports(root, selected.ast)
          }
        }
      } catch (error) {
        console.error(error.stack) // eslint-disable-line no-console
      }
      first = false
    }

    this.pickImportList.hide()

    const newText = root.toSource()

    if (newText !== text) {
      buffer.setTextViaDiff(newText)
    }
  },
}
