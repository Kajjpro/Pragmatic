import { NextResponse } from "next/server";
import { getUser, handleError, HttpError } from "@/lib/auth";
import { getBillView } from "@/lib/law/queries";

export async function GET(_req: Request, ctx: RouteContext<"/api/bills/[id]">) {
  try {
    const { id } = await ctx.params;
    const user = await getUser();

    const bill = await getBillView(id, user?.role === "STAFF");
    if (!bill) throw new HttpError(404, "Төсөл олдсонгүй");
    return NextResponse.json(bill);
  } catch (e) {
    return handleError(e);
  }
}
