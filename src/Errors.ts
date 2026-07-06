import { Errors } from 'mppx'

/**
 * The deposit was verified but the cross-chain swap did not complete
 * (1Click terminal status `FAILED` or `REFUNDED`). The deposit is refunded to
 * `methodDetails.refundTo`; the client recovers with a fresh challenge.
 *
 * Additional error code registered by the `nearintents` spec (§Error Codes).
 */
export class SettlementFailedError extends Errors.PaymentError {
  override readonly name = 'SettlementFailedError'
  readonly title = 'Settlement Failed'
  override readonly status: number = 402
  readonly type = 'https://paymentauth.org/problems/settlement-failed'

  constructor(options: SettlementFailedError.Options = {}) {
    const { reason } = options
    super(
      reason
        ? `Settlement failed: ${reason}.`
        : 'Settlement failed: the cross-chain swap did not complete; the deposit is refunded to the refund address.',
    )
  }
}

export declare namespace SettlementFailedError {
  type Options = {
    /** Reason settlement failed (e.g. the 1Click refund reason). */
    reason?: string | undefined
  }
}

/**
 * The 1Click backend was unreachable during a required check. Per the spec
 * (§Verification), this MUST surface as an HTTP 5xx — never as
 * `verification-failed` — and the credential MUST NOT be settled or consumed.
 * The client retries the same credential once the backend recovers.
 */
export class SettlementUnavailableError extends Errors.PaymentError {
  override readonly name = 'SettlementUnavailableError'
  readonly title = 'Settlement Backend Unavailable'
  override readonly status: number = 503
  readonly type = 'https://paymentauth.org/problems/server-error'

  constructor(options: SettlementUnavailableError.Options = {}) {
    const { reason } = options
    super(
      reason
        ? `Settlement backend unavailable: ${reason}.`
        : 'Settlement backend unavailable; retry the same credential later.',
    )
  }
}

export declare namespace SettlementUnavailableError {
  type Options = {
    reason?: string | undefined
  }
}

/**
 * Settlement did not reach a terminal state within the server's time budget.
 * The swap may still complete; the credential is NOT consumed, so the client
 * can re-present the same credential later (or wait for the refund path).
 */
export class SettlementTimeoutError extends Errors.PaymentError {
  override readonly name = 'SettlementTimeoutError'
  readonly title = 'Settlement Timeout'
  override readonly status: number = 504
  readonly type = 'https://paymentauth.org/problems/server-error'

  constructor(options: SettlementTimeoutError.Options = {}) {
    const { timeoutMs } = options
    super(
      `Settlement did not reach a terminal state${
        timeoutMs !== undefined ? ` within ${timeoutMs}ms` : ''
      }; re-present the same credential later.`,
    )
  }
}

export declare namespace SettlementTimeoutError {
  type Options = {
    timeoutMs?: number | undefined
  }
}
