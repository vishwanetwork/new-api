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
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/layout/components/footer'

import { LandingBalance } from './landing-balance'
import { LandingFaq } from './landing-faq'
import { LandingHeader } from './landing-header'
import { LandingHero } from './landing-hero'
import { LandingProduct } from './landing-product'
import { ProviderMarquee } from './provider-marquee'

import '@/styles/vishwa/landing.css'

/**
 * Vishwa Gateway landing page. Always rendered on the dark space canvas,
 * independent of the interface theme.
 */
export function VishwaLanding(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  return (
    <div className='tf-landing dark'>
      <div className='vg-landing lp-landing'>
        <LandingHeader isAuthenticated={props.isAuthenticated} />
        <main>
          <LandingHero isAuthenticated={props.isAuthenticated} />
          <ProviderMarquee />
          <section
            className='lp-container lp-product-section'
            aria-labelledby='lp-product-title'
          >
            <div className='lp-section-intro'>
              <h2 id='lp-product-title'>
                {t('Built for how')}
                <br />
                <span>{t('you build.')}</span>
              </h2>
            </div>
            <LandingProduct />
          </section>
          <LandingBalance />
          <LandingFaq />
          <section className='lp-container lp-closing'>
            <div className='lp-closing-horizon' aria-hidden='true' />
            <h2>{t('Build what comes next.')}</h2>
            <Link
              className='lp-button lp-primary'
              to={props.isAuthenticated ? '/dashboard' : '/sign-in'}
            >
              {props.isAuthenticated
                ? t('Go to Dashboard')
                : t('Start building')}
              <ArrowRight size={18} />
            </Link>
          </section>
        </main>
        <div className='lp-app-footer'>
          <Footer />
        </div>
      </div>
    </div>
  )
}
