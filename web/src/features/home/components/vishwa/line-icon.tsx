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
const PATHS = {
  diagonal: 'M4 12 12 4M4.5 4H12v7.5',
  down: 'M8 2.5v10M3.5 8l4.5 4.5L12.5 8',
  menu: 'M2 5h12M2 11h12',
  close: 'M3 3l10 10M13 3 3 13',
}

/** Thin 16px stroke glyphs drawn for the landing masthead. */
export function LineIcon(props: { name: keyof typeof PATHS }) {
  return (
    <svg width={16} height={16} viewBox='0 0 16 16' fill='none' aria-hidden>
      <path
        d={PATHS[props.name]}
        stroke='currentColor'
        strokeWidth={1.45}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
