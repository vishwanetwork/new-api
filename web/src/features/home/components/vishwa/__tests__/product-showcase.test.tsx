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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { statusQueryOptions } from '@/lib/status-query'

import { LandingProduct } from '../landing-product'

function renderShowcase(status: Record<string, unknown>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  client.setQueryData(statusQueryOptions.queryKey, status)
  return render(
    <QueryClientProvider client={client}>
      <LandingProduct />
    </QueryClientProvider>
  )
}

describe('landing product showcase', () => {
  it('uses the configured server address as the SDK base URL', () => {
    renderShowcase({ server_address: 'https://gateway.example.com/' })

    expect(
      screen.getByLabelText('Python API request', { selector: 'pre' })
    ).toHaveTextContent('base_url="https://gateway.example.com/v1"')
  })

  it('falls back to the current origin when no server address is configured', () => {
    renderShowcase({})

    expect(
      screen.getByLabelText('Python API request', { selector: 'pre' })
    ).toHaveTextContent(`base_url="${window.location.origin}/v1"`)
  })

  it('requests the model picked in the catalog', async () => {
    const user = userEvent.setup()
    renderShowcase({})

    await user.click(screen.getByRole('button', { name: /GPT-4o/ }))

    expect(screen.getByRole('button', { name: /GPT-4o/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(
      screen.getByLabelText('Python API request', { selector: 'pre' })
    ).toHaveTextContent('model="gpt-4o"')
  })

  it('moves between tabs with the arrow keys and wraps at the ends', async () => {
    const user = userEvent.setup()
    renderShowcase({})
    const catalog = screen.getByRole('tab', { name: 'Model catalog' })
    catalog.focus()

    await user.keyboard('{ArrowRight}')

    const integration = screen.getByRole('tab', { name: 'API integration' })
    expect(integration).toHaveFocus()
    expect(integration).toHaveAttribute('aria-selected', 'true')
    expect(catalog).toHaveAttribute('aria-selected', 'false')

    await user.keyboard('{ArrowLeft}{ArrowLeft}')

    expect(screen.getByRole('tab', { name: 'Usage' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })
})
