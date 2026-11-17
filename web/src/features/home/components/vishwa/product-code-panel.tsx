/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Check, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

import type { SdkLanguage } from './product-models'

const LANGUAGES: SdkLanguage[] = ['Python', 'TypeScript']
const TOKEN_PATTERN = /("[^"]*"|\b(?:from|import|const|new|await|print)\b)/g

function CodeLine(props: { line: string; number: number }) {
  return (
    <span className='lp-product-code-line'>
      <span className='lp-product-code-number' aria-hidden='true'>
        {props.number}
      </span>
      <span>
        {props.line.split(TOKEN_PATTERN).map((token, index) => {
          if (index % 2 === 0) return token
          return (
            <span
              // oxlint-disable-next-line react/no-array-index-key -- tokens repeat within a line
              key={index}
              className={
                token.startsWith('"')
                  ? 'lp-product-code-string'
                  : 'lp-product-code-keyword'
              }
            >
              {token}
            </span>
          )
        })}
      </span>
    </span>
  )
}

export function ProductCodePanel(props: {
  lines: string[]
  language: SdkLanguage
  onLanguageChange: (language: SdkLanguage) => void
}) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: false })
  const source = props.lines.join('\n')
  const copied = copiedText === source

  return (
    <div className='lp-product-code'>
      <div className='lp-product-code-toolbar'>
        <div
          className='lp-product-languages'
          role='group'
          aria-label={t('SDK language')}
        >
          {LANGUAGES.map((item) => (
            <button
              key={item}
              type='button'
              aria-pressed={props.language === item}
              onClick={() => props.onLanguageChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          type='button'
          className='lp-product-copy'
          onClick={() => copyToClipboard(source)}
          aria-live='polite'
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          <span>{copied ? t('Copied') : t('Copy request')}</span>
        </button>
      </div>
      <pre
        tabIndex={0}
        aria-label={t('{{language}} API request', { language: props.language })}
      >
        <code>
          {props.lines.map((line, index) => (
            <CodeLine
              // oxlint-disable-next-line react/no-array-index-key -- blank lines repeat
              key={index}
              line={line}
              number={index + 1}
            />
          ))}
        </code>
      </pre>
    </div>
  )
}
