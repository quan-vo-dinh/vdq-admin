'use client'

import Image from 'next/image'
import Link from 'next/link'

const FullLogo = () => {
  return (
    <Link href="/" aria-label="vodinhquan dashboard" className="flex min-w-0 items-center gap-2 overflow-hidden">
      <Image
        src="/images/logos/logoicon.svg"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0"
      />
      <span className="flex min-w-0 flex-col leading-tight group-data-[state=collapsed]:hidden">
        <span className="text-base font-semibold text-foreground">vodinhquan</span>
        <span className="text-xs text-muted-foreground">dashboard</span>
      </span>
    </Link>
  )
}

export default FullLogo
