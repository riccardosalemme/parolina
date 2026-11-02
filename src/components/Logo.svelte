<!-- L'icona di Parolina: una "p" che sorride -->
<script>
  let { size = 40 } = $props()
</script>

<svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
  <rect width="120" height="120" rx="28" fill="var(--brand)" />
  <rect x="29.5" y="37.5" width="14" height="62" rx="7" fill="var(--brand-ink)" />
  <circle cx="59.5" cy="51.5" r="24" fill="none" stroke="var(--brand-ink)" stroke-width="14" />
  <circle cx="53.5" cy="47.5" r="2.5" fill="var(--brand-ink)" />
  <circle cx="65.5" cy="47.5" r="2.5" fill="var(--brand-ink)" />
  <path d="M52.5 55.5 Q59.5 62.5 66.5 55.5" stroke="var(--brand-ink)" stroke-width="3" fill="none" stroke-linecap="round" />
</svg>
