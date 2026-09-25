// GET /api/bills/[id] → BillDetail (иргэнд шүүгдсэн саналыг харуулахгүй)
import { NextResponse } from "next/server";
import { getUser, handleError } from "@/lib/auth";
import { getBillDetail } from "@/lib/law/queries";

export async function GET(_req: Request, ctx: RouteContext<"/api/bills/[id]">) {
  try {
    const { id } = await ctx.params;
    const user = await getUser();
    const isStaff = user?.role === "STAFF";

    const bill = await getBillDetail(id, isStaff);
    if (!bill) {
      return NextResponse.json({ error: "Төсөл олдсонгүй" }, { status: 404 });
    }
    return NextResponse.json(bill);
  } catch (e) {
    return handleError(e);
  }
}
