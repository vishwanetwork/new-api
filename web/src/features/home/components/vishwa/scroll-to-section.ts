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
/** Moves focus and scroll to a landing section heading. */
export function scrollToSection(id: string) {
  const target = document.querySelector<HTMLElement>(`#${id}`)
  if (!target) return
  target.tabIndex = -1
  target.focus({ preventScroll: true })
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
  const frame =
    id === 'lp-credit-title' ? (target.closest('section') ?? target) : target
  frame.scrollIntoView({
    behavior: reduceMotion ? 'instant' : 'smooth',
    block: 'start',
  })
}
