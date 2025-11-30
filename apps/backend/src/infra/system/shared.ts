import crypto from "node:crypto";
import type { Clock, IdGenerator } from "@app/domain/services/shared-ports.js";

export function systemClock(): Clock {
    return {
        now: () => new Date()
    }
}

export function uuidGenerator(): IdGenerator {
    return {
        next: () => crypto.randomUUID()
    }
}