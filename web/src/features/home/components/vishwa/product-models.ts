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
import DeepSeek from '@lobehub/icons/es/DeepSeek/components/Color'
import Gemini from '@lobehub/icons/es/Gemini/components/Color'
import Mistral from '@lobehub/icons/es/Mistral/components/Color'
import OpenAI from '@lobehub/icons/es/OpenAI/components/Mono'
import Qwen from '@lobehub/icons/es/Qwen/components/Color'
import type { ComponentType } from 'react'

export type ProductModel = {
  id: string
  name: string
  provider: string
  /** Vector mark from the icon set, when the provider has one. */
  Icon?: ComponentType<{ size?: number }>
  /** Raster mark under /vishwa/provider-logos, used when there is no Icon. */
  markFile?: string
  /** i18n key */
  capabilityKey: string
  input: number
  output: number
  cost: string
}

export const VIDEO_MODEL_ID = 'dreamina-seedance-2-0-260128'

// Showcase rows for the landing demo, in the editorial popularity order.
// Figures illustrate one sample request; live rates are on the pricing page.
export const PRODUCT_MODELS: ProductModel[] = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    Icon: DeepSeek,
    capabilityKey: 'Text & code',
    input: 783,
    output: 194,
    cost: '$0.000586',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    Icon: OpenAI,
    capabilityKey: 'Text & vision',
    input: 958,
    output: 326,
    cost: '$0.004025',
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    Icon: Anthropic,
    capabilityKey: 'Reasoning & code',
    input: 1590,
    output: 526,
    cost: '$0.009504',
  },
  {
    id: 'kimi-k3.1-pro',
    name: 'Kimi K3.1 Pro',
    provider: 'Kimi',
    markFile: 'kimi-mark.png',
    capabilityKey: 'Vision & reasoning',
    input: 0,
    output: 0,
    cost: '—',
  },
  {
    id: 'MiniMax-M2.7',
    name: 'MiniMax M2.7',
    provider: 'MiniMax',
    markFile: 'minimax-mark.ico',
    capabilityKey: 'Reasoning & code',
    input: 0,
    output: 0,
    cost: '—',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    Icon: Gemini,
    capabilityKey: 'Multimodal',
    input: 675,
    output: 187,
    cost: '$0.002719',
  },
  {
    id: 'qwen3-coder',
    name: 'Qwen3 Coder',
    provider: 'Qwen',
    Icon: Qwen,
    capabilityKey: 'Code',
    input: 1062,
    output: 302,
    cost: '$0.001000',
  },
  {
    id: VIDEO_MODEL_ID,
    name: 'Seedance 2.0',
    provider: 'ByteDance Seed',
    markFile: 'bytedance-seed-mark.ico',
    capabilityKey: 'Video & audio',
    input: 0,
    output: 0,
    cost: '—',
  },
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: 'Mistral',
    Icon: Mistral,
    capabilityKey: 'Text & reasoning',
    input: 422,
    output: 228,
    cost: '$0.000885',
  },
]

export type SdkLanguage = 'Python' | 'TypeScript'

/** Sample request for the chosen model against this gateway's endpoint. */
export function requestLines(
  language: SdkLanguage,
  modelId: string,
  endpoint: string
): string[] {
  if (modelId === VIDEO_MODEL_ID) {
    return language === 'Python'
      ? [
          'import os, requests',
          '',
          'task = requests.post(',
          `    "${endpoint}/video/generations",`,
          '    headers={"Authorization": "Bearer " + os.environ["VISHWA_API_KEY"]},',
          '    json={',
          `        "model": "${modelId}",`,
          '        "prompt": "A sunrise over a calm ocean.",',
          '        "duration": 5,',
          '    },',
          ')',
          'print(task.json())',
        ]
      : [
          'const response = await fetch(',
          `  "${endpoint}/video/generations", {`,
          '    method: "POST",',
          '    headers: { "Content-Type": "application/json",',
          '      Authorization: "Bearer " + process.env.VISHWA_API_KEY },',
          '    body: JSON.stringify({',
          `      model: "${modelId}",`,
          '      prompt: "A sunrise over a calm ocean.",',
          '      duration: 5,',
          '    }),',
          '  })',
          'console.log(await response.json())',
        ]
  }
  return language === 'Python'
    ? [
        'import os',
        'from openai import OpenAI',
        '',
        'client = OpenAI(',
        '    api_key=os.environ["VISHWA_API_KEY"],',
        `    base_url="${endpoint}",`,
        ')',
        '',
        'response = client.chat.completions.create(',
        `    model="${modelId}",`,
        '    messages=[{"role": "user", "content": "Hello"}],',
        ')',
        'print(response.choices[0].message.content)',
      ]
    : [
        'import OpenAI from "openai"',
        '',
        'const client = new OpenAI({',
        '  apiKey: process.env.VISHWA_API_KEY,',
        `  baseURL: "${endpoint}",`,
        '})',
        '',
        'const response = await client.chat.completions.create({',
        `  model: "${modelId}",`,
        '  messages: [{ role: "user", content: "Hello" }],',
        '})',
        '',
        'console.log(response.choices[0].message.content)',
      ]
}
