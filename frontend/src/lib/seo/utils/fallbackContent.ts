export const FALLBACK_CONTENT = {
  title: 'Big Dipper Academy - Đào Tạo Đầu Tư Tài Chính Chuyên Nghiệp',
  description: `Big Dipper Academy - Chương trình đào tạo đầu tư tài chính top 1%. 
    Xây dựng trên 2 nền tảng: (1) Nhà đầu tư (Investor) - tư duy chủ doanh nghiệp, 
    nghiên cứu cơ bản, đầu tư dài hạn. (2) Nhà giao dịch (Trader) - phòng ngự tối ưu, 
    bảo vệ vốn, tỷ lệ risk/reward 1:5. Nguyên tắc: Bảo toàn vốn là ưu tiên tuyệt đối, 
    kỷ luật thép, khiêm tốn trước thị trường, hệ thống kiến thức chuẩn thế giới 100+ năm, 
    thích ứng liên tục. Học đầu tư chứng khoán, vàng, bitcoin, ngoại hối chuyên nghiệp.`,
  keywords: [
    'đầu tư tài chính',
    'học đầu tư chứng khoán',
    'giao dịch forex',
    'đầu tư vàng',
    'bitcoin',
    'phân tích kỹ thuật',
    'quản trị rủi ro',
    'Big Dipper Academy',
  ],
  image: '/images/og-default.jpg',
  author: 'Big Dipper Academy',
  siteName: 'Big Dipper Academy',
  siteNameVi: 'Học Viện Big Dipper',
  locale: 'vi_VN',
  localeAlternates: ['en_US'],
  url: 'https://hocvienbigdipper.com',
  twitterHandle: '@bigdipperacademy',
  fbAppId: '',
};

export const ORGANIZATION_INFO = {
  name: 'Big Dipper Academy',
  legalName: 'Big Dipper Investment Education JSC',
  alternateName: 'Học Viện Big Dipper',
  url: 'https://hocvienbigdipper.com',
  logo: 'https://hocvienbigdipper.com/logo.png',
  description: FALLBACK_CONTENT.description,
  email: 'contact@hocvienbigdipper.com',
  phone: '+84',
  foundingDate: '2020',
  slogan: 'Đầu tư thông minh, lợi nhuận bền vững',
  address: {
    addressCountry: 'VN',
  },
  socialLinks: {
    facebook: 'https://facebook.com/bigdipperacademy',
    linkedin: 'https://linkedin.com/company/bigdipperacademy',
  },
};

export function getDefaultMeta(locale: string = 'vi') {
  return {
    title: FALLBACK_CONTENT.title,
    description: FALLBACK_CONTENT.description,
    keywords: FALLBACK_CONTENT.keywords,
    image: FALLBACK_CONTENT.image,
    author: FALLBACK_CONTENT.author,
    siteName: locale === 'vi' ? FALLBACK_CONTENT.siteNameVi : FALLBACK_CONTENT.siteName,
    locale: locale === 'vi' ? 'vi_VN' : 'en_US',
    url: FALLBACK_CONTENT.url,
  };
}
