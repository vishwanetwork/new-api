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
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const QUESTIONS = [
  {
    questionKey: 'What am I purchasing?',
    answerKey:
      'Credit for your Vishwa workspace. One balance gives you access to the models in the catalog, with usage charged at each model’s input and output rates.',
  },
  {
    questionKey: 'Do I need to change my SDK?',
    answerKey:
      'Use an OpenAI-compatible SDK with the Vishwa endpoint and your API key. Select a model by its ID and keep your existing request structure.',
  },
  {
    questionKey: 'How is token usage priced?',
    answerKey:
      'Input and output tokens are priced separately for each model. Your activity view shows the token counts, applied rates, and cost of each request.',
  },
]

export function LandingFaq() {
  const { t } = useTranslation()
  const [openQuestion, setOpenQuestion] = useState<number | null>(null)

  return (
    <section className='lp-container lp-faq' aria-labelledby='lp-faq-title'>
      <div>
        <h2 id='lp-faq-title'>
          {t('Clarity,')}
          <br />
          <span>{t('from the start.')}</span>
        </h2>
      </div>
      <div className='lp-faq-list'>
        {QUESTIONS.map((item, i) => (
          <div className='lp-faq-item' key={item.questionKey}>
            <h3>
              <button
                type='button'
                aria-expanded={openQuestion === i}
                aria-controls={`lp-answer-${i}`}
                id={`lp-question-${i}`}
                onClick={() => setOpenQuestion(openQuestion === i ? null : i)}
              >
                {t(item.questionKey)}
                <ChevronDown size={20} />
              </button>
            </h3>
            <div
              id={`lp-answer-${i}`}
              role='region'
              aria-labelledby={`lp-question-${i}`}
              hidden={openQuestion !== i}
            >
              <p>{t(item.answerKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
