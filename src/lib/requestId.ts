import { useState } from 'react'

/**
 * A request id generated once per form mount. Transaction RPCs treat a repeated id as the same
 * request, so double-tapping "Save" cannot create duplicate records.
 */
export function useRequestId() {
  const [id, setId] = useState(() => crypto.randomUUID())
  return { requestId: id, renew: () => setId(crypto.randomUUID()) }
}
