-- Питчийн demo: ParliamentAgenda/ParliamentVote mirror-оос 8 replay VoteEvent үүсгэнэ (тоо hidden* талбарт).
-- Дахин ажиллуулахад аюулгүй (upsert).
with picks(code, title, hook) as (values
 ('20250200015','Хянан шалгах түр хороо байгуулах тухай','УИХ хянан шалгах түр хороо байгуулахыг дэмжих үү?'),
 ('20250200030','2026 оны төсөвтэй холбогдуулан авах арга хэмжээ','Төсөвтэй холбоотой энэ тогтоолыг УИХ батлах уу?'),
 ('20260100004','Гэр бүлийн тухай хууль (шинэчилсэн найруулга)','Гэр бүлийн тухай шинэ хуулийг УИХ батлах уу?'),
 ('20260100083','Замын хөдөлгөөний аюулгүй байдлын хуулийн өөрчлөлт','Замын хөдөлгөөний дүрмийн хуулийн өөрчлөлтийг УИХ дэмжих үү?'),
 ('20260100123','Олон хүүхэдтэй эхийг урамшуулах хуулийн өөрчлөлт','Олон хүүхэдтэй ээжүүдийн урамшууллын өөрчлөлтийг УИХ батлах уу?'),
 ('20250200026','НӨАТ-ын хуулийн нэмэлт, өөрчлөлт','НӨАТ-ын хуулийн өөрчлөлтийг УИХ батлах уу?'),
 ('20250100097','Зээлийн хүүг бууруулах арга хэмжээ','Зээлийн хүүг бууруулах тогтоолыг УИХ дэмжих үү?'),
 ('20260100179','Эрүүл мэндийн тухай хуулийн нэмэлт, өөрчлөлт','Эрүүл мэндийн хуулийн өөрчлөлтийг УИХ батлах уу?')
)
insert into "VoteEvent"(id,"agendaCode","projectId",title,hook,status,"isReplay","hiddenSupport","hiddenOppose","hiddenTotal","createdAt","updatedAt")
select 'replay-'||p.code, p.code, pr.id, p.title, p.hook, 'OPEN', true, v.support, v.oppose, v.total, now(), now()
from picks p
join "ParliamentAgenda" a on a."agendaCode"=p.code
join "ParliamentVote" v on v."customId"=a."finalVoteId"
left join "Project" pr on pr."agendaCode"=p.code
on conflict ("agendaCode") do update set title=excluded.title, hook=excluded.hook, "isReplay"=true,
  "hiddenSupport"=excluded."hiddenSupport","hiddenOppose"=excluded."hiddenOppose","hiddenTotal"=excluded."hiddenTotal","updatedAt"=now()
returning "agendaCode", title, "hiddenSupport", "hiddenOppose", "hiddenTotal";
