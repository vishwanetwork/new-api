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
import { Link } from '@tanstack/react-router'
import { type CSSProperties, useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { attachCollapse } from '../../lib/vishwa-motion/collapse.js'
import { traffic } from '../../lib/vishwa-motion/fleet.js'
import { TokenFactoryStarfield } from '../../lib/vishwa-motion/starfield.js'
import { LineIcon } from './line-icon'
import { scrollToSection } from './scroll-to-section'

const ASSETS = '/vishwa/landing/'

function ExitWave() {
  return (
    <div className='transit-exit'>
      <div className='gate-wave-plane bore-field'>
        <div className='transit-flash' />
        <div className='transit-ripple' />
      </div>
      <div className='transit-wake' />
      <div className='wave-track'>
        <div className='gate-wave-plane wave-packet'>
          <div className='wave-compression' />
        </div>
        <div className='wave-tip' />
      </div>
    </div>
  )
}

function OrbitalGate() {
  const anchor = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!anchor.current) return
    return traffic.attach(anchor.current)
  }, [])

  return (
    <div className='space-scene' aria-hidden>
      <div
        className='gate-anchor'
        ref={anchor}
        style={
          {
            '--aperture-x': `${traffic.aperture.x * 100}%`,
            '--aperture-y': `${traffic.aperture.y * 100}%`,
          } as CSSProperties
        }
      >
        <div className='gate-float'>
          <ExitWave />
          {traffic.hulls.map((hull) => (
            <div
              className='fleet-ship'
              key={hull.file}
              style={{ '--hull-width': `${hull.width}%` } as CSSProperties}
            >
              <img src={`${ASSETS + hull.file}.webp`} decoding='async' alt='' />
            </div>
          ))}
          <div className='gate-object'>
            <img
              className='gate-surface'
              src={`${ASSETS}armored-gateway.webp`}
              width={1254}
              height={1254}
              alt=''
              fetchPriority='high'
              decoding='async'
            />
            <div className='gate-stator-emission' />
            <canvas className='gate-rotors' aria-hidden />
            <canvas className='gate-rotor-glare' aria-hidden />
          </div>
          <div className='gate-field-glare' />
        </div>
      </div>
    </div>
  )
}

export function LandingHero(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  const track = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!track.current) return
    return attachCollapse(track.current)
  }, [])

  return (
    <div className='universe-scroll' ref={track}>
      <div className='universe-stage'>
        <div className='universe-lens'>
          <section className='space-hero' aria-labelledby='lp-hero-title'>
            <TokenFactoryStarfield />
            <OrbitalGate />
            <div className='lp-container space-hero-inner'>
              <div className='space-copy'>
                <h1 id='lp-hero-title'>
                  {t('Intelligence.')}
                  <span>{t('On your terms.')}</span>
                </h1>
                <p>
                  {t('One API for leading AI models.')}
                  <br />
                  {t('One balance, billed by usage.')}
                </p>
                <div className='space-hero-actions'>
                  <Link
                    className='lp-button lp-primary'
                    to={props.isAuthenticated ? '/dashboard' : '/sign-up'}
                  >
                    {props.isAuthenticated
                      ? t('Go to Dashboard')
                      : t('Start building')}
                    <LineIcon name='diagonal' />
                  </Link>
                  <button
                    type='button'
                    className='lp-button lp-secondary'
                    onClick={() => scrollToSection('lp-product-title')}
                  >
                    {t('Explore the platform')}
                    <LineIcon name='down' />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
        <i className='universe-kernel' aria-hidden />
      </div>
      <div className='universe-travel' aria-hidden />
    </div>
  )
}
