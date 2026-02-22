import React from 'react'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send, CheckCircle } from 'lucide-react'

// 디스코드 웹훅으로는 최대 2000자밖에 못보내서 아래와 같이 총 1800자 이내로 제한한다
const MAX_NAME_LENGTH = 10
const MAX_EMAIL_LENGTH = 100
const MAX_CATEGORY_LENGTH = 10
const MAX_SUBJECT_LENGTH = 100
const MAX_MESSAGE_LENGTH = 1500

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const webhookUrl = import.meta.env.VITE_DISCORD_CONTACT_WEBHOOK_URL as string | undefined

  const categoryLabels: Record<string, string> = {
    membership: '멤버 지원',
    collaboration: '협업 제안',
    general: '일반 문의',
  }

  const trimField = (value: FormDataEntryValue | null) =>
    typeof value === 'string' ? value.trim() : ''
  const limit = (value: string, max: number) =>
    value.length > max ? `${value.slice(0, max - 1)}…` : value

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = limit(trimField(formData.get('name')) || '-', MAX_NAME_LENGTH)
    const email = limit(trimField(formData.get('email')) || '-', MAX_EMAIL_LENGTH)
    const subject = limit(trimField(formData.get('subject')) || '-', MAX_SUBJECT_LENGTH)
    const category = trimField(formData.get('category'))
    const message = limit(trimField(formData.get('message')) || '-', MAX_MESSAGE_LENGTH)
    const categoryLabel = limit(
      (categoryLabels[category] ?? category) || '미분류',
      MAX_CATEGORY_LENGTH
    )

    try {
      if (!webhookUrl) {
        throw new Error('VITE_DISCORD_CONTACT_WEBHOOK_URL is missing')
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [
            {
              title: '📬 새로운 문의가 도착했습니다!',
              color: 0x5865f2,
              fields: [
                { name: '이름', value: name, inline: true },
                { name: '회신 이메일', value: email },
                { name: '문의 유형', value: categoryLabel },
                { name: '제목', value: subject },
                { name: '문의 내용', value: message },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`Discord webhook failed: ${response.status} ${responseText}`)
      }

      setIsSubmitted(true)
      setFormValues({ name: '', email: '', subject: '', message: '' })
      e.currentTarget.reset()
    } catch (error) {
      console.error('[contact-form] submit failed', error)
      setSubmitError('문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-100">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3
          className="text-2xl font-semibold text-foreground mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          메시지가 전송되었습니다
        </h3>
        <p className="text-muted-foreground mb-6">빠른 시일 내에 답변드리겠습니다.</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSubmitError(null)
            setIsSubmitted(false)
          }}
        >
          새 메시지 작성
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <h2
        className="text-2xl font-semibold text-foreground mb-6"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        메시지 보내기
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              name="name"
              value={formValues.name}
              onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
              maxLength={MAX_NAME_LENGTH}
              placeholder="홍길동"
              required
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground text-right">
              {MAX_NAME_LENGTH - formValues.name.length}자 남음
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
              maxLength={MAX_EMAIL_LENGTH}
              placeholder="hello@example.com"
              required
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground text-right">
              {MAX_EMAIL_LENGTH - formValues.email.length}자 남음
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">제목</Label>
          <Input
            id="subject"
            name="subject"
            value={formValues.subject}
            onChange={(e) => setFormValues((prev) => ({ ...prev, subject: e.target.value }))}
            maxLength={MAX_SUBJECT_LENGTH}
            placeholder="문의 제목을 입력해주세요"
            required
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground text-right">
            {MAX_SUBJECT_LENGTH - formValues.subject.length}자 남음
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">문의 유형</Label>
          <select
            id="category"
            name="category"
            required
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">선택해주세요</option>
            <option value="membership">멤버 지원</option>
            <option value="collaboration">협업 제안</option>
            <option value="general">일반 문의</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">메시지</Label>
          <Textarea
            id="message"
            name="message"
            value={formValues.message}
            onChange={(e) => setFormValues((prev) => ({ ...prev, message: e.target.value }))}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="문의 내용을 자세히 적어주세요"
            required
            rows={5}
            className="bg-background resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {MAX_MESSAGE_LENGTH - formValues.message.length}자 남음
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isSubmitting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              전송 중...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              메시지 보내기
            </>
          )}
        </Button>
        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      </form>
    </div>
  )
}
