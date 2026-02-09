"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send, CheckCircle } from "lucide-react"

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 
          className="text-2xl font-semibold text-foreground mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          메시지가 전송되었습니다
        </h3>
        <p className="text-muted-foreground mb-6">
          빠른 시일 내에 답변드리겠습니다.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsSubmitted(false)}
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
              placeholder="홍길동"
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="hello@example.com"
              required
              className="bg-background"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subject">제목</Label>
          <Input
            id="subject"
            name="subject"
            placeholder="문의 제목을 입력해주세요"
            required
            className="bg-background"
          />
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
            <option value="membership">멤버십 문의</option>
            <option value="collaboration">협업 제안</option>
            <option value="sponsorship">스폰서십</option>
            <option value="general">일반 문의</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">메시지</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="문의 내용을 자세히 적어주세요"
            required
            rows={5}
            className="bg-background resize-none"
          />
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
      </form>
    </div>
  )
}
