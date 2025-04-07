### Supply Chain Finance Platform for Manufacturing

A blockchain-based platform built with Clarity smart contracts that streamlines supply chain finance for manufacturing businesses.





## Overview

This platform addresses key challenges in manufacturing supply chains by providing a secure, transparent, and efficient system for managing financial transactions between buyers, suppliers, and financial institutions.

### Key Features

- **Supplier Verification**: Validate legitimate parts manufacturers
- **Purchase Order Management**: Record and track confirmed orders
- **Invoice Tokenization**: Convert receivables into tradable assets
- **Early Payment Options**: Manage discounted settlement options


## Technology Stack

- **Smart Contracts**: Clarity (.clar)
- **Testing Framework**: Vitest
- **Blockchain**: Stacks


## Smart Contracts

### Supplier Verification Contract

Validates and maintains a registry of legitimate parts manufacturers.

```plaintext
;; Register a new supplier
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

;; Verify a supplier (admin only)
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
```

### Purchase Order Contract

Records confirmed orders from buyers to suppliers.

```plaintext
;; Create a purchase order
(define-public (create-purchase-order 
  (supplier principal) 
  (items (list 20 {
    item-id: (string-utf8 50),
    quantity: uint,
    price-per-unit: uint
  }))
)
  (let
    (
      (buyer tx-sender)
      (po-id (+ (var-get po-counter) u1))
      (total (fold calculate-total items u0))
      (buyer-pos (default-to (list) (map-get? buyer-purchase-orders buyer)))
      (supplier-pos (default-to (list) (map-get? supplier-purchase-orders supplier)))
    )
    (begin
      (asserts! (> (len items) u0) (err u1))
      (var-set po-counter po-id)
      (map-set purchase-orders
        po-id
        {
          buyer: buyer,
          supplier: supplier,
          total-amount: total,
          creation-date: block-height,
          status: "created",
          items: items
        }
      )
      (map-set buyer-purchase-orders buyer (append buyer-pos po-id))
      (map-set supplier-purchase-orders supplier (append supplier-pos po-id))
      (ok po-id)
    )
  )
)
```

### Invoice Tokenization Contract

Converts receivables into tradable assets using NFTs.

```plaintext
;; Tokenize an invoice
(define-public (tokenize-invoice (invoice-id uint))
  (let
    (
      (invoice (unwrap! (map-get? invoices invoice-id) (err u3)))
      (supplier tx-sender)
    )
    (begin
      (asserts! (is-eq supplier (get supplier invoice)) (err u4))
      (asserts! (not (get tokenized invoice)) (err u5))
      (asserts! (is-eq (get status invoice) "pending") (err u6))
      (try! (nft-mint? invoice-token invoice-id supplier))
      (ok (map-set invoices
        invoice-id
        (merge invoice { tokenized: true })
      ))
    )
  )
)

;; Transfer an invoice token
(define-public (transfer-invoice-token (invoice-id uint) (recipient principal))
  (begin
    (asserts! (is-owner-of-invoice-token invoice-id tx-sender) (err u7))
    (try! (nft-transfer? invoice-token invoice-id tx-sender recipient))
    (ok true)
  )
)
```

### Early Payment Contract

Manages discounted settlement options for early payments.

```plaintext
;; Make an early payment with discount
(define-public (make-early-payment (invoice-id uint) (days-early uint))
  (let
    (
      (contract-invoice-tokenization (unwrap! (contract-call? .invoice-tokenization get-invoice invoice-id) (err u2)))
      (supplier (get supplier contract-invoice-tokenization))
      (buyer tx-sender)
      (invoice-amount (get amount contract-invoice-tokenization))
      (discount-amount (calculate-discount supplier invoice-amount days-early))
      (payment-amount (- invoice-amount discount-amount))
    )
    (begin
      (asserts! (is-eq buyer (get buyer contract-invoice-tokenization)) (err u3))
      (asserts! (is-eq (get status contract-invoice-tokenization) "pending") (err u4))
      (try! (contract-call? .invoice-tokenization pay-invoice invoice-id))
      (map-set early-payments
        invoice-id
        {
          original-amount: invoice-amount,
          discount-amount: discount-amount,
          payment-amount: payment-amount,
          payment-date: block-height,
          days-early: days-early
        }
      )
      (ok payment-amount)
    )
  )
)
```

