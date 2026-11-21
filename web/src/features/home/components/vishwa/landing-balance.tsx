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
import Anthropic from '@lobehub/icons/es/Anthropic/components/Mono'
import Gemini from '@lobehub/icons/es/Gemini/components/Color'
import OpenAI from '@lobehub/icons/es/OpenAI/components/Mono'
import { CreditCard, KeyRound, Wallet } from 'lucide-react'
import {
  type ComponentType,
  type CSSProperties,
  useEffect,
  useRef,
} from 'react'
import { useTranslation } from 'react-i18next'

const INCOMING = [
  'M0 60H22C48 60 45 90 69 90H100',
  'M0 120H22C48 120 45 90 69 90H100',
]
const OUTGOING = [
  'M0 90H18C48 90 42 30 70 30H100',
  'M0 90H100',
  'M0 90H18C48 90 42 150 70 150H100',
]

function BalanceLinks(props: { paths: string[]; side: 'in' | 'out' }) {
  const arrows = props.side === 'in' ? [90] : [30, 90, 150]
  return (
    <svg
      className='balance-links'
      viewBox='0 0 100 180'
      preserveAspectRatio='none'
      fill='none'
      aria-hidden
    >
      {props.paths.map((d) => (
        <path d={d} key={`rail${d}`} className='balance-rail' pathLength={1} />
      ))}
      {props.paths.map((d, i) => (
        <path
          d={d}
          key={`pulse${d}`}
          className='balance-signal'
          pathLength={1}
          style={
            {
              '--signal-delay': `${props.side === 'in' ? -i * 1.8 : 1 + i * 1.5}s`,
            } as CSSProperties
          }
        />
      ))}
      {arrows.map((y) => (
        <path
          key={y}
          className='balance-arrow'
          d={`M90 ${y - 3.3} L96 ${y} L90 ${y + 3.3}`}
        />
      ))}
    </svg>
  )
}

/** Three cut-metal credit plates, lit from above left. */
function CreditMark() {
  return (
    <svg className='balance-mark' viewBox='0 0 72 60' fill='none' aria-hidden>
      <defs>
        <linearGradient id='plate-silver' x1='.08' y1='.1' x2='.78' y2='.95'>
          <stop stopColor='#e2edf0' />
          <stop offset='.55' stopColor='#9aadb7' />
          <stop offset='1' stopColor='#63757f' />
        </linearGradient>
      </defs>
      {[14, 7, 0].map((y, i) => (
        <g key={y} transform={`translate(0 ${y})`}>
          <path
            d='M4 19.5 38 4 68 15 34.5 31Z'
            fill={i === 2 ? 'url(#plate-silver)' : '#83939c'}
            stroke='#d8e4e9'
            strokeWidth='.8'
          />
          <path
            d='M4 19.5 34.5 31V36L4 24.4Z'
            fill='#394952'
            stroke='#8799a2'
            strokeWidth='.75'
          />
          <path
            d='M34.5 31 68 15V20L34.5 36Z'
            fill='#27343d'
            stroke='#74858e'
            strokeWidth='.75'
          />
        </g>
      ))}
      <path
        d='m28 18 10-4.6 7.8 3-10.2 4.6z'
        stroke='#42535e'
        strokeWidth='1.2'
      />
    </svg>
  )
}

function BalanceNode(props: {
  name: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
}) {
  return (
    <div className='balance-node'>
      <props.icon size={21} strokeWidth={1.55} aria-hidden />
      <span>{props.name}</span>
    </div>
  )
}

export function LandingBalance() {
  const { t } = useTranslation()
  const scene = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = scene.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) =>
      el.toggleAttribute('data-in-view', entry.isIntersecting)
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section
      className='lp-credit-section balance-scene'
      aria-labelledby='lp-credit-title'
      ref={scene}
    >
      <span className='credit-galaxy' aria-hidden />
      <div className='lp-container balance-layout'>
        <div className='balance-copy'>
          <h2 id='lp-credit-title'>
            {t('Your models.')}
            <br />
            <span>{t('One balance.')}</span>
          </h2>
          <p>{t('Track the input and output tokens for every request.')}</p>
        </div>
        <figure
          className='balance-map'
          role='img'
          aria-label={t(
            'Fiat and crypto fund one workspace balance. One API key connects that balance to OpenAI, Anthropic and Gemini.'
          )}
        >
          <div className='balance-stack balance-funding'>
            <BalanceNode name={t('Fiat')} icon={CreditCard} />
            <BalanceNode name={t('Crypto')} icon={Wallet} />
          </div>
          <BalanceLinks paths={INCOMING} side='in' />
          <div className='balance-core'>
            <div className='balance-credit'>
              <CreditMark />
              <strong>{t('Credit')}</strong>
            </div>
            <div className='balance-key'>
              <KeyRound size={16} aria-hidden />
              {t('API key')}
            </div>
          </div>
          <BalanceLinks paths={OUTGOING} side='out' />
          <div className='balance-stack balance-providers'>
            <BalanceNode name='OpenAI' icon={OpenAI} />
            <BalanceNode name='Anthropic' icon={Anthropic} />
            <BalanceNode name='Gemini' icon={Gemini} />
          </div>
        </figure>
      </div>
    </section>
  )
}
