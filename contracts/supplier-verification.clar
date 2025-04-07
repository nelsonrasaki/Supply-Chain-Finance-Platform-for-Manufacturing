;; Supplier Verification Contract
;; This contract validates legitimate parts manufacturers

(define-data-var admin principal tx-sender)

;; Map to store verified suppliers
(define-map verified-suppliers
  principal
  {
    company-name: (string-utf8 100),
    verification-date: uint,
    is-verified: bool,
    industry: (string-utf8 50),
    verification-score: uint
  }
)

;; Public function to register a new supplier
(define-public (register-supplier (company-name (string-utf8 100)) (industry (string-utf8 50)))
  (let
    ((caller tx-sender))
    (begin
      (asserts! (not (is-supplier-registered caller)) (err u1))
      (ok (map-set verified-suppliers
        caller
        {
          company-name: company-name,
          verification-date: block-height,
          is-verified: false,
          industry: industry,
          verification-score: u0
        }
      ))
    )
  )
)

;; Admin function to verify a supplier
(define-public (verify-supplier (supplier principal) (verification-score uint))
  (begin
    (asserts! (is-admin tx-sender) (err u2))
    (asserts! (is-supplier-registered supplier) (err u3))
    (ok (map-set verified-suppliers
      supplier
      (merge (unwrap! (map-get? verified-suppliers supplier) (err u4))
        {
          is-verified: true,
          verification-date: block-height,
          verification-score: verification-score
        }
      )
    ))
  )
)

;; Read-only function to check if a supplier is verified
(define-read-only (is-supplier-verified (supplier principal))
  (default-to false
    (get is-verified (map-get? verified-suppliers supplier))
  )
)

;; Read-only function to check if a supplier is registered
(define-read-only (is-supplier-registered (supplier principal))
  (is-some (map-get? verified-suppliers supplier))
)

;; Read-only function to get supplier details
(define-read-only (get-supplier-details (supplier principal))
  (map-get? verified-suppliers supplier)
)

;; Helper function to check if caller is admin
(define-read-only (is-admin (caller principal))
  (is-eq caller (var-get admin))
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin tx-sender) (err u5))
    (ok (var-set admin new-admin))
  )
)
