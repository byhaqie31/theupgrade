/** "7" -> "007". Issue numbers are always shown three wide. */
export function formatIssueNo(n: number): string {
  return String(n).padStart(3, '0')
}

const WORDS = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
]

/** Small counts read better as words in running copy: "Seven issues and counting". */
export function countWord(n: number): string {
  return WORDS[n] ?? String(n)
}

/** "12-31" -> "31 Dec". Programme years end on a calendar date, no year attached. */
export function formatYearEnd(mmdd: string): string {
  const [mm, dd] = mmdd.split('-').map(Number)
  if (!mm || !dd) return mmdd
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${dd} ${months[mm - 1]}`
}
