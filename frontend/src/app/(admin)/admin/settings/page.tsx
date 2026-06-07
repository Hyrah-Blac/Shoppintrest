'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Store, Truck, Bell, Shield, CreditCard,
  Globe, Mail, Save, ChevronRight, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

type Section =
  | 'store'
  | 'shipping'
  | 'notifications'
  | 'security'
  | 'payments'
  | 'localization'

const SECTIONS: { id: Section; label: string; icon: any; desc: string }[] = [
  { id: 'store',         label: 'Store Details',    icon: Store,    desc: 'Name, contact, and branding'         },
  { id: 'shipping',      label: 'Shipping',         icon: Truck,    desc: 'Rates, zones, and delivery options'  },
  { id: 'notifications', label: 'Notifications',    icon: Bell,     desc: 'Email and in-app alert preferences'  },
  { id: 'security',      label: 'Security',         icon: Shield,   desc: 'Password, 2FA, and sessions'         },
  { id: 'payments',      label: 'Payments',         icon: CreditCard, desc: 'M-Pesa and payment configuration' },
  { id: 'localization',  label: 'Localization',     icon: Globe,    desc: 'Currency, language, and timezone'    },
]

export default function AdminSettingsPage() {
  const [active, setActive] = useState<Section>('store')
  const [isSaving, setIsSaving] = useState(false)

  // Store details state
  const [store, setStore] = useState({
    name:        'Shoppintrest',
    tagline:     'Curated fashion, delivered.',
    email:       'hello@shoppintrest.com',
    phone:       '+254 700 000 000',
    address:     'Nairobi, Kenya',
    website:     'https://shoppintrest.onrender.com',
    description: 'A curated fashion marketplace for modern Kenyans.',
  })

  // Shipping state
  const [shipping, setShipping] = useState({
    freeThreshold:  5000,
    standardCost:   0,
    expressEnabled: false,
    expressCost:    500,
    expressLabel:   'Express (1-2 days)',
    standardLabel:  'Free Delivery',
  })

  // Notifications state
  const [notifications, setNotifications] = useState({
    newOrder:      true,
    orderShipped:  true,
    lowStock:      true,
    newUser:       false,
    weeklyReport:  true,
    marketingEmails: false,
  })

  // Security state
  const [security, setSecurity] = useState({
    twoFactor:       false,
    sessionTimeout:  '24h',
    loginAlerts:     true,
  })

  // Payments state
  const [payments, setPayments] = useState({
    mpesaEnabled:    true,
    shortcode:       '174379',
    environment:     'sandbox',
    callbackUrl:     'https://shoppintrest.onrender.com/api/orders/mpesa/callback',
  })

  // Localization state
  const [locale, setLocale] = useState({
    currency:  'KES',
    language:  'en',
    timezone:  'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
  })

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setIsSaving(false)
    toast.success('Settings saved')
  }

  const card = {
    background: 'hsl(var(--background))',
    border:     '0.5px solid hsl(var(--border))',
    boxShadow:  'var(--shadow-xs)',
  }

  const inputClass = `
    w-full h-10 px-3 rounded-[10px] text-sm
    placeholder:text-[hsl(var(--muted))]
    focus:outline-none transition-all duration-[var(--duration-hover)]
  `
  const inputStyle = {
    border:     '0.5px solid hsl(var(--border))',
    background: 'hsl(var(--background))',
    color:      'hsl(var(--foreground))',
  }

  const labelClass = 'block text-[11px] font-medium mb-1.5'

  // Toggle component
  const Toggle = ({
    value,
    onChange,
  }: {
    value: boolean
    onChange: (v: boolean) => void
  }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0"
      style={{ background: value ? 'hsl(var(--foreground))' : 'hsl(var(--border))' }}
    >
      <span
        className="absolute top-[3px] w-4 h-4 rounded-full transition-all duration-200"
        style={{
          background: 'hsl(var(--background))',
          left: value ? '22px' : '3px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  )

  const ToggleRow = ({
    label,
    desc,
    value,
    onChange,
  }: {
    label: string
    desc?: string
    value: boolean
    onChange: (v: boolean) => void
  }) => (
    <div
      className="flex items-center justify-between gap-4 py-4"
      style={{ borderBottom: '0.5px solid hsl(var(--border-subtle))' }}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>
          {label}
        </p>
        {desc && (
          <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
            {desc}
          </p>
        )}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )

  const SectionHeader = ({ title, desc }: { title: string; desc: string }) => (
    <div className="mb-6">
      <h2 className="text-[16px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
        {title}
      </h2>
      <p className="text-[12px] mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
        {desc}
      </p>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3"
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.12em]"
           style={{ color: 'hsl(var(--accent))' }}>
          Configuration
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight"
            style={{ color: 'hsl(var(--foreground))' }}>
          Settings
        </h1>
        <motion.div
          className="h-[2px] w-10 rounded-full"
          style={{ background: 'hsl(var(--accent))' }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        />
        <p className="text-sm" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
          Manage your store configuration and preferences
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Sidebar nav ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-1"
        >
          <div className="rounded-2xl overflow-hidden" style={card}>
            {SECTIONS.map((s, i) => {
              const isActive = active === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                             transition-all duration-[var(--duration-hover)]"
                  style={{
                    borderBottom: i < SECTIONS.length - 1
                      ? '0.5px solid hsl(var(--border-subtle))'
                      : 'none',
                    background: isActive ? 'hsl(var(--surface))' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background = 'hsl(var(--surface))'
                  }}
                  onMouseLeave={e => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: isActive
                        ? 'hsl(var(--foreground))'
                        : 'hsl(var(--surface))',
                    }}
                  >
                    <s.icon
                      size={14}
                      style={{
                        color: isActive
                          ? 'hsl(var(--background))'
                          : 'hsl(var(--muted))',
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] font-medium leading-none"
                      style={{
                        color: isActive
                          ? 'hsl(var(--foreground))'
                          : 'hsl(var(--muted))',
                      }}
                    >
                      {s.label}
                    </p>
                    <p className="text-[10px] mt-0.5 truncate hidden lg:block"
                       style={{ color: 'hsl(var(--muted))' }}>
                      {s.desc}
                    </p>
                  </div>
                  {isActive && (
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: 'hsl(var(--accent))' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* ── Content panel ────────────────────────────────────────────── */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-3"
        >
          <div className="rounded-2xl p-6 space-y-6" style={card}>

            {/* ── Store Details ─────────────────────────────────────────── */}
            {active === 'store' && (
              <>
                <SectionHeader
                  title="Store Details"
                  desc="Basic information about your store shown to customers"
                />
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                        Store Name
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={store.name}
                        onChange={e => setStore(s => ({ ...s, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                        Tagline
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={store.tagline}
                        onChange={e => setStore(s => ({ ...s, tagline: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                        Contact Email
                      </label>
                      <input
                        type="email"
                        className={inputClass}
                        style={inputStyle}
                        value={store.email}
                        onChange={e => setStore(s => ({ ...s, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                        Phone Number
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={store.phone}
                        onChange={e => setStore(s => ({ ...s, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                        Address
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={store.address}
                        onChange={e => setStore(s => ({ ...s, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                        Website
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={store.website}
                        onChange={e => setStore(s => ({ ...s, website: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                      Store Description
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm resize-none
                                 placeholder:text-[hsl(var(--muted))] focus:outline-none
                                 transition-all duration-[var(--duration-hover)]"
                      style={inputStyle}
                      value={store.description}
                      onChange={e => setStore(s => ({ ...s, description: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Shipping ──────────────────────────────────────────────── */}
            {active === 'shipping' && (
              <>
                <SectionHeader
                  title="Shipping Settings"
                  desc="Configure delivery options and rates for your customers"
                />
                <div className="space-y-4">
                  <div
                    className="rounded-xl p-4 space-y-4"
                    style={{ background: 'hsl(var(--surface))', border: '0.5px solid hsl(var(--border))' }}
                  >
                    <p className="text-[12px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      Standard Delivery
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                          Label
                        </label>
                        <input
                          className={inputClass}
                          style={inputStyle}
                          value={shipping.standardLabel}
                          onChange={e => setShipping(s => ({ ...s, standardLabel: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                          Cost (KES)
                        </label>
                        <input
                          type="number"
                          className={inputClass}
                          style={inputStyle}
                          value={shipping.standardCost}
                          onChange={e => setShipping(s => ({ ...s, standardCost: +e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                        Free Shipping Threshold (KES)
                      </label>
                      <input
                        type="number"
                        className={inputClass}
                        style={inputStyle}
                        value={shipping.freeThreshold}
                        onChange={e => setShipping(s => ({ ...s, freeThreshold: +e.target.value }))}
                      />
                      <p className="text-[10px] mt-1.5" style={{ color: 'hsl(var(--muted))' }}>
                        Orders above this amount get free shipping. Set to 0 for always free.
                      </p>
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4 space-y-4"
                    style={{ background: 'hsl(var(--surface))', border: '0.5px solid hsl(var(--border))' }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        Express Delivery
                      </p>
                      <Toggle
                        value={shipping.expressEnabled}
                        onChange={v => setShipping(s => ({ ...s, expressEnabled: v }))}
                      />
                    </div>
                    {shipping.expressEnabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                            Label
                          </label>
                          <input
                            className={inputClass}
                            style={inputStyle}
                            value={shipping.expressLabel}
                            onChange={e => setShipping(s => ({ ...s, expressLabel: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                            Cost (KES)
                          </label>
                          <input
                            type="number"
                            className={inputClass}
                            style={inputStyle}
                            value={shipping.expressCost}
                            onChange={e => setShipping(s => ({ ...s, expressCost: +e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Notifications ─────────────────────────────────────────── */}
            {active === 'notifications' && (
              <>
                <SectionHeader
                  title="Notification Preferences"
                  desc="Choose which events trigger email and in-app notifications"
                />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] mb-3"
                     style={{ color: 'hsl(var(--muted))' }}>
                    Order Alerts
                  </p>
                  <ToggleRow
                    label="New Order"
                    desc="Get notified when a customer places an order"
                    value={notifications.newOrder}
                    onChange={v => setNotifications(n => ({ ...n, newOrder: v }))}
                  />
                  <ToggleRow
                    label="Order Shipped"
                    desc="Alert when an order is marked as shipped"
                    value={notifications.orderShipped}
                    onChange={v => setNotifications(n => ({ ...n, orderShipped: v }))}
                  />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] mb-3"
                     style={{ color: 'hsl(var(--muted))' }}>
                    Inventory Alerts
                  </p>
                  <ToggleRow
                    label="Low Stock Warning"
                    desc="Alert when a product drops below 5 units"
                    value={notifications.lowStock}
                    onChange={v => setNotifications(n => ({ ...n, lowStock: v }))}
                  />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] mb-3"
                     style={{ color: 'hsl(var(--muted))' }}>
                    Reports & Marketing
                  </p>
                  <ToggleRow
                    label="New User Registration"
                    desc="Alert when someone creates an account"
                    value={notifications.newUser}
                    onChange={v => setNotifications(n => ({ ...n, newUser: v }))}
                  />
                  <ToggleRow
                    label="Weekly Performance Report"
                    desc="Receive a weekly summary every Monday"
                    value={notifications.weeklyReport}
                    onChange={v => setNotifications(n => ({ ...n, weeklyReport: v }))}
                  />
                  <ToggleRow
                    label="Marketing Emails"
                    desc="Promotions, tips, and platform updates"
                    value={notifications.marketingEmails}
                    onChange={v => setNotifications(n => ({ ...n, marketingEmails: v }))}
                  />
                </div>
              </>
            )}

            {/* ── Security ──────────────────────────────────────────────── */}
            {active === 'security' && (
              <>
                <SectionHeader
                  title="Security Settings"
                  desc="Manage authentication and account access controls"
                />
                <ToggleRow
                  label="Two-Factor Authentication"
                  desc="Add an extra layer of security to your admin account"
                  value={security.twoFactor}
                  onChange={v => setSecurity(s => ({ ...s, twoFactor: v }))}
                />
                <ToggleRow
                  label="Login Alerts"
                  desc="Email me when a new device signs into the admin panel"
                  value={security.loginAlerts}
                  onChange={v => setSecurity(s => ({ ...s, loginAlerts: v }))}
                />
                <div>
                  <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                    Session Timeout
                  </label>
                  <select
                    className={inputClass}
                    style={inputStyle}
                    value={security.sessionTimeout}
                    onChange={e => setSecurity(s => ({ ...s, sessionTimeout: e.target.value }))}
                  >
                    {['1h', '4h', '8h', '24h', '7d'].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <p className="text-[10px] mt-1.5" style={{ color: 'hsl(var(--muted))' }}>
                    Admins will be signed out after this period of inactivity.
                  </p>
                </div>

                <div
                  className="rounded-xl p-4 mt-2"
                  style={{
                    background: 'hsl(var(--destructive) / 0.05)',
                    border:     '0.5px solid hsl(var(--destructive) / 0.2)',
                  }}
                >
                  <p className="text-[13px] font-semibold mb-1"
                     style={{ color: 'hsl(var(--foreground))' }}>
                    Danger Zone
                  </p>
                  <p className="text-[11px] mb-3" style={{ color: 'hsl(var(--muted))' }}>
                    Irreversible actions. Proceed with caution.
                  </p>
                  <button
                    className="px-4 py-2 rounded-[10px] text-[12px] font-medium
                               transition-all duration-[var(--duration-hover)]"
                    style={{
                      background: 'transparent',
                      border:     '0.5px solid hsl(var(--destructive) / 0.4)',
                      color:      'hsl(var(--destructive))',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'hsl(var(--destructive) / 0.08)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    Invalidate All Sessions
                  </button>
                </div>
              </>
            )}

            {/* ── Payments ──────────────────────────────────────────────── */}
            {active === 'payments' && (
              <>
                <SectionHeader
                  title="Payment Configuration"
                  desc="Configure M-Pesa STK push and payment gateway settings"
                />
                <div className="space-y-4">
                  <ToggleRow
                    label="M-Pesa Payments"
                    desc="Accept payments via M-Pesa STK push"
                    value={payments.mpesaEnabled}
                    onChange={v => setPayments(p => ({ ...p, mpesaEnabled: v }))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                        Short Code
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={payments.shortcode}
                        onChange={e => setPayments(p => ({ ...p, shortcode: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                        Environment
                      </label>
                      <select
                        className={inputClass}
                        style={inputStyle}
                        value={payments.environment}
                        onChange={e => setPayments(p => ({ ...p, environment: e.target.value }))}
                      >
                        <option value="sandbox">Sandbox</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                      Callback URL
                    </label>
                    <input
                      className={inputClass}
                      style={inputStyle}
                      value={payments.callbackUrl}
                      onChange={e => setPayments(p => ({ ...p, callbackUrl: e.target.value }))}
                    />
                    <p className="text-[10px] mt-1.5" style={{ color: 'hsl(var(--muted))' }}>
                      Safaricom will POST payment results to this URL. Must be HTTPS.
                    </p>
                  </div>

                  {/* Status badge */}
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{
                      background: payments.environment === 'production'
                        ? 'hsl(152 48% 38% / 0.08)'
                        : 'hsl(36 88% 50% / 0.08)',
                      border: `0.5px solid ${payments.environment === 'production'
                        ? 'hsl(152 48% 38% / 0.25)'
                        : 'hsl(36 88% 50% / 0.25)'}`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: payments.environment === 'production'
                          ? 'hsl(152 48% 38%)'
                          : 'hsl(36 88% 50%)',
                      }}
                    />
                    <p className="text-[12px] font-medium"
                       style={{
                         color: payments.environment === 'production'
                           ? 'hsl(152 48% 38%)'
                           : 'hsl(36 88% 50%)',
                       }}>
                      {payments.environment === 'production'
                        ? 'Live — real transactions active'
                        : 'Sandbox — test mode, no real charges'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ── Localization ──────────────────────────────────────────── */}
            {active === 'localization' && (
              <>
                <SectionHeader
                  title="Localization"
                  desc="Configure regional settings for your store"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                      Currency
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={locale.currency}
                      onChange={e => setLocale(l => ({ ...l, currency: e.target.value }))}
                    >
                      <option value="KES">KES — Kenyan Shilling</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                      Language
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={locale.language}
                      onChange={e => setLocale(l => ({ ...l, language: e.target.value }))}
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                      Timezone
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={locale.timezone}
                      onChange={e => setLocale(l => ({ ...l, timezone: e.target.value }))}
                    >
                      <option value="Africa/Nairobi">Africa/Nairobi (EAT +3)</option>
                      <option value="UTC">UTC</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} style={{ color: 'hsl(var(--muted))' }}>
                      Date Format
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={locale.dateFormat}
                      onChange={e => setLocale(l => ({ ...l, dateFormat: e.target.value }))}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ── Save button ───────────────────────────────────────────── */}
            <div
              className="flex justify-end pt-4"
              style={{ borderTop: '0.5px solid hsl(var(--border))' }}
            >
              <Button
                variant="primary"
                size="md"
                isLoading={isSaving}
                leftIcon={<Save size={13} />}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}