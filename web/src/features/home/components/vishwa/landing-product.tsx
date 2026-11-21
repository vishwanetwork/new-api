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
import { Activity, ArrowUpRight, Boxes, Check, Code2 } from 'lucide-react'
import { type KeyboardEvent, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useStatus } from '@/hooks/use-status'

import { VishwaBrand } from './brand'
import { ModelMark } from './model-mark'
import { ProductCodePanel } from './product-code-panel'
import {
  PRODUCT_MODELS,
  requestLines,
  type SdkLanguage,
  VIDEO_MODEL_ID,
} from './product-models'
import { ProductUsagePanel } from './product-usage-panel'

import '@/styles/vishwa/landing-product.css'

const TABS = [
  { id: 'models', labelKey: 'Model catalog', Icon: Boxes },
  { id: 'integration', labelKey: 'API integration', Icon: Code2 },
  { id: 'usage', labelKey: 'Usage', Icon: Activity },
] as const
type Tab = (typeof TABS)[number]['id']

/** OpenAI-compatible base URL: the configured server address, else this origin. */
function useGatewayEndpoint(): string {
  const { status } = useStatus()
  const configured = status?.server_address
  const base =
    typeof configured === 'string' && configured
      ? configured.replace(/\/$/, '')
      : window.location.origin
  return `${base}/v1`
}

export function LandingProduct() {
  const { t } = useTranslation()
  const id = useId()
  const endpoint = useGatewayEndpoint()
  const [active, setActive] = useState<Tab>('models')
  const [modelIndex, setModelIndex] = useState(0)
  const [language, setLanguage] = useState<SdkLanguage>('Python')
  const model = PRODUCT_MODELS[modelIndex]
  const isVideo = model.id === VIDEO_MODEL_ID

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const directions: Record<string, number> = {
      ArrowRight: (index + 1) % TABS.length,
      ArrowLeft: (index + TABS.length - 1) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    }
    const next = directions[event.key]
    if (next === undefined) return
    event.preventDefault()
    setActive(TABS[next].id)
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus()
  }

  return (
    <div className='lp-product'>
      <div
        className='lp-product-tabs'
        role='tablist'
        aria-label={t('Explore the gateway')}
        aria-orientation='horizontal'
      >
        {TABS.map((tab, index) => (
          <button
            type='button'
            key={tab.id}
            id={`${id}-tab-${tab.id}`}
            role='tab'
            aria-selected={active === tab.id}
            aria-controls={`${id}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => onTabKey(event, index)}
          >
            <tab.Icon size={19} aria-hidden='true' />
            <span>{t(tab.labelKey)}</span>
            <span className='lp-product-tab-line' />
          </button>
        ))}
      </div>
      <div className='lp-product-window'>
        <div className='lp-product-chrome'>
          <VishwaBrand />
          <div className='lp-product-window-tools' aria-hidden='true'>
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className='lp-product-stages'>
          <section
            className='lp-product-panel'
            id={`${id}-panel-models`}
            role='tabpanel'
            aria-labelledby={`${id}-tab-models`}
            hidden={active !== 'models'}
            tabIndex={0}
          >
            <header className='lp-product-panel-heading'>
              <h3>{t('Model catalog')}</h3>
            </header>
            <div className='lp-product-model-table'>
              <div className='lp-product-model-columns' aria-hidden='true'>
                <span>{t('Model')}</span>
                <span>{t('Model ID')}</span>
                <span>{t('Capability')}</span>
                <span />
              </div>
              <div
                role='group'
                aria-label={t(
                  'Choose the model used in the API request and usage breakdown'
                )}
              >
                {PRODUCT_MODELS.map((item, index) => (
                  <button
                    key={item.id}
                    type='button'
                    className='lp-product-model'
                    aria-pressed={modelIndex === index}
                    onClick={() => setModelIndex(index)}
                  >
                    <span className='lp-product-model-identity'>
                      <span
                        className={`lp-product-provider provider-${item.provider
                          .toLowerCase()
                          .replaceAll(' ', '-')}`}
                      >
                        <ModelMark model={item} size={24} />
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.provider}</small>
                      </span>
                    </span>
                    <code>{item.id}</code>
                    <span className='lp-product-capability'>
                      {t(item.capabilityKey)}
                    </span>
                    <span className='lp-product-model-check' aria-hidden='true'>
                      {modelIndex === index ? (
                        <Check size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section
            className='lp-product-panel lp-product-integration'
            id={`${id}-panel-integration`}
            role='tabpanel'
            aria-labelledby={`${id}-tab-integration`}
            hidden={active !== 'integration'}
            tabIndex={0}
          >
            <header className='lp-product-panel-heading'>
              <h3>
                {isVideo ? t('Video generation API') : t('API integration')}
              </h3>
            </header>
            <ProductCodePanel
              lines={requestLines(language, model.id, endpoint)}
              language={language}
              onLanguageChange={setLanguage}
            />
          </section>

          <section
            className='lp-product-panel lp-product-usage'
            id={`${id}-panel-usage`}
            role='tabpanel'
            aria-labelledby={`${id}-tab-usage`}
            hidden={active !== 'usage'}
            tabIndex={0}
          >
            <header className='lp-product-panel-heading'>
              <h3>
                {isVideo ? t('Generation settings') : t('Request breakdown')}
              </h3>
            </header>
            <ProductUsagePanel model={model} />
          </section>
        </div>
      </div>
    </div>
  )
}