## System Architecture

The platform consists of four interconnected smart contracts:

```mermaid
Contract Interaction Flow.download-icon {
            cursor: pointer;
            transform-origin: center;
        }
        .download-icon .arrow-part {
            transition: transform 0.35s cubic-bezier(0.35, 0.2, 0.14, 0.95);
             transform-origin: center;
        }
        button:has(.download-icon):hover .download-icon .arrow-part, button:has(.download-icon):focus-visible .download-icon .arrow-part {
          transform: translateY(-1.5px);
        }
        #mermaid-diagram-r6rt{font-family:var(--font-geist-sans);font-size:12px;fill:#000000;}#mermaid-diagram-r6rt .error-icon{fill:#552222;}#mermaid-diagram-r6rt .error-text{fill:#552222;stroke:#552222;}#mermaid-diagram-r6rt .edge-thickness-normal{stroke-width:1px;}#mermaid-diagram-r6rt .edge-thickness-thick{stroke-width:3.5px;}#mermaid-diagram-r6rt .edge-pattern-solid{stroke-dasharray:0;}#mermaid-diagram-r6rt .edge-thickness-invisible{stroke-width:0;fill:none;}#mermaid-diagram-r6rt .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-diagram-r6rt .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-diagram-r6rt .marker{fill:#666;stroke:#666;}#mermaid-diagram-r6rt .marker.cross{stroke:#666;}#mermaid-diagram-r6rt svg{font-family:var(--font-geist-sans);font-size:12px;}#mermaid-diagram-r6rt p{margin:0;}#mermaid-diagram-r6rt .label{font-family:var(--font-geist-sans);color:#000000;}#mermaid-diagram-r6rt .cluster-label text{fill:#333;}#mermaid-diagram-r6rt .cluster-label span{color:#333;}#mermaid-diagram-r6rt .cluster-label span p{background-color:transparent;}#mermaid-diagram-r6rt .label text,#mermaid-diagram-r6rt span{fill:#000000;color:#000000;}#mermaid-diagram-r6rt .node rect,#mermaid-diagram-r6rt .node circle,#mermaid-diagram-r6rt .node ellipse,#mermaid-diagram-r6rt .node polygon,#mermaid-diagram-r6rt .node path{fill:#eee;stroke:#999;stroke-width:1px;}#mermaid-diagram-r6rt .rough-node .label text,#mermaid-diagram-r6rt .node .label text{text-anchor:middle;}#mermaid-diagram-r6rt .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#mermaid-diagram-r6rt .node .label{text-align:center;}#mermaid-diagram-r6rt .node.clickable{cursor:pointer;}#mermaid-diagram-r6rt .arrowheadPath{fill:#333333;}#mermaid-diagram-r6rt .edgePath .path{stroke:#666;stroke-width:2.0px;}#mermaid-diagram-r6rt .flowchart-link{stroke:#666;fill:none;}#mermaid-diagram-r6rt .edgeLabel{background-color:white;text-align:center;}#mermaid-diagram-r6rt .edgeLabel p{background-color:white;}#mermaid-diagram-r6rt .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#mermaid-diagram-r6rt .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#mermaid-diagram-r6rt .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#mermaid-diagram-r6rt .cluster text{fill:#333;}#mermaid-diagram-r6rt .cluster span{color:#333;}#mermaid-diagram-r6rt div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:var(--font-geist-sans);font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#mermaid-diagram-r6rt .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#mermaid-diagram-r6rt .flowchart-link{stroke:hsl(var(--gray-400));stroke-width:1px;}#mermaid-diagram-r6rt .marker,#mermaid-diagram-r6rt marker,#mermaid-diagram-r6rt marker *{fill:hsl(var(--gray-400))!important;stroke:hsl(var(--gray-400))!important;}#mermaid-diagram-r6rt .label,#mermaid-diagram-r6rt text,#mermaid-diagram-r6rt text>tspan{fill:hsl(var(--black))!important;color:hsl(var(--black))!important;}#mermaid-diagram-r6rt .background,#mermaid-diagram-r6rt rect.relationshipLabelBox{fill:hsl(var(--white))!important;}#mermaid-diagram-r6rt .entityBox,#mermaid-diagram-r6rt .attributeBoxEven{fill:hsl(var(--gray-150))!important;}#mermaid-diagram-r6rt .attributeBoxOdd{fill:hsl(var(--white))!important;}#mermaid-diagram-r6rt .label-container,#mermaid-diagram-r6rt rect.actor{fill:hsl(var(--white))!important;stroke:hsl(var(--gray-400))!important;}#mermaid-diagram-r6rt line{stroke:hsl(var(--gray-400))!important;}#mermaid-diagram-r6rt :root{--mermaid-font-family:var(--font-geist-sans);}Supplier VerificationPurchase OrderInvoice TokenizationEarly Payment
```

