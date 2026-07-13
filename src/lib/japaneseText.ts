/**
 * ラテン文字・キリル文字を1文字でも含むかどうかを判定する。
 * 艦級名は末尾に必ず「型」(漢字)が付くため、単純に「日本語文字を含むか」で判定すると
 * 外国艦の艦級名(例: "Bismarck型")も漢字を含んでしまい判定できない。
 * そのため「ラテン/キリル文字を含む = 外国艦」という逆方向の判定を行う。
 */
const FOREIGN_CHAR_PATTERN = /[A-Za-zА-Яа-яЁё]/

export function isForeignShipClassName(className: string): boolean {
  return FOREIGN_CHAR_PATTERN.test(className)
}

/**
 * 艦級名(艦娘名)を比較し、日本艦を先に、外国艦(ラテン文字・キリル文字表記等)を
 * 後にまとめて表示するための比較関数。同じグループ内では五十音/アルファベット順。
 */
export function compareJapaneseFirst(a: string, b: string): number {
  const aForeign = isForeignShipClassName(a)
  const bForeign = isForeignShipClassName(b)
  if (aForeign !== bForeign) return aForeign ? 1 : -1
  return a.localeCompare(b, 'ja')
}
