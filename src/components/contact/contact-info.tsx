import { Mail, MapPin, Clock, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GitHubIcon } from '@/components/icons/github-icon'
import generatedFaqItems from '@/data/contact-faq.generated.json'

const contactDetails = [
  {
    icon: Mail,
    label: '이메일',
    value: 'contact@beyondimagination.dev',
    href: 'mailto:contact@beyondimagination.dev',
  },
  {
    icon: MapPin,
    label: '활동 지역',
    value: '서울, 대한민국',
    href: null,
  },
  {
    icon: Clock,
    label: '정기 모임',
    value: '매주 토요일 오후 2시',
    href: null,
  },
]

const socialLinks = [
  {
    icon: GitHubIcon,
    label: 'GitHub',
    value: 'github.com/beyond-imagination',
    href: 'https://github.com',
  },
  {
    icon: MessageCircle,
    label: 'Discord',
    value: 'discord.gg/beyond-imagination',
    href: 'https://discord.com',
  },
]

type FaqItem = {
  question: string
  answer: string
}

const faqItems = generatedFaqItems as FaqItem[]

export function ContactInfo() {
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null)

  return (
    <div className="space-y-8">
      {/* Contact Details */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <h2
          className="text-2xl font-semibold text-foreground mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          연락처 정보
        </h2>
        <ul className="space-y-6">
          {contactDetails.map((item) => (
            <li key={item.label} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-foreground font-medium hover:text-accent transition-colors"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-foreground font-medium">{item.value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Social Links */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <h2
          className="text-2xl font-semibold text-foreground mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          커뮤니티
        </h2>
        <ul className="space-y-6">
          {socialLinks.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-xl transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-accent transition-colors">
                    {item.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* FAQ Teaser */}
      <div className="bg-primary text-primary-foreground rounded-2xl p-8">
        <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
          자주 묻는 질문
        </h3>
        <p className="text-primary-foreground/80 text-sm leading-relaxed mb-4">
          멤버십 가입, 참여 방법, 활동 내용 등에 대해 궁금하신 점이 있으시면 FAQ를 확인해보세요.
        </p>
        <ul className="space-y-2 text-sm">
          {faqItems.map((faq, index) => (
            <li
              key={index}
              className="flex items-center gap-2 cursor-pointer hover:translate-x-1 transition-transform"
              onClick={() => setSelectedFaq(faq)}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-primary-foreground/90 hover:text-primary-foreground">
                {faq.question}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* FAQ Dialog */}
      <Dialog open={!!selectedFaq} onOpenChange={(open: boolean) => !open && setSelectedFaq(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="bg-linear-to-br from-accent/10 via-primary/5 to-transparent p-8 border-b border-border">
            <DialogHeader>
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-accent" />
              </div>
              <DialogTitle
                className="text-2xl font-bold text-foreground leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {selectedFaq?.question}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8 pt-6">
            <DialogDescription className="text-base leading-relaxed text-foreground/80 whitespace-pre-line">
              {selectedFaq?.answer}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
