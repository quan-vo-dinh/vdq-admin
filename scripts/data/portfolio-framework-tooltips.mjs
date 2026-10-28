// Separate technology notes; keep original portfolio prose and other annotations.
const descriptions = {
  nextjs: {
    title: { vi: 'Next.js · Framework React cho ứng dụng web', en: 'Next.js · A React framework for web applications' },
    body: {
      vi: 'Next.js mở rộng React với định tuyến, kết xuất phía máy chủ và các công cụ xây dựng ứng dụng web full-stack. Đây là một phần trong nền tảng JavaScript/TypeScript mà tui tích lũy khi phát triển từ Frontend sang Full-stack.',
      en: 'Next.js extends React with routing, server rendering and tools for building full-stack web applications. It is part of the JavaScript/TypeScript foundation I developed while moving from frontend to full-stack engineering.',
    },
    quote: 'Next.js', href: 'https://nextjs.org/docs',
  },
  nestjs: {
    title: { vi: 'NestJS · Framework Node.js cho Backend', en: 'NestJS · A Node.js framework for backend applications' },
    body: {
      vi: 'NestJS giúp tổ chức ứng dụng phía máy chủ bằng TypeScript, với module, controller và service. Tui sử dụng hệ sinh thái này để xây dựng nền tảng Backend và tìm hiểu cách các dịch vụ phối hợp trong một hệ thống.',
      en: 'NestJS organizes server-side TypeScript applications through modules, controllers and services. This ecosystem helped build my backend foundation and my interest in how services work together within a system.',
    },
    quote: 'NestJS', href: 'https://docs.nestjs.com/',
  },
};

export function splitFrameworkTooltips(document, nextImage) {
  const next = structuredClone(document);
  for (const locale of ['vi', 'en']) {
    const resume = next.locales[locale];
    const notes = resume.annotations ?? [];
    const legacy = notes.find(note => note.id === 'editorial-v1-frameworks');
    const existing = key => notes.find(note => note.id === 'editorial-v3-' + key);
    if (!legacy && (!existing('nextjs') || !existing('nestjs'))) throw Error('Expected framework notes');
    const replacement = Object.entries(descriptions).map(([key, spec]) => ({
      ...(existing(key) ?? legacy),
      id: 'editorial-v3-' + key, field: 'summary', itemId: '',
      quote: spec.quote, occurrence: 1, title: spec.title[locale], body: spec.body[locale],
      href: spec.href,
      image: key === 'nextjs' ? (nextImage ?? existing(key)?.image ?? '') : (existing(key)?.image ?? legacy.image),
    }));
    const first = notes.findIndex(note => ['editorial-v1-frameworks', 'editorial-v3-nextjs', 'editorial-v3-nestjs'].includes(note.id));
    resume.annotations = notes.filter(note => !['editorial-v1-frameworks', 'editorial-v3-nextjs', 'editorial-v3-nestjs'].includes(note.id));
    resume.annotations.splice(first, 0, ...replacement);
  }
  return next;
}
