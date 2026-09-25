// Оноо, streak-ийн цэвэр дүрмүүдийн тест (DB хэрэггүй): npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { mongolianDay, nextStreak, scorePrediction, visibleStreak } from "./points";

test("streak: анхны өдөр 1-ээс эхэлнэ", () => {
  assert.equal(nextStreak(null, "2026-09-25", 0), 1);
});

test("streak: нэг өдөр дотор хэд ч үзсэн өөрчлөгдөхгүй", () => {
  assert.equal(nextStreak("2026-09-25", "2026-09-25", 4), 4);
});

test("streak: дараалсан өдөр +1, сар/жил дамжихад ч", () => {
  assert.equal(nextStreak("2026-09-24", "2026-09-25", 4), 5);
  assert.equal(nextStreak("2026-09-30", "2026-10-01", 2), 3);
  assert.equal(nextStreak("2026-12-31", "2027-01-01", 6), 7);
});

test("streak: өдөр алгасвал 1-ээс дахин эхэлнэ", () => {
  assert.equal(nextStreak("2026-09-23", "2026-09-25", 6), 1);
  assert.equal(nextStreak("2026-08-01", "2026-09-25", 30), 1);
});

test("streak: 7 хоног дараалбал 7 болно (STREAK_7 тэмдгийн босго)", () => {
  let streak = 0;
  let last: string | null = null;
  for (let d = 19; d <= 25; d++) {
    const today = `2026-09-${d}`;
    streak = nextStreak(last, today, streak);
    last = today;
  }
  assert.equal(streak, 7);
});

test("streak: дэлгэцэнд тасарсан streak 0 харагдана", () => {
  assert.equal(visibleStreak("2026-09-25", "2026-09-25", 3), 3);
  assert.equal(visibleStreak("2026-09-24", "2026-09-25", 3), 3);
  assert.equal(visibleStreak("2026-09-22", "2026-09-25", 3), 0);
  assert.equal(visibleStreak(null, "2026-09-25", 0), 0);
});

test("өдөр: Улаанбаатарын цагаар тоологдоно (UTC+8)", () => {
  assert.equal(mongolianDay(new Date("2026-09-25T15:59:00Z")), "2026-09-25");
  assert.equal(mongolianDay(new Date("2026-09-25T16:00:00Z")), "2026-09-26");
});

const revealed = { passed: true, actualSupport: 70 };

test("таамаг: бүгд зөв бол 20 оноо", () => {
  assert.equal(scorePrediction({ willPass: true, supportGuess: 70 }, revealed), 20);
});

test("таамаг: дэмжсэн тооны зайн хязгаарууд ±3 / ±8 / ±15", () => {
  const score = (guess: number) => scorePrediction({ willPass: false, supportGuess: guess }, revealed);
  assert.equal(score(73), 10);
  assert.equal(score(67), 10);
  assert.equal(score(74), 5);
  assert.equal(score(62), 5);
  assert.equal(score(78), 5);
  assert.equal(score(79), 2);
  assert.equal(score(55), 2);
  assert.equal(score(85), 2);
  assert.equal(score(86), 0);
  assert.equal(score(0), 0);
});

test("таамаг: батлагдах эсэх зөв, тоо хол бол зөвхөн 10", () => {
  assert.equal(scorePrediction({ willPass: true, supportGuess: 126 }, revealed), 10);
  assert.equal(scorePrediction({ willPass: false, supportGuess: 20 }, { passed: false, actualSupport: 50 }), 10);
});

test("таамаг: дүн гараагүй бол 0", () => {
  assert.equal(scorePrediction({ willPass: true, supportGuess: 70 }, { passed: null, actualSupport: null }), 0);
});
