;; Supply Registry Contract
;; Clarity v2
;; Manages registration and metadata updates for healthcare products in a decentralized supply chain

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-PRODUCT-ID u101)
(define-constant ERR-PRODUCT-EXISTS u102)
(define-constant ERR-PRODUCT-NOT-FOUND u103)
(define-constant ERR-INVALID-MANUFACTURER u104)
(define-constant ERR-PAUSED u105)
(define-constant ERR-INVALID-BATCH-STATUS u106)
(define-constant ERR-ZERO-ADDRESS u107)
(define-constant ERR-INVALID-METADATA u108)

;; Contract metadata
(define-constant CONTRACT-NAME "Supply Registry")
(define-constant MAX-METADATA-LEN u1000) ;; Max length for metadata strings
(define-constant MAX-PRODUCTS u1000000) ;; Max number of products

;; Batch status enum
(define-constant STATUS-PENDING u0)
(define-constant STATUS-APPROVED u1)
(define-constant STATUS-RECALL u2)

;; Admin and contract state
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var total-products uint u0)

;; Product data structure
(define-map products
  { product-id: (buff 32) }
  {
    manufacturer: principal,
    name: (string-ascii 100),
    batch-number: (string-ascii 50),
    manufacturing-date: uint,
    expiry-date: uint,
    metadata: (string-ascii 1000), ;; e.g., composition, storage conditions
    status: uint,
    created-at: uint
  }
)

;; Manufacturer registration
(define-map manufacturers principal bool)

;; Private helper: is-admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Private helper: ensure not paused
(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED))
)

;; Private helper: validate product ID
(define-private (validate-product-id (product-id (buff 32)))
  (asserts! (> (len product-id) u0) (err ERR-INVALID-PRODUCT-ID))
)

;; Private helper: validate metadata
(define-private (validate-metadata (metadata (string-ascii 1000)))
  (asserts! (<= (len metadata) MAX-METADATA-LEN) (err ERR-INVALID-METADATA))
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq new-admin 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (var-set admin new-admin)
    (ok true)
  )
)

;; Pause/unpause the contract
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused pause)
    (ok pause)
  )
)

;; Register a manufacturer
(define-public (register-manufacturer (manufacturer principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq manufacturer 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (asserts! (is-none? (map-get? manufacturers manufacturer)) (err ERR-INVALID-MANUFACTURER))
    (map-set manufacturers manufacturer true)
    (ok true)
  )
)

;; Deregister a manufacturer
(define-public (deregister-manufacturer (manufacturer principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-some? (map-get? manufacturers manufacturer)) (err ERR-INVALID-MANUFACTURER))
    (map-delete manufacturers manufacturer)
    (ok true)
  )
)

;; Register a new product
(define-public (register-product
  (product-id (buff 32))
  (name (string-ascii 100))
  (batch-number (string-ascii 50))
  (manufacturing-date uint)
  (expiry-date uint)
  (metadata (string-ascii 1000))
)
  (begin
    (ensure-not-paused)
    (asserts! (is-some? (map-get? manufacturers tx-sender)) (err ERR-INVALID-MANUFACTURER))
    (validate-product-id product-id)
    (validate-metadata metadata)
    (asserts! (is-none? (map-get? products { product-id: product-id })) (err ERR-PRODUCT-EXISTS))
    (asserts! (< (var-get total-products) MAX-PRODUCTS) (err ERR-INVALID-PRODUCT-ID))
    (asserts! (> expiry-date manufacturing-date) (err ERR-INVALID-METADATA))
    (map-set products
      { product-id: product-id }
      {
        manufacturer: tx-sender,
        name: name,
        batch-number: batch-number,
        manufacturing-date: manufacturing-date,
        expiry-date: uint,
        metadata: metadata,
        status: STATUS-PENDING,
        created-at: block-height
      }
    )
    (var-set total-products (+ (var-get total-products) u1))
    (ok true)
  )
)

;; Update product metadata
(define-public (update-product-metadata
  (product-id (buff 32))
  (metadata (string-ascii 1000))
)
  (begin
    (ensure-not-paused)
    (validate-product-id product-id)
    (validate-metadata metadata)
    (let ((product (unwrap! (map-get? products { product-id: product-id }) (err ERR-PRODUCT-NOT-FOUND))))
      (asserts! (is-eq (get manufacturer product) tx-sender) (err ERR-NOT-AUTHORIZED))
      (asserts! (is-eq (get status product) STATUS-PENDING) (err ERR-INVALID-BATCH-STATUS))
      (map-set products
        { product-id: product-id }
        (merge product { metadata: metadata })
      )
      (ok true)
    )
  )
)

;; Update batch status
(define-public (update-batch-status
  (product-id (buff 32))
  (status uint)
)
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (validate-product-id product-id)
    (asserts! (or (is-eq status STATUS-PENDING) (is-eq status STATUS-APPROVED) (is-eq status STATUS-RECALL)) (err ERR-INVALID-BATCH-STATUS))
    (let ((product (unwrap! (map-get? products { product-id: product-id }) (err ERR-PRODUCT-NOT-FOUND))))
      (map-set products
        { product-id: product-id }
        (merge product { status: status })
      )
      (ok true)
    )
  )
)

;; Read-only: get product details
(define-read-only (get-product (product-id (buff 32)))
  (ok (unwrap! (map-get? products { product-id: product-id }) (err ERR-PRODUCT-NOT-FOUND)))
)

;; Read-only: get total products
(define-read-only (get-total-products)
  (ok (var-get total-products))
)

;; Read-only: check if manufacturer
(define-read-only (is-manufacturer (account principal))
  (ok (default-to false (map-get? manufacturers account)))
)

;; Read-only: get admin
(define-read-only (get-admin)
  (ok (var-get admin))
)

;; Read-only: check if paused
(define-read-only (is-paused)
  (ok (var-get paused))
)