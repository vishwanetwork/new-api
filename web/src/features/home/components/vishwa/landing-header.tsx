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
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { VishwaBrand } from './brand'
import { LineIcon } from './line-icon'
import { scrollToSection } from './scroll-to-section'

const SECTIONS = [
  { labelKey: 'Platform', id: 'lp-product-title' },
  { labelKey: 'Billing', id: 'lp-credit-title' },
  { labelKey: 'FAQ', id: 'lp-faq-title' },
]

export function LandingHeader(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButton.current?.focus()
    }
    const onOutside = (event: Event) => {
      if (!header.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onOutside)
    document.addEventListener('focusin', onOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onOutside)
      document.removeEventListener('focusin', onOutside)
    }
  }, [menuOpen])

  return (
    <header className='space-header' ref={header}>
      <div className='space-header-inner'>
        <Link
          className='space-brand'
          to='/'
          aria-label={t('Vishwa Gateway home')}
          onClick={() => {
            setMenuOpen(false)
            window.scrollTo({ top: 0, behavior: 'instant' })
          }}
        >
          <VishwaBrand />
        </Link>
        <nav
          id='space-nav'
          className='space-nav'
          data-open={menuOpen}
          aria-label={t('Main navigation')}
        >
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(event) => {
                event.preventDefault()
                setMenuOpen(false)
                scrollToSection(section.id)
              }}
            >
              {t(section.labelKey)}
            </a>
          ))}
          <Link to='/pricing' onClick={() => setMenuOpen(false)}>
            {t('Models')}
          </Link>
        </nav>
        <div className='space-header-actions'>
          <Link
            className='space-signin'
            to={props.isAuthenticated ? '/dashboard' : '/sign-in'}
          >
            {props.isAuthenticated ? t('Console') : t('Sign in')}
            <LineIcon name='diagonal' />
          </Link>
          <button
            type='button'
            className='space-menu'
            ref={menuButton}
            aria-expanded={menuOpen}
            aria-controls='space-nav'
            aria-label={menuOpen ? t('Close menu') : t('Open menu')}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <LineIcon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  )
}
