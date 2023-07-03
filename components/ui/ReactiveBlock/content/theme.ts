/** Modified from: https://github.com/mdx-editor/editor/blob/main/src/content/theme.ts */

import { EditorThemeClasses } from 'lexical'
import styles from './theme.module.css'

export const theme: EditorThemeClasses = {
    code: styles.code,
    list: {
        nested: {
            listitem: styles.nestedListItem
        },
        ol: styles.ol,
        ul: styles.ul,
    },
    ltr: styles.ltr,
    paragraph: styles.paragraph,
    quote: styles.quote,
    root: styles.root,
    rtl: styles.rtl,
    table: styles.table,
    tableCellHeader: styles.tableCellHeader,
    tableRow: styles.tableRow,
    text: {
        bold: styles.bold,
        italic: styles.italic,
        underline: styles.underline,
        code: styles.code,
        strikethrough: styles.strikethrough,
        subscript: styles.subscript,
        superscript: styles.superscript,
        underlineStrikethrough: styles.underlineStrikethrough
    },
}