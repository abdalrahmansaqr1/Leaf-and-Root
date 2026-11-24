import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(request: Record<string, unknown>): Promise<string> {
    const ip = await super.getTracker(request);
    const body = request.body as { email?: unknown } | undefined;
    const email =
      typeof body?.email === "string" ? body.email.trim().normalize("NFC").toLowerCase() : "";
    return email ? `${email}|${ip}` : ip;
  }
}
