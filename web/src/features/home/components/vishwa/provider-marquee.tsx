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
import { useTranslation } from 'react-i18next'

// Ordered by the editorial popularity snapshot used across the landing.
const PROVIDERS = [
  { name: 'DeepSeek', id: 'deepseek', file: 'deepseek.svg' },
  { name: 'OpenAI', id: 'openai', file: 'openai.svg' },
  { name: 'Anthropic', id: 'anthropic', file: 'anthropic.svg' },
  { name: 'Kimi', id: 'kimi', file: 'kimi.svg' },
  { name: 'MiniMax', id: 'minimax', file: 'minimax.webp' },
  { name: 'Google Gemini', id: 'gemini', file: 'gemini.svg' },
  { name: 'Qwen', id: 'qwen', file: 'qwen.png' },
  { name: 'Seedance', id: 'seedance', file: '' },
  { name: 'Mistral', id: 'mistral', file: 'mistral.svg' },
]

export function ProviderMarquee() {
  const { t } = useTranslation()
  return (
    <section className='lp-providers' aria-label={t('Model providers')}>
      <ul className='lp-sr-only'>
        {PROVIDERS.map((provider) => (
          <li key={provider.id}>{provider.name}</li>
        ))}
      </ul>
      <div className='lp-marquee' aria-hidden='true'>
        <div className='lp-marquee-track'>
          {[0, 1].map((copy) => (
            <div className='lp-marquee-group' key={copy}>
              {PROVIDERS.map((provider) => (
                <div
                  className={`lp-provider lp-provider-${provider.id}`}
                  key={provider.id}
                >
                  {provider.file ? (
                    <img
                      src={`/vishwa/provider-logos/${provider.file}`}
                      alt={provider.name}
                      loading='eager'
                      decoding='async'
                    />
                  ) : (
                    <span className='lp-seedance-wordmark'>
                      {provider.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
