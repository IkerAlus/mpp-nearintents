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
