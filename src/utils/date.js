export function getYesterdayVN() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-cA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const today = formatter.format(now);

  const date = new Date(`${today}T00:00:00.000Z`);

  date.setDate(date.getDate() - 1);

  return formatter.format(date);
}
