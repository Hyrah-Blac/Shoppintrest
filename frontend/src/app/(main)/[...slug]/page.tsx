import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const pageContent: Record<string, { title: string; content: string }> = {
  about: {
    title: 'About Shoppintrest',
    content: `Shoppintrest is a luxury visual commerce platform where fashion lovers 
    discover, collect, and shop the world's most exceptional pieces. We blend 
    editorial storytelling with social discovery to create a truly unique 
    shopping experience.`,
  },
  privacy: {
    title: 'Privacy Policy',
    content: `We take your privacy seriously. We collect only the information 
    necessary to provide our services and never sell your personal data to 
    third parties. Your data is encrypted and stored securely.`,
  },
  terms: {
    title: 'Terms of Service',
    content: `By using Shoppintrest, you agree to our terms of service. 
    We reserve the right to update these terms at any time. Continued use 
    of the platform constitutes acceptance of any changes.`,
  },
  cookies: {
    title: 'Cookie Policy',
    content: `We use cookies to enhance your experience on Shoppintrest. 
    Essential cookies are required for the platform to function. You may 
    opt out of non-essential cookies in your browser settings.`,
  },
  shipping: {
    title: 'Shipping Policy',
    content: `We offer free shipping on orders over KES 200. Standard shipping 
    takes 3-5 business days within Kenya. Same-day delivery is available 
    in Nairobi for orders placed before 12pm.`,
  },
  returns: {
    title: 'Returns Policy',
    content: `We accept returns within 30 days of delivery. Items must be 
    unworn, unwashed, and in original packaging with tags attached. 
    Contact our support team to initiate a return.`,
  },
  help: {
    title: 'Help Center',
    content: `Need assistance? Our support team is available Monday to Friday, 
    9am to 6pm EAT. You can reach us via email at support@shoppintrest.com 
    or through our live chat.`,
  },
  contact: {
    title: 'Contact Us',
    content: `Get in touch with the Shoppintrest team. Email us at 
    hello@shoppintrest.com or visit our offices in Nairobi, Kenya. 
    We typically respond within 24 hours.`,
  },
  careers: {
    title: 'Careers',
    content: `Join the Shoppintrest team. We are always looking for talented 
    individuals who are passionate about fashion, technology, and building 
    exceptional products. Send your CV to careers@shoppintrest.com.`,
  },
  press: {
    title: 'Press',
    content: `For press inquiries, partnerships, and media requests, please 
    contact our PR team at press@shoppintrest.com. We are happy to provide 
    assets, interviews, and more.`,
  },
  blog: {
    title: 'Journal',
    content: `Explore our editorial content, style guides, trend reports, 
    and behind-the-scenes stories from the world of luxury fashion. 
    New stories published weekly.`,
  },
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const key = slug?.[0] || ''
  const page = pageContent[key]

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl font-display font-semibold text-foreground/10 mb-4">
            404
          </p>
          <p className="font-medium text-foreground mb-6">Page not found</p>
          <Link
            href="/"
            className="text-sm text-muted underline underline-offset-4
                       hover:text-foreground transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="container-narrow py-16 max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted
                     hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight mb-6">
          {page.title}
        </h1>

        <div className="prose prose-neutral max-w-none">
          <p className="text-muted leading-relaxed text-base">
            {page.content}
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted">
            Last updated: {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}