'use client'

/**
 * NotificationsPage — v2 · aligned to HeroSection (v14) conventions
 *
 * Changes made to bring this page up to the same bar as the hero:
 *  - Respects prefers-reduced-motion. The hero disables its kenburns/parallax
 *    for reduced-motion users; this page now does the same for row entrance,
 *    the refresh spin, the cursor spotlight, and the per-row magnetic tilt.
 *  - CSS custom properties now carry literal fallback values (e.g.
 *    `hsl(var(--foreground, 0 0% 9%))`), same reasoning as the hero's ACCENT
 *    token: if a theme variable is ever renamed or missing, the UI degrades
 *    to a sane default instead of silently rendering invisible/transparent.
 *  - Hover-capability is detected once via a memoised ref (mirrors the
 *    hero's `canHover` ref) instead of calling `window.matchMedia` inside
 *    every mousemove/mouseenter handler.
 *  - Typography now matches the hero's approach: self-hosted via
 *    next/font/google rather than a CSS-file @import, so nothing silently
 *    falls back to the browser's generic serif/sans/cursive. Playfair
 *    Display carries the two big display moments (the page title and the
 *    "all caught up" empty state), Inter carries every small tracked-caps
 *    label, and Parisienne — the same script used for the hero's "Scroll
 *    to shop" / "See it" — gets one deliberate, sparing appearance on the
 *    "New" section label.
 *  - Visual/motion polish pass:
 *    · Filter pills share a layoutId — the active highlight now slides and
 *      resizes to its new home instead of just swapping colour.
 *    · Marking a row read animates it out of "New" and into its date
 *      group (AnimatePresence popLayout) instead of an abrupt jump.
 *    · Unread rows get a soft breathing halo behind the dot and a faint
 *      accent ring around the avatar/icon — a quiet "this is new" cue.
 *    · The sticky header is now frosted (backdrop-blur) with a soft
 *      shadow fade instead of a flat 1px border.
 *    · Row hover now lifts (translateY + soft shadow) instead of only
 *      swapping background colour.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Playfair_Display, Parisienne, Inter } from 'next/font/google'
import {
  motion, AnimatePresence, useMotionValue, useMotionTemplate, useSpring,
  useReducedMotion,
} from 'framer-motion'
import {
  Bell, Check, RefreshCw, ChevronRight,
  UserPlus, Heart, Package, MessageCircle, Star, Bookmark,
  type LucideIcon,
} from 'lucide-react'
import { useNotificationStore } from '@/store/useNotificationStore'
import api from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, cn } from '@/lib/utils'

// Self-hosted via next/font — same reasoning as the hero: no @import in
// globals.css to go stale, no silent fallback to generic serif/cursive.
const playfair   = Playfair_Display({ weight: ['500', '600', '700'], style: ['normal', 'italic'], subsets: ['latin'], display: 'swap' })
const parisienne = Parisienne({ weight: '400', subsets: ['latin'], display: 'swap' })
const interFont  = Inter({ weight: ['400', '500', '600'], subsets: ['latin'], display: 'swap' })

interface NotificationItem {
  _id:       string
  type:      string
  message:   string
  link?:     string
  isRead:    boolean
  createdAt: string
  sender?: {
    avatar?:      string
    displayName?: string
  }
}

// Plain, monochrome — icon only, no per-type colour coding
const typeConfig: Record<string, { icon: LucideIcon; label: string }> = {
  follow:          { icon: UserPlus,      label: 'Follow'     },
  save:            { icon: Heart,         label: 'Save'       },
  order_update:    { icon: Package,       label: 'Order'      },
  message:         { icon: MessageCircle, label: 'Message'    },
  review:          { icon: Star,          label: 'Review'     },
  collection_save: { icon: Bookmark,      label: 'Collection' },
}
const fallbackConfig = { icon: Bell, label: 'Activity' }

const ease = [0.16, 1, 0.3, 1] as const

// ─── Fallback-safe design tokens ───────────────────────────────────────────
// Same pattern as the hero's ACCENT constant: every var(--x) carries a
// literal fallback so a renamed/missing theme token degrades gracefully
// instead of rendering transparent/invisible content.
const BG            = 'hsl(var(--background, 0 0% 100%))'
const FG             = 'hsl(var(--foreground, 0 0% 9%))'
const FG_SECONDARY   = 'hsl(var(--foreground-secondary, 0 0% 30%))'
const MUTED          = 'hsl(var(--muted, 0 0% 45%))'
const MUTED_FG       = 'hsl(var(--muted-foreground, 0 0% 45%))'
const BORDER         = 'hsl(var(--border, 0 0% 90%))'
const SURFACE_EL     = 'hsl(var(--surface-elevated, 0 0% 96%))'
const SURFACE_FLOAT  = 'hsl(var(--surface-float, 0 0% 98%))'
const ACCENT         = 'hsl(var(--accent, 0 78% 54%))'

// ─── Date grouping ──────────────────────────────────────────────────────────

function groupByDate(items: NotificationItem[]) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  const buckets: Record<string, NotificationItem[]> = {
    Today: [], Yesterday: [], 'This week': [], Earlier: [],
  }

  for (const item of items) {
    const created = new Date(item.createdAt)
    if (created >= startOfToday)          buckets.Today.push(item)
    else if (created >= startOfYesterday) buckets.Yesterday.push(item)
    else if (created >= startOfWeek)      buckets['This week'].push(item)
    else                                   buckets.Earlier.push(item)
  }

  return Object.entries(buckets).filter(([, v]) => v.length > 0)
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const {
    notifications,
    fetchNotifications,
    markAllRead,
    markOneRead,
    unreadCount,
    isLoading,
  } = useNotificationStore()

  const [activeType, setActiveType] = useState<string>('all')
  const reduceMotion = useReducedMotion()

  // Memoised hover-capability check — same reasoning as the hero's
  // `canHover` ref: matchMedia doesn't change mid-session, so there's no
  // reason to re-query it inside every pointer event handler.
  const canHover = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover)').matches
      : false
  )

  useEffect(() => { fetchNotifications() }, [])

  const items = notifications as NotificationItem[]

  const types = useMemo(() => {
    const seen = new Set<string>()
    items.forEach(n => seen.add(n.type))
    return Array.from(seen)
  }, [items])

  const visible = useMemo(() =>
    activeType === 'all' ? items : items.filter(n => n.type === activeType)
  , [items, activeType])

  const unread = visible.filter(n => !n.isRead)
  const read   = visible.filter(n =>  n.isRead)
  const readGroups = useMemo(() => groupByDate(read), [read])

  const handleMarkAllRead = () => {
    markAllRead()
    api.patch('/api/notifications/read-all').catch(console.error)
  }

  const handleMarkOneRead = (id: string) => {
    markOneRead(id)
    api.patch(`/api/notifications/${id}/read`).catch(console.error)
  }

  // ── Cursor spotlight — subtle ambient light following the pointer ──
  // Disabled outright for reduced-motion users, same as the hero's
  // kenburns/parallax treatment.
  const spotlightX = useMotionValue(-500)
  const spotlightY = useMotionValue(-500)
  const spotlightXSpring = useSpring(spotlightX, { damping: 30, stiffness: 120, mass: 0.5 })
  const spotlightYSpring = useSpring(spotlightY, { damping: 30, stiffness: 120, mass: 0.5 })
  const spotlightBackground = useMotionTemplate`radial-gradient(600px circle at ${spotlightXSpring}px ${spotlightYSpring}px, hsl(var(--foreground) / 0.045), transparent 60%)`

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return
    if (!canHover.current) return
    spotlightX.set(e.clientX)
    spotlightY.set(e.clientY)
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ background: BG }}
      onMouseMove={handlePointerMove}
    >
      {/* ── Ambient cursor spotlight ── */}
      {!reduceMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-30 hidden sm:block"
          style={{ background: spotlightBackground }}
        />
      )}

      {/* ── HEADER ── */}
      {/* Frosted on scroll (backdrop-blur over translucent bg) with a soft
          shadow fade beneath it instead of a flat 1px border — reads as
          the content sliding under glass rather than hitting a hard edge. */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: `hsl(var(--background, 0 0% 100%) / 0.82)`,
          backdropFilter: 'blur(14px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
          boxShadow: `0 1px 0 hsl(var(--border, 0 0% 90%) / 0.6), 0 12px 24px -18px rgb(0 0 0 / 0.14)`,
        }}
      >
        <div className="container-narrow">
          <div
            className="flex items-baseline justify-between gap-4"
            style={{ paddingBlock: 'clamp(1rem, 2vw, 1.5rem)' }}
          >
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
              transition={{ duration: 0.5, ease }}
            >
              <p
                className={interFont.className}
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: MUTED,
                  marginBottom: '0.375rem',
                }}
              >
                Activity
              </p>
              <div className="flex items-center gap-3">
                <h1
                  className={playfair.className}
                  style={{
                    fontSize:      'clamp(1.875rem, 3.4vw, 2.75rem)',
                    fontWeight:    600,
                    letterSpacing: '-0.01em',
                    lineHeight:    1,
                    color:         FG,
                  }}
                >
                  Noti<span style={{ color: ACCENT, fontStyle: 'italic' }}>fications</span>
                </h1>
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{   scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease }}
                      className="flex items-center justify-center text-[10px]
                                 font-semibold leading-none"
                      style={{
                        minWidth:     '1.375rem',
                        height:       '1.375rem',
                        borderRadius: '999px',
                        background:   SURFACE_EL,
                        border:       `1px solid ${BORDER}`,
                        color:        FG,
                        padding:      '0 0.3rem',
                      }}
                      aria-live="polite"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.button
                    onClick={handleMarkAllRead}
                    className={cn('hidden sm:inline-flex items-center gap-1.5 group', interFont.className)}
                    style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: MUTED,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = FG)}
                    onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, x: 8 }}
                    animate={{ opacity: 1, scale: 1,    x: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, x: 8 }}
                    transition={{ duration: 0.25, ease }}
                  >
                    <Check size={11} strokeWidth={1.5} />
                    Mark all read
                  </motion.button>
                )}
              </AnimatePresence>

              <motion.button
                onClick={() => fetchNotifications()}
                aria-label="Refresh"
                whileHover={reduceMotion ? undefined : { scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: MUTED,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = FG)}
                onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
              >
                <motion.span
                  className="flex"
                  animate={isLoading && !reduceMotion ? { rotate: 360 } : { rotate: 0 }}
                  transition={isLoading && !reduceMotion
                    ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
                    : { duration: 0.2 }}
                >
                  <RefreshCw size={14} strokeWidth={1.5} />
                </motion.span>
              </motion.button>
            </div>
          </div>

          {/* ── TYPE FILTERS ── */}
          {/* The active state now morphs between pills via a shared
              layoutId instead of just swapping colours — the highlight
              physically slides and resizes to its new home, the same
              "magic move" feel as the hero's progress rail filling in. */}
          {items.length > 0 && types.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
              style={{ paddingBottom: '0.875rem' }}
            >
              <button
                onClick={() => setActiveType('all')}
                className={cn('pill relative', interFont.className)}
                style={activeType === 'all' ? pillTextActive : pillTextInactive}
              >
                {activeType === 'all' && (
                  <motion.span
                    layoutId="activeFilterPill"
                    className="absolute inset-0 -z-10"
                    style={{ background: FG, borderRadius: 'var(--radius-full, 999px)' }}
                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                All
              </button>
              {types.map(type => {
                const config = typeConfig[type] ?? fallbackConfig
                const Icon = config.icon
                const isActive = activeType === type
                return (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={cn('pill relative', interFont.className)}
                    style={isActive ? pillTextActive : pillTextInactive}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeFilterPill"
                        className="absolute inset-0 -z-10"
                        style={{ background: FG, borderRadius: 'var(--radius-full, 999px)' }}
                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon size={12} strokeWidth={2.25} />
                    {config.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── MOBILE MARK-ALL-READ ── */}
          {unreadCount > 0 && (
            <div className="sm:hidden pb-3 -mt-1">
              <button
                onClick={handleMarkAllRead}
                className={cn('inline-flex items-center gap-1.5', interFont.className)}
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: MUTED,
                  background: 'transparent',
                  border: 'none',
                }}
              >
                <Check size={11} strokeWidth={1.5} />
                Mark all read
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="container-narrow" style={{ paddingBlock: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

        {/* Loading skeleton */}
        {isLoading && items.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4"
                style={{ padding: '0.875rem 1rem' }}
              >
                <div
                  className="skeleton shrink-0"
                  style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }}
                />
                <div className="flex-1 space-y-2 pt-1">
                  <div
                    className="skeleton"
                    style={{ height: '0.875rem', width: `${60 + i * 8}%` }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: '0.75rem', width: '4rem' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state — nothing at all */}
        {!isLoading && items.length === 0 && (
          <EmptyState
            title="All caught up"
            body="Messages from Support will show up here."
            reduceMotion={!!reduceMotion}
            flourish="enjoy the quiet"
          />
        )}

        {/* Empty state — filter has nothing */}
        {!isLoading && items.length > 0 && visible.length === 0 && (
          <EmptyState
            title="Nothing here yet"
            body={`No ${(typeConfig[activeType]?.label ?? 'matching').toLowerCase()} notifications right now.`}
            compact
            reduceMotion={!!reduceMotion}
          />
        )}

        {/* Notification list */}
        {visible.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }} aria-live="polite">
            {/* popLayout lets a row that changes from unread → read animate
                its move from the "New" cluster down into its date group,
                instead of just vanishing from one spot and popping up in
                another. */}
            <AnimatePresence initial={false} mode="popLayout">
              {unread.length > 0 && (
                <div key="unread-section">
                  <SectionLabel>New</SectionLabel>
                  {unread.map((notif, i) => (
                    <NotificationRow
                      key={notif._id}
                      notif={notif}
                      index={i}
                      onRead={() => handleMarkOneRead(notif._id)}
                      reduceMotion={!!reduceMotion}
                      canHover={canHover}
                    />
                  ))}
                  {read.length > 0 && <FadeDivider />}
                </div>
              )}

              {readGroups.map(([label, group], gi) => (
                <div key={label}>
                  <SectionLabel>{label}</SectionLabel>
                  {group.map((notif, i) => (
                    <NotificationRow
                      key={notif._id}
                      notif={notif}
                      index={gi * 6 + i}
                      onRead={() => {}}
                      reduceMotion={!!reduceMotion}
                      canHover={canHover}
                    />
                  ))}
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}

// A soft gradient fade instead of a hard 1px rule — echoes the hero's
// hairline dividers (0.5px, low-opacity) rather than a flat <hr>.
function FadeDivider() {
  return (
    <div
      aria-hidden
      className="my-5"
      style={{
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${BORDER} 20%, ${BORDER} 80%, transparent)`,
      }}
    />
  )
}

// Pill text colour only — the background/border is now the animated
// layoutId element that slides between pills, so these just control the
// foreground colour and stay transparent themselves.
const pillTextActive: React.CSSProperties = {
  color:       BG,
  borderColor: 'transparent',
  fontWeight:  500,
  background:  'transparent',
}
const pillTextInactive: React.CSSProperties = {
  background: 'transparent',
}

// ─── Section label ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  // "New" gets the one script accent on this page — same restraint as the
  // hero's Parisienne moments: a single warm touch, not applied everywhere.
  if (children === 'New') {
    return (
      <p
        className={cn(parisienne.className, 'mb-1.5 px-1 mt-5 first:mt-0')}
        style={{ color: ACCENT, fontSize: '20px', lineHeight: 1 }}
      >
        New
      </p>
    )
  }
  return (
    <p
      className={cn(interFont.className, 'text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 px-1 mt-5 first:mt-0')}
      style={{ color: MUTED }}
    >
      {children}
    </p>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({
  title, body, compact, reduceMotion, flourish,
}: { title: string; body: string; compact?: boolean; reduceMotion?: boolean; flourish?: string }) {
  return (
    <motion.div
      className="flex flex-col items-center text-center"
      style={{ paddingBlock: compact ? 'clamp(2.5rem, 6vw, 4rem)' : 'clamp(4rem, 10vw, 7rem)' }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
    >
      <motion.div
        className="mb-6"
        style={{
          width:          '4.5rem',
          height:         '4.5rem',
          borderRadius:   'var(--radius-xl)',
          background:     `radial-gradient(circle at 32% 28%, hsl(var(--accent, 0 78% 54%) / 0.08), ${SURFACE_EL} 70%)`,
          border:         `1px solid ${BORDER}`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
        animate={reduceMotion ? {} : { scale: [1, 1.045, 1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Bell size={22} style={{ color: MUTED, strokeWidth: 1.5 }} />
      </motion.div>
      <p className={playfair.className} style={{
        fontWeight:    600,
        fontSize:      '1.375rem',
        letterSpacing: '-0.015em',
        color:         FG,
        marginBottom:  '0.5rem',
      }}>
        {title}
      </p>
      <p className={interFont.className} style={{
        fontSize:   'var(--text-sm)',
        color:      MUTED_FG,
        fontWeight: 300,
        maxWidth:   '22rem',
        lineHeight: 1.65,
      }}>
        {body}
      </p>
      {/* One deliberate script accent — same restraint as the hero's
          Parisienne usage: a single warm, human touch, not a redesign. */}
      {flourish && (
        <p
          className={parisienne.className}
          style={{
            fontSize: '19px',
            color: ACCENT,
            marginTop: '0.875rem',
          }}
        >
          {flourish}
        </p>
      )}
    </motion.div>
  )
}

// ─── Notification row ───────────────────────────────────────────────────────

function NotificationRow({
  notif,
  index,
  onRead,
  reduceMotion,
  canHover,
}: {
  notif:        NotificationItem
  index:        number
  onRead:       () => void
  reduceMotion: boolean
  canHover:     React.RefObject<boolean>
}) {
  const config = typeConfig[notif.type] ?? fallbackConfig
  const Icon   = config.icon
  const delay  = Math.min(index, 10) * 0.03

  const hasIdentity = Boolean(notif.sender?.avatar || notif.sender?.displayName)

  // ── Magnetic tilt — desktop only, disabled on touch devices and for
  // reduced-motion users (mirrors the hero's MagneticCircle guard) ──
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const tiltX = useSpring(rotateX, { damping: 18, stiffness: 220, mass: 0.4 })
  const tiltY = useSpring(rotateY, { damping: 18, stiffness: 220, mass: 0.4 })

  const handleTiltMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!canHover.current || reduceMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width  - 0.5
    const py = (e.clientY - rect.top)  / rect.height - 0.5
    rotateY.set(px * 4)
    rotateX.set(py * -4)
  }
  const resetTilt = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  const content = (
    <>
      {/* Avatar (only if we have one) or a plain icon tile */}
      <div
        className="relative shrink-0 mt-0.5 rounded-full"
        style={{
          boxShadow: notif.isRead ? 'none' : `0 0 0 2px hsl(var(--accent, 0 78% 54%) / 0.3)`,
          transition: 'box-shadow 0.4s ease',
        }}
      >
        {hasIdentity ? (
          <>
            <Avatar
              src={notif.sender?.avatar}
              name={notif.sender?.displayName}
              size="md"
            />
            <span
              className="absolute -bottom-1 -right-1 flex items-center justify-center select-none"
              style={{
                width:        '1.25rem',
                height:       '1.25rem',
                borderRadius: '50%',
                background:   SURFACE_FLOAT,
                border:       `1px solid ${BORDER}`,
                boxShadow:    `0 0 0 1.5px ${BG}`,
                color:        FG_SECONDARY,
              }}
            >
              <Icon size={11} strokeWidth={2.25} />
            </span>
          </>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width:        '2.5rem',
              height:       '2.5rem',
              borderRadius: '50%',
              background:   notif.isRead
                ? SURFACE_EL
                : `radial-gradient(circle at 30% 25%, hsl(var(--accent, 0 78% 54%) / 0.14), ${SURFACE_EL} 70%)`,
              border:       `1px solid ${notif.isRead ? BORDER : 'hsl(var(--accent, 0 78% 54%) / 0.35)'}`,
              color:        FG_SECONDARY,
              transition:   'background 0.4s ease, border-color 0.4s ease',
            }}
          >
            <Icon size={17} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p style={{
          fontSize:     'var(--text-sm)',
          lineHeight:   1.55,
          color:        FG,
          fontWeight:   notif.isRead ? 300 : 500,
          marginBottom: '0.2rem',
        }}>
          {notif.message}
        </p>
        <div className={cn('flex items-center gap-2', interFont.className)}>
          <p style={{
            fontSize:      '10px',
            color:         MUTED_FG,
            fontWeight:    500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {config.label}
          </p>
          <span style={{ color: 'hsl(var(--muted) / 0.4)', fontSize: '10px' }}>·</span>
          <p style={{
            fontSize:      'var(--text-xs)',
            color:         MUTED_FG,
            fontWeight:    300,
            letterSpacing: '0.01em',
          }}>
            {formatRelativeTime(notif.createdAt)}
          </p>
        </div>
      </div>

      {/* End slot:
          - Unread: dot on desktop (hidden on hover → check icon);
                    always-visible check button on mobile (touch has no hover)
          - Read: chevron always visible on mobile, hover-reveal on desktop */}
      <div
        className="shrink-0 flex items-center justify-center relative"
        style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.4rem' }}
      >
        {!notif.isRead ? (
          <>
            {/* Soft breathing halo behind the dot — a quiet "this is new"
                cue instead of a static mark. Off for reduced-motion. */}
            {!reduceMotion && (
              <motion.span
                aria-hidden
                className="absolute inset-0 m-auto rounded-full sm:block hidden"
                style={{
                  width: '0.4375rem', height: '0.4375rem',
                  background: ACCENT,
                }}
                animate={{ scale: [1, 2.4, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.3 }}
              />
            )}
            {/* Desktop: dot that hides on hover */}
            <motion.span
              className="absolute inset-0 m-auto rounded-full sm:block hidden group-hover:opacity-0 transition-opacity"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.15, duration: 0.25 }}
              style={{
                width: '0.4375rem', height: '0.4375rem',
                background: FG,
              }}
            />
            {/* Desktop: check appears on hover */}
            <button
              aria-label="Mark as read"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onRead() }}
              className="absolute inset-0 items-center justify-center rounded-full
                         hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: SURFACE_EL, color: FG }}
            >
              <Check size={11} strokeWidth={2.5} />
            </button>
            {/* Mobile: always-visible tap target */}
            <button
              aria-label="Mark as read"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onRead() }}
              className="sm:hidden flex items-center justify-center rounded-full w-full h-full"
              style={{ color: FG }}
            >
              <Check size={13} strokeWidth={2.5} />
            </button>
          </>
        ) : (
          <>
            {/* Desktop: reveal on hover */}
            <ChevronRight
              size={14}
              className="hidden sm:block opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
              style={{ color: MUTED_FG }}
            />
            {/* Mobile: always visible */}
            <ChevronRight
              size={14}
              className="sm:hidden"
              style={{ color: MUTED_FG, opacity: 0.4 }}
            />
          </>
        )}
      </div>
    </>
  )

  const rowClassName = "group flex items-start gap-3.5 rounded-[var(--radius-lg)] cursor-pointer transition-all duration-[var(--duration-hover)]"
  const rowStyle: React.CSSProperties = {
    padding:    '0.875rem 0.75rem',
    background: notif.isRead ? 'transparent' : SURFACE_EL,
    transformStyle: 'preserve-3d',
    // Ensure tap target feels generous on mobile
    WebkitTapHighlightColor: 'transparent',
  }

  const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
    if (!canHover.current) return
    e.currentTarget.style.background  = SURFACE_EL
    e.currentTarget.style.boxShadow   = 'var(--shadow-md, 0 8px 20px -12px rgb(0 0 0 / 0.18))'
    e.currentTarget.style.transform   = reduceMotion ? '' : 'translateY(-1px)'
  }
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
    if (!canHover.current) return
    e.currentTarget.style.background  = notif.isRead ? 'transparent' : SURFACE_EL
    e.currentTarget.style.boxShadow   = 'none'
    e.currentTarget.style.transform   = ''
    resetTilt()
  }
  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!canHover.current) return
    hoverIn(e)
    handleTiltMove(e)
  }

  return (
    <motion.div
      layout={!reduceMotion}
      layoutId={`row-${notif._id}`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      transition={{ delay, duration: 0.35, ease }}
      style={reduceMotion ? undefined : { rotateX: tiltX, rotateY: tiltY, transformPerspective: 600 }}
    >
      {notif.link ? (
        <Link
          href={notif.link}
          onClick={onRead}
          className={rowClassName}
          style={{ ...rowStyle, transition: 'background 0.25s, box-shadow 0.3s, transform 0.3s' }}
          onMouseEnter={handleMove}
          onMouseMove={handleTiltMove}
          onMouseLeave={hoverOut}
        >
          {content}
        </Link>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={onRead}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onRead() }}
          className={rowClassName}
          style={{ ...rowStyle, transition: 'background 0.25s, box-shadow 0.3s, transform 0.3s' }}
          onMouseEnter={handleMove}
          onMouseMove={handleTiltMove}
          onMouseLeave={hoverOut}
        >
          {content}
        </div>
      )}
    </motion.div>
  )
}