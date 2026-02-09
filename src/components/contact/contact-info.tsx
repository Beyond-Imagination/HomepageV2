import { Mail, MapPin, Clock, Github, MessageCircle } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const contactDetails = [
  {
    icon: Mail,
    label: "이메일",
    value: "contact@beyondimagination.dev",
    href: "mailto:contact@beyondimagination.dev",
  },
  {
    icon: MapPin,
    label: "활동 지역",
    value: "서울, 대한민국",
    href: null,
  },
  {
    icon: Clock,
    label: "정기 모임",
    value: "매주 토요일 오후 2시",
    href: null,
  },
]

const socialLinks = [
  {
    icon: Github,
    label: "GitHub",
    value: "github.com/beyond-imagination",
    href: "https://github.com",
  },
  {
    icon: MessageCircle,
    label: "Discord",
    value: "discord.gg/beyond-imagination",
    href: "https://discord.com",
  },
]

const faqItems = [
  {
    question: "누구나 참여할 수 있나요?",
    answer: "네! Beyond Imagination은 기술과 창의성에 관심이 있는 모든 분들을 환영합니다. 학생, 개발자, 디자이너, 기획자 등 다양한 배경을 가진 분들이 함께 활동하고 있습니다. 경험이나 실력에 관계없이 배우고자 하는 열정만 있다면 누구나 참여하실 수 있습니다."
  },
  {
    question: "회비가 있나요?",
    answer: "아니요, Beyond Imagination은 비영리 커뮤니티로 운영되며 회비가 없습니다. 다만, 일부 오프라인 행사나 워크샵의 경우 장소 대관비나 다과비 등을 참가자들이 공동으로 부담하는 경우가 있을 수 있습니다. 이런 경우에도 사전에 공지되며, 부담 없는 수준으로 진행됩니다."
  },
  {
    question: "온라인으로 참여할 수 있나요?",
    answer: "물론입니다! 정기 모임은 오프라인으로 진행되지만, Discord를 통해 온라인으로도 활발히 소통하고 있습니다. 스터디, 코드 리뷰, 프로젝트 협업 등 대부분의 활동이 온라인으로도 가능합니다. 지역이나 시간 제약 없이 편하게 참여하실 수 있습니다."
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
        <ul className="space-y-4">
          {socialLinks.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
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
        <h3 
          className="text-xl font-semibold mb-3"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedFaq?.question}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-4">
              {selectedFaq?.answer}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
