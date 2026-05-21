/**
 * MVP 测试用兑换码（上线后改由后端校验）
 * 1 元 = 10 积分
 */
export const REDEEM_CODE_MAP = {
  STU666: { points: 60, priceLabel: '6 元', desc: '入门体验包' },
  VIP888: { points: 300, priceLabel: '30 元', desc: '学期畅学包' },
  KING999: { points: 1280, priceLabel: '128 元', desc: '学霸至尊包' },
}

/** 充值面额展示（与兑换码对应，线上下单后获码） */
export const RECHARGE_PACKAGES = [
  { id: 'pkg_60', points: 60, priceLabel: '6 元', desc: '约可解锁 1 门小课', codeHint: 'STU666' },
  { id: 'pkg_300', points: 300, priceLabel: '30 元', desc: '畅学多门精选课', codeHint: 'VIP888' },
  { id: 'pkg_1280', points: 1280, priceLabel: '128 元', desc: '学霸全站通行证', codeHint: 'KING999' },
]
