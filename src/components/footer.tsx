import { Link } from 'react-router-dom'
import { Mail, MessageCircle } from 'lucide-react'
import { GitHubIcon } from '@/components/icons/github-icon'
import { InstagramIcon } from '@/components/icons/instagram-icon'

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.svg"
                alt="Beyond Imagination Logo"
                width={40}
                height={40}
                className="brightness-0 invert"
              />
              <span className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                Beyond Imagination
              </span>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              상상 그 너머의 가능성을 탐구하는 개발자 모임
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: '/projects', label: 'Projects' },
                { href: '/team', label: 'Team' },
                { href: '/gallery', label: 'Gallery' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Connect</h4>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/beyond-imagination"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                aria-label="GitHub"
              >
                <GitHubIcon className="w-5 h-5" />
              </a>
              <a
                href="mailto:team@beyond-imagination.net"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://open.kakao.com/o/gMapmsuf"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                aria-label="Kakao Open Chat"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/team.beyond_imagination"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="text-sm text-primary-foreground/50">
            &copy; {new Date().getFullYear()} Beyond Imagination. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
