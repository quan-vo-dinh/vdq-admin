import { financeEnglish } from "./messages";
import type { Goal, Transaction } from "./model";
import { financeDemo } from "./demo";
const sampleGoalNames = new Map(financeDemo().goals.map((g) => [g.id, g.name]));

export type FinanceLanguage = "vi" | "en";
export type FinanceMessageValue =
  string | number | { money: number } | { goal: Pick<Goal, "id" | "name"> };
export type FinanceMessage = {
  key: string;
  values?: FinanceMessageValue[];
};

export function createFinanceLocale(language: FinanceLanguage) {
  const locale = language === "vi" ? "vi-VN" : "en-GB";
  const number = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale, options).format(value);
  const money = (value: number) =>
    number(value, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  const compactMoney = (value: number) =>
    `${number(value / 1_000_000, { maximumFractionDigits: 1 })} ${language === "vi" ? "tr" : "m"}`;
  const text = (key: string, values: FinanceMessageValue[] = []): string => {
    const template = language === "vi" ? key : (financeEnglish[key] ?? key);
    return template.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
      const value = values[Number(index)];
      if (value === undefined) return placeholder;
      if (typeof value === "object")
        return "money" in value ? money(value.money) : goalName(value.goal);
      return typeof value === "number" ? number(value) : value;
    });
  };
  const date = (value: string, options?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: "Asia/Ho_Chi_Minh",
      ...options,
    }).format(new Date(`${value.slice(0, 10)}T12:00:00+07:00`));
  const message = (
    key: string,
    values?: FinanceMessageValue[],
  ): FinanceMessage => ({ key, values });
  const formatMessage = (value: string | FinanceMessage) =>
    typeof value === "string" ? text(value) : text(value.key, value.values);
  const goalName = (goal: Pick<Goal, "id" | "name">): string =>
    sampleGoalNames.get(goal.id) === goal.name ? text(goal.name) : goal.name;
  const transactionDescription = (transaction: Transaction) =>
    transaction.source === "demo"
      ? text(transaction.description)
      : transaction.description;
  return {
    language,
    locale,
    text,
    money,
    compactMoney,
    number,
    date,
    message,
    formatMessage,
    goalName,
    transactionDescription,
  };
}
