/**
 * 免费课程置顶：免费在前，付费在后；同档内保持相对稳定顺序（按 id）
 */
export function sortFreeFirst(list) {
  return [...list].sort((a, b) => {
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1
    return (b.createdAt ?? 0) - (a.createdAt ?? 0)
  })
}
