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
import { InstagramIcon } from '@/components/icons/instagram-icon'

const contactDetails = [
  {
    icon: Mail,
    label: '이메일',
    value: 'team@beyond-imagination.net',
    href: 'mailto:team@beyond-imagination.net',
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
    value: '매월 첫번째 토요일 오후 4시',
    href: null,
  },
]

const socialLinks = [
  {
    icon: GitHubIcon,
    label: 'GitHub',
    value: 'github.com/beyond-imagination',
    href: 'https://github.com/beyond-imagination',
  },
  {
    icon: MessageCircle,
    label: '카카오톡 단톡방',
    value: 'open.kakao.com/o/gMapmsuf',
    href: 'https://open.kakao.com/o/gMapmsuf',
  },
  {
    icon: InstagramIcon,
    label: '인스타그램',
    value: '@team.beyond_imagination',
    href: 'https://instagram.com/team.beyond_imagination',
  },
]

const faqItems = [
  {
    question: '누구나 참여할 수 있나요?',
    answer:
      '네! Beyond Imagination은 기술과 창의성에 관심이 있는 모든 분들을 환영합니다. 학생, 개발자, 디자이너, 기획자 등 다양한 배경을 가진 분들이 함께 활동하고 있습니다. 경험이나 실력에 관계없이 배우고자 하는 열정만 있다면 누구나 참여하실 수 있습니다.',
  },
  {
    question: '회비가 있나요?',
    answer:
      '아니요, Beyond Imagination은 비영리 커뮤니티로 운영되며 회비가 없습니다. 다만, 일부 오프라인 행사나 워크샵의 경우 장소 대관비나 다과비 등을 참가자들이 공동으로 부담하는 경우가 있을 수 있습니다. 이런 경우에도 사전에 공지되며, 부담 없는 수준으로 진행됩니다.',
  },
  {
    question: '온라인으로 참여할 수 있나요?',
    answer:
      '물론입니다! 정기 모임은 오프라인으로 진행되지만, Discord를 통해 온라인으로도 활발히 소통하고 있습니다. 스터디, 코드 리뷰, 프로젝트 협업 등 대부분의 활동이 온라인으로도 가능합니다. 지역이나 시간 제약 없이 편하게 참여하실 수 있습니다.',
  },
]

export function ContactInfo() {
  const [selectedFaq, setSelectedFaq] = useState<{ question: string; answer: string } | null>(null)

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
            <DialogDescription className="text-base leading-relaxed text-foreground/80">
              {selectedFaq?.answer}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
