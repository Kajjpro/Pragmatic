// scripts/test-comments.ts
// Саналын бүх урсгалыг туршина: шүүх (filterComments) → бүлэглэх (groupComments) → хариулах (writeReply).
// Ажиллуулах: npx tsx --env-file=.env scripts/test-comments.ts

import { filterComments, groupComments, CommentInput } from "../lib/ai/comments";
import { writeReply } from "../lib/ai/reply";

// Саналууд аль заалтын талаар вэ (12.3-ын шинэ хувилбар)
const CLAUSE_TEXT =
  "12.3.Агаарын бохирдлын талаарх иргэний гомдлыг холбогдох байгууллага 14 хоногийн дотор шийдвэрлэнэ.";

// Жишээ саналууд (бидний өөрсдөө бичсэн ТУРШИЛТЫН санал).
// c1–c15: жинхэнэ мэт санал. c12, c15 нь заалттай холбоогүй (OFF_TOPIC гарах ёстой).
// t1–t5: шүүлтүүрийг шалгах зорилгоор тусгайлан бичсэн санал.
const COMMENTS: CommentInput[] = [
  { id: "c1", text: "14 хоног ч гэсэн урт байна. Утаа өнөөдөр байхад 2 долоо хоногийн дараа хариу өгөөд ямар ч хэрэггүй. 3 хоногт шийдвэрлэдэг болгооч." },
  { id: "c2", text: "Маш зөв өөрчлөлт. 30 хоног хэтэрхий урт байсан." },
  { id: "c3", text: "Байгууллагууд одоо 30 хоногтоо ч амжихгүй байна. Хүн хүч, төсөв нэмэхгүй бол 14 хоног гэж бичсэн ч цаасан дээр л үлдэнэ." },
  { id: "c4", text: "Гомдлыг онлайнаар гаргаж, хаана явааг нь хянах боломжтой болгооч." },
  { id: "c5", text: "Өвлийн улиралд ядаж 7 хоногт шийдвэрлэдэг байх ёстой гэж бодож байна." },
  { id: "c6", text: "Дэмжиж байна. Гомдол гаргаад сар хүлээдэг байсан нь иргэдийг залхааж байсан." },
  { id: "c7", text: "Хугацаандаа шийдвэрлээгүй албан тушаалтанд ямар хариуцлага хүлээлгэх нь тодорхойгүй байна." },
  { id: "c8", text: "Шийдвэрлэсэн гомдлын тоог жил бүр нийтэд ил тод мэдээлдэг болгох хэрэгтэй." },
  { id: "c9", text: "Хугацааг богиносгосон нь зөв ч хангалтгүй. Яаралтай тохиолдолд 24 цагт арга хэмжээ авдаг байх хэрэгтэй." },
  { id: "c10", text: "Сайн шийдвэр байна, баярлалаа." },
  { id: "c11", text: "Дүүрэг бүрт байцаагч цөөхөн. Эхлээд байцаагчийн тоог нэмэх хэрэгтэй." },
  { id: "c12", text: "Замын түгжрэлийг шийдэхгүй бол юу ч өөрчлөгдөхгүй." },
  { id: "c13", text: "Хөрш маань дугуй шатааж байхад 14 хоног хүлээх үү? Нэн даруй очиж шалгадаг болгоорой." },
  { id: "c14", text: "Утсаар залгахаар хэн ч авдаггүй. Гар утасны аппаар гомдол өгдөг болгох хэрэгтэй." },
  { id: "c15", text: "Нүүрсний үнийг хямдруулаач, өвөл халаалтын зардал их байна." },
  // ── Шүүлтүүрийн туршилт ──
  { id: "t1", text: "Та нар бүгд луйварчид, тэнэгүүд!!!" }, // ABUSIVE
  { id: "t2", text: "Хямд зээл 5 минутад! Манай пэйж рүү ороорой www.zeel-hurdan.mn" }, // ABUSIVE (спам)
  { id: "t3", text: "ааааа ыыыы 123" }, // ABUSIVE (утгагүй)
  { id: "t4", text: "Маш зөв өөрчлөлт. 30 хоног хэтэрхий урт байсан." }, // DUPLICATE (c2-тэй яг ижил)
  { id: "t5", text: "гомдлыг онлайнаар гаргаж хаана явааг нь хянах боломжтой болгооч!!" }, // DUPLICATE (c4, цэг таслал өөр)
];

// id-аар саналын текстийг олох жижиг функц
function findText(id: string): string {
  for (const comment of COMMENTS) {
    if (comment.id === id) {
      return comment.text;
    }
  }
  return "(олдсонгүй)";
}

// Текстэд хэдэн үг байгааг тоолно (зайгаар нь хуваана)
function countWords(text: string): number {
  if (text.trim() === "") {
    return 0;
  }
  return text.trim().split(/\s+/).length;
}

async function main() {
  console.log("AI_STUB =", process.env.AI_STUB || "(тохируулаагүй)", "| AI_PROVIDER =", process.env.AI_PROVIDER || "gemini");
  console.log("Заалт:", CLAUSE_TEXT);
  console.log("");

  // ── 1. ШҮҮХ ──
  const labels = await filterComments(CLAUSE_TEXT, COMMENTS);

  const relevant: CommentInput[] = []; // бүлэглэлтэд орох саналууд
  console.log("══ 1. ШҮҮЛТ");
  for (const label of labels) {
    if (label.status === "RELEVANT") {
      relevant.push({ id: label.id, text: findText(label.id) });
    } else {
      // Шүүгдсэн саналыг шалтгаантай нь хэвлэнэ
      console.log(`   [${label.id}] ${label.status} — ${label.reason}`);
      console.log(`         "${findText(label.id)}"`);
    }
  }
  const filteredCount = COMMENTS.length - relevant.length;
  console.log("");

  // ── 2. БҮЛЭГЛЭХ (зөвхөн RELEVANT) ──
  const groups = await groupComments(CLAUSE_TEXT, relevant);

  let groupedCount = 0;
  for (const group of groups) {
    groupedCount += group.commentIds.length;
  }
  console.log(`══ 2. ТООЛУУР: ${COMMENTS.length} санал → ${filteredCount} шүүгдсэн → ${groups.length} бүлэг`);
  console.log(`   Бүлэгт орсон: ${groupedCount}/${relevant.length} хамааралтай санал`);
  console.log("");

  // ── 3. Бүлэг бүрт ХАРИУ бичүүлнэ ──
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    console.log(`══ Бүлэг ${i + 1}: ${group.title} [${countWords(group.title)} үг] (${group.commentIds.length} санал)`);
    console.log(`   Товч: ${group.summary}`);

    // Бүлгийн саналуудын текстийг цуглуулна
    const texts: string[] = [];
    for (const id of group.commentIds) {
      const text = findText(id);
      texts.push(text);
      console.log(`   - [${id}] ${text}`);
    }

    // Эхний 3 саналыг жишээ болгож хариу бичүүлнэ.
    // AI алдаа гарвал тэр бүлгийг алгасаад дараагийнх руу шилжинэ.
    console.log("");
    try {
      const reply = await writeReply(CLAUSE_TEXT, {
        title: group.title,
        summary: group.summary,
        examples: texts.slice(0, 3),
      });
      console.log(`   ✉ Хариуны ноорог (${countWords(reply)} үг): ${reply}`);
    } catch {
      console.log("   ✉ Хариу бичиж чадсангүй (AI алдаа).");
    }
    console.log("");
  }
}

main();
