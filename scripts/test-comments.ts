// scripts/test-comments.ts
// groupComments ба writeReply-г туршина: 15 саналыг бүлэглээд, бүлэг бүрт хариу бичүүлнэ.
// Ажиллуулах: npx tsx --env-file=.env scripts/test-comments.ts

import { groupComments } from "../lib/ai/comments";
import { writeReply } from "../lib/ai/reply";

// Саналууд аль заалтын талаар вэ (12.3-ын шинэ хувилбар)
const CLAUSE_TEXT =
  "12.3.Агаарын бохирдлын талаарх иргэний гомдлыг холбогдох байгууллага 14 хоногийн дотор шийдвэрлэнэ.";

// 15 жишээ санал. Санаагаар нь ойролцоогоор 5 бүлэг гарах ёстой:
// хугацааг бүр богиносгох / дэмжих / байгууллагын хүчин чадал / онлайн, ил тод байдал / заалттай холбоогүй
const COMMENTS = [
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

async function main() {
  console.log("AI_STUB =", process.env.AI_STUB || "(тохируулаагүй)");
  console.log("Заалт:", CLAUSE_TEXT);
  console.log("");

  // 1. Саналуудыг бүлэглэнэ
  const groups = await groupComments(CLAUSE_TEXT, COMMENTS);

  // 2. Бүх санал бүлэгт орсон эсэхийг тоолж шалгана
  let total = 0;
  for (const group of groups) {
    total += group.commentIds.length;
  }
  console.log(`${groups.length} бүлэг, бүлэгт орсон санал: ${total}/${COMMENTS.length}`);
  console.log("");

  // 3. Бүлэг бүрийг хэвлээд, хариу бичүүлнэ
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    console.log(`══ Бүлэг ${i + 1}: ${group.title} (${group.commentIds.length} санал)`);
    console.log(`   Товч: ${group.summary}`);

    // Бүлгийн саналуудын текстийг цуглуулна
    const texts: string[] = [];
    for (const id of group.commentIds) {
      const text = findText(id);
      texts.push(text);
      console.log(`   - [${id}] ${text}`);
    }

    // Эхний 3 саналыг жишээ болгож хариу бичүүлнэ.
    // Gemini завгүй байж алдаа гарвал тэр бүлгийг алгасаад дараагийнх руу шилжинэ.
    console.log("");
    try {
      const reply = await writeReply(CLAUSE_TEXT, {
        title: group.title,
        summary: group.summary,
        examples: texts.slice(0, 3),
      });
      console.log(`   ✉ Хариуны ноорог: ${reply}`);
    } catch {
      console.log("   ✉ Хариу бичиж чадсангүй (Gemini алдаа).");
    }
    console.log("");
  }
}

main();
