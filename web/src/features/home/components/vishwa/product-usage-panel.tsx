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
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { toIntlLocale } from '@/i18n/languages'
import { formatNumber } from '@/lib/format'

import { ModelMark } from './model-mark'
import { type ProductModel, VIDEO_MODEL_ID } from './product-models'

function TokenSplit(props: { model: ProductModel }) {
  const { t } = useTranslation()
  const total = props.model.input + props.model.output
  const inputShare = Math.round((props.model.input / total) * 100)
  const outputShare = 100 - inputShare
  return (
    <>
      <div
        className='lp-product-token-bar'
        aria-label={t('Input {{input}}%, output {{output}}%', {
          input: inputShare,
          output: outputShare,
        })}
      >
        <span style={{ flexGrow: props.model.input }} />
        <span style={{ flexGrow: props.model.output }} />
      </div>
      <dl className='lp-product-token-legend'>
        <div>
          <dt>
            <i />
            {t('Input')}
          </dt>
          <dd>{inputShare}%</dd>
        </div>
        <div>
          <dt>
            <i />
            {t('Output')}
          </dt>
          <dd>{outputShare}%</dd>
        </div>
      </dl>
    </>
  )
}

export function ProductUsagePanel(props: { model: ProductModel }) {
  const { i18n, t } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const model = props.model
  const isVideo = model.id === VIDEO_MODEL_ID
  const metered = model.input + model.output > 0
  const tokens = (value: number) =>
    metered ? formatNumber(value, locale) : '—'

  return (
    <div
      className='lp-product-usage-grid'
      tabIndex={0}
      aria-label={t('Request breakdown details')}
    >
      <div className='lp-product-meter'>
        <div className='lp-product-request-model'>
          <span className='lp-product-provider'>
            <ModelMark model={model} size={27} />
          </span>
          <div>
            <strong>{model.name}</strong>
            <span>{model.provider}</span>
          </div>
          {metered && (
            <span className='lp-product-request-count'>{t('1 request')}</span>
          )}
        </div>
        <div className='lp-product-consumption'>
          <div>
            <span>{isVideo ? t('Video duration') : t('Total tokens')}</span>
            <strong>
              {isVideo ? '5s' : tokens(model.input + model.output)}
            </strong>
          </div>
        </div>
        {metered && <TokenSplit model={model} />}
      </div>
      <div className='lp-product-receipt'>
        <dl>
          <div>
            <dt>
              <ArrowUpRight size={17} />
              {isVideo ? t('Resolution') : t('Input tokens')}
            </dt>
            <dd>{isVideo ? '1080p · 16:9' : tokens(model.input)}</dd>
          </div>
          <div>
            <dt>
              <ArrowDownLeft size={17} />
              {isVideo ? t('Output') : t('Output tokens')}
            </dt>
            <dd>{isVideo ? t('Video + audio') : tokens(model.output)}</dd>
          </div>
          <div className='lp-product-request-cost'>
            <dt>{metered ? t('Request cost') : t('Pricing pending')}</dt>
            <dd>{model.cost}</dd>
          </div>
        </dl>
        <div className='lp-product-receipt-base'>
          <span>{t('Model ID')}</span>
          <code>{model.id}</code>
        </div>
      </div>
    </div>
  )
}