## Getting Started

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) - Clarity development environment
- [Node.js](https://nodejs.org/) - For running tests


### Installation

1. Clone the repository

```shellscript
git clone https://github.com/yourusername/supply-chain-finance.git
cd supply-chain-finance
```


2. Install dependencies

```shellscript
npm install
```


3. Run tests

```shellscript
npm test
```




## Usage Examples

### Complete Workflow Example

```plaintext
;; 1. Register a supplier
(contract-call? .supplier-verification register-supplier "Acme Parts" "Manufacturing")

;; 2. Admin verifies the supplier
(contract-call? .supplier-verification verify-supplier 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG u85)

;; 3. Buyer creates a purchase order
(contract-call? .purchase-order create-purchase-order 
  'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG 
  (list 
    {item-id: "PART-A", quantity: u10, price-per-unit: u100}
    {item-id: "PART-B", quantity: u5, price-per-unit: u200}
  )
)

;; 4. Supplier accepts the purchase order
(contract-call? .purchase-order accept-purchase-order u1)

;; 5. Supplier creates an invoice
(contract-call? .invoice-tokenization create-invoice 
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM 
  u1500 
  u130 
  u1
)

;; 6. Supplier tokenizes the invoice
(contract-call? .invoice-tokenization tokenize-invoice u1)

;; 7. Supplier sets discount rates
(contract-call? .early-payment set-discount-rates u200 u400 u600)

;; 8. Buyer makes an early payment with discount
(contract-call? .early-payment make-early-payment u1 u60)
```

## Deployment Guide

1. Deploy the contracts in the following order:

```shellscript
# Deploy supplier verification contract
clarinet contract publish supplier-verification.clar --network mainnet

# Deploy purchase order contract
clarinet contract publish purchase-order.clar --network mainnet

# Deploy invoice tokenization contract
clarinet contract publish invoice-tokenization.clar --network mainnet

# Deploy early payment contract
clarinet contract publish early-payment.clar --network mainnet
```


2. Update contract references if needed:

1. The early payment contract needs to reference the invoice tokenization contract





## Testing

Run the test suite:

```shellscript
npm test
```

The tests use Vitest and mock the Clarity contract environment to test all contract functions.

## Error Codes

| Contract | Error Code | Description
|-----|-----|-----
| Supplier Verification | u1 | Supplier already registered
| Supplier Verification | u2 | Not authorized (admin only)
| Supplier Verification | u3 | Supplier not registered
| Purchase Order | u1 | Empty items list
| Purchase Order | u2 | Purchase order not found
| Purchase Order | u3 | Not the supplier
| Purchase Order | u4 | Invalid status
| Invoice Tokenization | u1 | Invalid amount
| Invoice Tokenization | u2 | Invalid due date
| Invoice Tokenization | u3 | Invoice not found
| Early Payment | u1 | Invalid discount rate
| Early Payment | u2 | Invoice not found
| Early Payment | u3 | Not the buyer


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


### Coding Standards

- Follow Clarity best practices
- Include comments for complex logic
- Add tests for all new functionality
- Update documentation as needed


## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Link: [https://github.com/yourusername/supply-chain-finance](https://github.com/yourusername/supply-chain-finance)

## Acknowledgments

- Stacks blockchain community
- Clarity language documentation
- Contributors to the project
